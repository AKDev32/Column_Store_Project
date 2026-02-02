/**
 * Column Store Database Engine
 * Implements columnar storage with compression and query optimization
 */

class ColumnStore {
    constructor() {
        this.tables = new Map();
        this.indexes = new Map();
        this.statistics = new Map();
    }

    /**
     * Create a new table with columnar storage
     */
    createTable(tableName, schema) {
        const table = {
            name: tableName,
            schema: schema,
            columns: new Map(),
            rowCount: 0,
            metadata: {
                created: new Date(),
                lastModified: new Date(),
                compressionRatio: 0,
                totalSize: 0
            }
        };

        // Initialize columns
        schema.forEach(col => {
            table.columns.set(col.name, {
                name: col.name,
                type: col.type,
                data: [],
                nullBitmap: [],
                compression: this.selectCompression(col.type),
                dictionary: col.type === 'string' ? new Map() : null,
                stats: {
                    min: null,
                    max: null,
                    distinctCount: 0,
                    nullCount: 0
                }
            });
        });

        this.tables.set(tableName, table);
        return table;
    }

    /**
     * Select optimal compression algorithm based on data type
     */
    selectCompression(type) {
        switch(type) {
            case 'string':
                return 'dictionary';
            case 'integer':
                return 'rle'; // Run-length encoding
            case 'float':
                return 'delta';
            case 'boolean':
                return 'bitmap';
            default:
                return 'none';
        }
    }

    /**
     * Insert data into table
     */
    insert(tableName, rows) {
        const table = this.tables.get(tableName);
        if (!table) throw new Error(`Table ${tableName} not found`);

        const startTime = performance.now();

        rows.forEach(row => {
            table.schema.forEach(col => {
                const column = table.columns.get(col.name);
                const value = row[col.name];

                if (value === null || value === undefined) {
                    column.nullBitmap.push(1);
                    column.data.push(null);
                    column.stats.nullCount++;
                } else {
                    column.nullBitmap.push(0);
                    
                    // Dictionary encoding for strings
                    if (col.type === 'string' && column.dictionary) {
                        if (!column.dictionary.has(value)) {
                            column.dictionary.set(value, column.dictionary.size);
                        }
                        column.data.push(column.dictionary.get(value));
                    } else {
                        column.data.push(value);
                    }

                    // Update statistics
                    this.updateColumnStats(column, value);
                }
            });
            table.rowCount++;
        });

        table.metadata.lastModified = new Date();
        const insertTime = performance.now() - startTime;

        return {
            rowsInserted: rows.length,
            insertTime: insertTime.toFixed(2) + 'ms',
            compressionRatio: this.calculateCompression(table)
        };
    }

    /**
     * Update column statistics
     */
    updateColumnStats(column, value) {
        if (column.stats.min === null || value < column.stats.min) {
            column.stats.min = value;
        }
        if (column.stats.max === null || value > column.stats.max) {
            column.stats.max = value;
        }
    }

    /**
     * Calculate compression ratio
     */
    calculateCompression(table) {
        let uncompressedSize = 0;
        let compressedSize = 0;

        table.columns.forEach(column => {
            // Estimate uncompressed size (assuming 8 bytes per value)
            uncompressedSize += column.data.length * 8;

            // Estimate compressed size
            if (column.dictionary) {
                // Dictionary: unique values + references
                compressedSize += column.dictionary.size * 20; // avg string size
                compressedSize += column.data.length * 2; // references
            } else {
                // Other compressions (simplified)
                compressedSize += column.data.length * 4;
            }

            // Add null bitmap
            compressedSize += Math.ceil(column.nullBitmap.length / 8);
        });

        const ratio = (uncompressedSize / compressedSize).toFixed(2);
        table.metadata.compressionRatio = ratio;
        table.metadata.totalSize = compressedSize;
        
        return ratio;
    }

    /**
     * Scan column with predicate pushdown
     */
    scan(tableName, columns, predicate = null) {
        const table = this.tables.get(tableName);
        if (!table) throw new Error(`Table ${tableName} not found`);

        const startTime = performance.now();
        const results = [];
        const selectedColumns = columns || Array.from(table.columns.keys());

        // Build bitmap for matching rows
        const matchBitmap = new Array(table.rowCount).fill(true);
        
        if (predicate) {
            this.applyPredicate(table, predicate, matchBitmap);
        }

        // Materialize results only for matching rows
        for (let i = 0; i < table.rowCount; i++) {
            if (matchBitmap[i]) {
                const row = {};
                selectedColumns.forEach(colName => {
                    const column = table.columns.get(colName);
                    let value = column.data[i];
                    
                    // Decompress dictionary values
                    if (column.dictionary && value !== null) {
                        // Reverse lookup
                        for (let [k, v] of column.dictionary) {
                            if (v === value) {
                                value = k;
                                break;
                            }
                        }
                    }
                    
                    row[colName] = column.nullBitmap[i] ? null : value;
                });
                results.push(row);
            }
        }

        const scanTime = performance.now() - startTime;

        return {
            data: results,
            metadata: {
                rowsScanned: table.rowCount,
                rowsReturned: results.length,
                scanTime: scanTime.toFixed(2) + 'ms',
                columnsScanned: selectedColumns.length
            }
        };
    }

    /**
     * Apply predicate to build matching bitmap
     */
    applyPredicate(table, predicate, matchBitmap) {
        const { column: colName, operator, value } = predicate;
        const column = table.columns.get(colName);

        for (let i = 0; i < table.rowCount; i++) {
            let colValue = column.data[i];
            
            // Handle dictionary encoding
            if (column.dictionary && colValue !== null) {
                for (let [k, v] of column.dictionary) {
                    if (v === colValue) {
                        colValue = k;
                        break;
                    }
                }
            }

            // Skip nulls
            if (column.nullBitmap[i]) {
                matchBitmap[i] = false;
                continue;
            }

            // Apply operator
            switch(operator) {
                case '=':
                    matchBitmap[i] = colValue === value;
                    break;
                case '>':
                    matchBitmap[i] = colValue > value;
                    break;
                case '<':
                    matchBitmap[i] = colValue < value;
                    break;
                case '>=':
                    matchBitmap[i] = colValue >= value;
                    break;
                case '<=':
                    matchBitmap[i] = colValue <= value;
                    break;
                case '!=':
                    matchBitmap[i] = colValue !== value;
                    break;
                default:
                    matchBitmap[i] = true;
            }
        }
    }

    /**
     * Aggregate function (SUM, AVG, COUNT, MIN, MAX)
     */
    aggregate(tableName, aggregates, groupBy = null, predicate = null) {
        const table = this.tables.get(tableName);
        if (!table) throw new Error(`Table ${tableName} not found`);

        const startTime = performance.now();

        // First, scan with predicate
        const scanResult = this.scan(tableName, null, predicate);
        const data = scanResult.data;

        let results;

        if (groupBy) {
            // Group by aggregation
            const groups = new Map();

            data.forEach(row => {
                const key = row[groupBy];
                if (!groups.has(key)) {
                    groups.set(key, []);
                }
                groups.get(key).push(row);
            });

            results = [];
            groups.forEach((rows, key) => {
                const result = { [groupBy]: key };
                aggregates.forEach(agg => {
                    result[agg.alias || agg.function] = this.computeAggregate(
                        rows,
                        agg.column,
                        agg.function
                    );
                });
                results.push(result);
            });
        } else {
            // Simple aggregation
            const result = {};
            aggregates.forEach(agg => {
                result[agg.alias || agg.function] = this.computeAggregate(
                    data,
                    agg.column,
                    agg.function
                );
            });
            results = [result];
        }

        const aggTime = performance.now() - startTime;

        return {
            data: results,
            metadata: {
                aggregateTime: aggTime.toFixed(2) + 'ms',
                groupCount: groupBy ? results.length : 1
            }
        };
    }

    /**
     * Compute single aggregate
     */
    computeAggregate(rows, column, func) {
        const values = rows.map(r => r[column]).filter(v => v !== null);

        switch(func.toUpperCase()) {
            case 'COUNT':
                return column === '*' ? rows.length : values.length;
            case 'SUM':
                return values.reduce((a, b) => a + b, 0);
            case 'AVG':
                return values.reduce((a, b) => a + b, 0) / values.length;
            case 'MIN':
                return Math.min(...values);
            case 'MAX':
                return Math.max(...values);
            default:
                throw new Error(`Unknown aggregate function: ${func}`);
        }
    }

    /**
     * Get table information
     */
    getTableInfo(tableName) {
        const table = this.tables.get(tableName);
        if (!table) throw new Error(`Table ${tableName} not found`);

        const columns = [];
        table.columns.forEach((col, name) => {
            columns.push({
                name: name,
                type: table.schema.find(s => s.name === name).type,
                compression: col.compression,
                rowCount: col.data.length,
                nullCount: col.stats.nullCount,
                distinctValues: col.dictionary ? col.dictionary.size : 'N/A',
                min: col.stats.min,
                max: col.stats.max
            });
        });

        return {
            name: table.name,
            rowCount: table.rowCount,
            columnCount: table.columns.size,
            compressionRatio: table.metadata.compressionRatio,
            totalSize: (table.metadata.totalSize / 1024).toFixed(2) + ' KB',
            created: table.metadata.created,
            lastModified: table.metadata.lastModified,
            columns: columns
        };
    }

    /**
     * Generate sample data
     */
    static generateSampleData(rowCount = 1000) {
        const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];
        const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
        const data = [];

        for (let i = 0; i < rowCount; i++) {
            data.push({
                id: i + 1,
                name: names[Math.floor(Math.random() * names.length)] + ' ' + (i + 1),
                department: departments[Math.floor(Math.random() * departments.length)],
                salary: Math.floor(Math.random() * 100000) + 30000,
                age: Math.floor(Math.random() * 40) + 22,
                active: Math.random() > 0.2
            });
        }

        return data;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ColumnStore;
}