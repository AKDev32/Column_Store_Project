/**
 * SQL Query Engine
 * Parses and executes SQL queries on the column store
 */

class QueryEngine {
    constructor(columnStore) {
        this.store = columnStore;
        this.queryHistory = [];
    }

    /**
     * Parse and execute SQL query
     */
    execute(sql) {
        const startTime = performance.now();
        
        try {
            const query = this.parse(sql);
            const executionPlan = this.createExecutionPlan(query);
            const result = this.executeQuery(query);
            
            const totalTime = performance.now() - startTime;
            
            const execution = {
                sql: sql,
                timestamp: new Date(),
                executionTime: totalTime.toFixed(2) + 'ms',
                rowsAffected: result.data.length,
                success: true,
                executionPlan: executionPlan
            };
            
            this.queryHistory.push(execution);
            
            return {
                ...result,
                execution: execution
            };
        } catch (error) {
            const totalTime = performance.now() - startTime;
            
            const execution = {
                sql: sql,
                timestamp: new Date(),
                executionTime: totalTime.toFixed(2) + 'ms',
                error: error.message,
                success: false
            };
            
            this.queryHistory.push(execution);
            
            throw error;
        }
    }

    /**
     * Simple SQL parser (supports basic SELECT queries)
     */
    parse(sql) {
        sql = sql.trim().replace(/\s+/g, ' ');
        
        const query = {
            type: null,
            table: null,
            columns: [],
            where: null,
            groupBy: null,
            orderBy: null,
            limit: null,
            aggregates: []
        };

        // Determine query type
        if (sql.toUpperCase().startsWith('SELECT')) {
            query.type = 'SELECT';
        } else {
            throw new Error('Only SELECT queries are supported');
        }

        // Parse SELECT clause
        const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM/i);
        if (!selectMatch) {
            throw new Error('Invalid SELECT syntax');
        }

        const selectClause = selectMatch[1].trim();
        if (selectClause === '*') {
            query.columns = ['*'];
        } else {
            const columns = selectClause.split(',').map(c => c.trim());
            columns.forEach(col => {
                // Check for aggregate functions
                const aggMatch = col.match(/(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*(\*|[\w]+)\s*\)(?:\s+AS\s+(\w+))?/i);
                if (aggMatch) {
                    query.aggregates.push({
                        function: aggMatch[1].toUpperCase(),
                        column: aggMatch[2],
                        alias: aggMatch[3] || null
                    });
                } else {
                    query.columns.push(col);
                }
            });
        }

        // Parse FROM clause
        const fromMatch = sql.match(/FROM\s+(\w+)/i);
        if (!fromMatch) {
            throw new Error('FROM clause is required');
        }
        query.table = fromMatch[1];

        // Parse WHERE clause
        const whereMatch = sql.match(/WHERE\s+(.*?)(?:\s+GROUP BY|\s+ORDER BY|\s+LIMIT|$)/i);
        if (whereMatch) {
            const whereClause = whereMatch[1].trim();
            query.where = this.parseWhere(whereClause);
        }

        // Parse GROUP BY clause
        const groupByMatch = sql.match(/GROUP BY\s+([\w]+)/i);
        if (groupByMatch) {
            query.groupBy = groupByMatch[1];
        }

        // Parse ORDER BY clause
        const orderByMatch = sql.match(/ORDER BY\s+([\w]+)(?:\s+(ASC|DESC))?/i);
        if (orderByMatch) {
            query.orderBy = {
                column: orderByMatch[1],
                direction: orderByMatch[2] ? orderByMatch[2].toUpperCase() : 'ASC'
            };
        }

        // Parse LIMIT clause
        const limitMatch = sql.match(/LIMIT\s+(\d+)/i);
        if (limitMatch) {
            query.limit = parseInt(limitMatch[1]);
        }

        return query;
    }

    /**
     * Parse WHERE clause into predicate
     */
    parseWhere(whereClause) {
        // Simple parser - supports single conditions
        const match = whereClause.match(/([\w]+)\s*(=|>|<|>=|<=|!=)\s*(['"]?)(.*?)\3/);
        
        if (!match) {
            throw new Error('Invalid WHERE clause');
        }

        let value = match[4];
        
        // Try to parse as number
        if (!isNaN(value)) {
            value = parseFloat(value);
        }

        return {
            column: match[1],
            operator: match[2],
            value: value
        };
    }

    /**
     * Create execution plan
     */
    createExecutionPlan(query) {
        const steps = [];

        steps.push({
            step: 1,
            operation: 'Table Scan',
            target: query.table,
            description: `Scan table ${query.table}`,
            cost: 'O(n)'
        });

        if (query.where) {
            steps.push({
                step: 2,
                operation: 'Filter',
                target: `${query.where.column} ${query.where.operator} ${query.where.value}`,
                description: 'Apply predicate pushdown',
                cost: 'O(n)'
            });
        }

        if (query.aggregates.length > 0) {
            steps.push({
                step: steps.length + 1,
                operation: 'Aggregate',
                target: query.aggregates.map(a => `${a.function}(${a.column})`).join(', '),
                description: query.groupBy ? `Group by ${query.groupBy}` : 'Compute aggregates',
                cost: query.groupBy ? 'O(n log n)' : 'O(n)'
            });
        }

        if (query.orderBy) {
            steps.push({
                step: steps.length + 1,
                operation: 'Sort',
                target: `${query.orderBy.column} ${query.orderBy.direction}`,
                description: 'Sort results',
                cost: 'O(n log n)'
            });
        }

        if (query.limit) {
            steps.push({
                step: steps.length + 1,
                operation: 'Limit',
                target: query.limit,
                description: `Return first ${query.limit} rows`,
                cost: 'O(1)'
            });
        }

        steps.push({
            step: steps.length + 1,
            operation: 'Projection',
            target: query.columns.join(', '),
            description: 'Project selected columns',
            cost: 'O(m)'
        });

        return steps;
    }

    /**
     * Execute parsed query
     */
    executeQuery(query) {
        let result;

        if (query.aggregates.length > 0) {
            // Aggregate query
            result = this.store.aggregate(
                query.table,
                query.aggregates,
                query.groupBy,
                query.where
            );
        } else {
            // Simple select
            const columns = query.columns[0] === '*' ? null : query.columns;
            result = this.store.scan(query.table, columns, query.where);
        }

        let data = result.data;

        // Apply ORDER BY
        if (query.orderBy) {
            data = this.applyOrderBy(data, query.orderBy);
        }

        // Apply LIMIT
        if (query.limit) {
            data = data.slice(0, query.limit);
        }

        return {
            data: data,
            metadata: result.metadata
        };
    }

    /**
     * Apply ORDER BY to results
     */
    applyOrderBy(data, orderBy) {
        return [...data].sort((a, b) => {
            const aVal = a[orderBy.column];
            const bVal = b[orderBy.column];

            if (aVal < bVal) return orderBy.direction === 'ASC' ? -1 : 1;
            if (aVal > bVal) return orderBy.direction === 'ASC' ? 1 : -1;
            return 0;
        });
    }

    /**
     * Get query examples
     */
    static getExamples() {
        return {
            select: `SELECT id, name, department, salary 
FROM employees 
WHERE salary > 50000 
ORDER BY salary DESC 
LIMIT 10`,
            aggregate: `SELECT department, COUNT(*) AS count, AVG(salary) AS avg_salary 
FROM employees 
GROUP BY department 
ORDER BY avg_salary DESC`,
            join: `-- JOIN operations coming soon!
SELECT e.name, d.name as dept_name 
FROM employees e 
JOIN departments d ON e.department_id = d.id`
        };
    }

    /**
     * Get query history
     */
    getHistory(limit = 10) {
        return this.queryHistory.slice(-limit).reverse();
    }

    /**
     * Clear query history
     */
    clearHistory() {
        this.queryHistory = [];
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QueryEngine;
}