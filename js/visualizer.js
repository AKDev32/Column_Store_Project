/**
 * Storage Visualizer
 * Visualizes row-based vs column-based storage layouts
 */

class StorageVisualizer {
    constructor() {
        this.rowCanvas = null;
        this.columnCanvas = null;
        this.animationFrame = null;
    }

    /**
     * Initialize visualizers
     */
    init(rowContainerId, columnContainerId) {
        this.rowCanvas = this.createCanvas(rowContainerId);
        this.columnCanvas = this.createCanvas(columnContainerId);
    }

    /**
     * Create canvas element
     */
    createCanvas(containerId) {
        const container = document.getElementById(containerId);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = 300;
        canvas.style.width = '100%';
        canvas.style.height = '300px';

        container.appendChild(canvas);

        return { canvas, ctx };
    }

    /**
     * Visualize storage layouts with sample data
     */
    visualize(sampleData, rowCount = 10) {
        if (!this.rowCanvas || !this.columnCanvas) return;

        const data = sampleData.slice(0, rowCount);
        
        this.visualizeRowStore(this.rowCanvas, data);
        this.visualizeColumnStore(this.columnCanvas, data);
    }

    /**
     * Visualize row-based storage
     */
    visualizeRowStore(canvasObj, data) {
        const { canvas, ctx } = canvasObj;
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        const padding = 20;
        const rowHeight = 25;
        const cellPadding = 5;
        const startY = padding;

        // Get columns
        const columns = Object.keys(data[0] || {});
        const colWidth = (width - padding * 2) / columns.length;

        // Draw header
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 12px JetBrains Mono';
        columns.forEach((col, i) => {
            ctx.fillText(
                col.toUpperCase(),
                padding + i * colWidth + cellPadding,
                startY + 15
            );
        });

        // Draw rows
        data.forEach((row, rowIndex) => {
            const y = startY + (rowIndex + 1) * rowHeight;

            // Highlight entire row
            ctx.fillStyle = rowIndex % 2 === 0 ? 'rgba(0, 255, 136, 0.05)' : 'rgba(0, 255, 136, 0.02)';
            ctx.fillRect(padding, y, width - padding * 2, rowHeight);

            // Draw border for row
            ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)';
            ctx.strokeRect(padding, y, width - padding * 2, rowHeight);

            // Draw cells
            ctx.fillStyle = '#f5f5f5';
            ctx.font = '11px JetBrains Mono';
            columns.forEach((col, colIndex) => {
                const value = String(row[col]);
                const truncated = value.length > 12 ? value.substring(0, 12) + '...' : value;
                
                ctx.fillText(
                    truncated,
                    padding + colIndex * colWidth + cellPadding,
                    y + 17
                );

                // Column separators
                if (colIndex < columns.length - 1) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.beginPath();
                    ctx.moveTo(padding + (colIndex + 1) * colWidth, y);
                    ctx.lineTo(padding + (colIndex + 1) * colWidth, y + rowHeight);
                    ctx.stroke();
                }
            });
        });

        // Draw label
        ctx.fillStyle = '#a0a0a0';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(
            'Row-oriented: Each row stored contiguously in memory',
            padding,
            height - 10
        );
    }

    /**
     * Visualize column-based storage
     */
    visualizeColumnStore(canvasObj, data) {
        const { canvas, ctx } = canvasObj;
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        const padding = 20;
        const colWidth = 80;
        const cellHeight = 22;
        const cellPadding = 5;
        const startX = padding;

        // Get columns
        const columns = Object.keys(data[0] || {});
        const colSpacing = (width - padding * 2) / columns.length;

        columns.forEach((col, colIndex) => {
            const x = startX + colIndex * colSpacing;

            // Draw column header
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 12px JetBrains Mono';
            ctx.fillText(col.toUpperCase(), x + cellPadding, padding + 15);

            // Draw column block background
            ctx.fillStyle = 'rgba(0, 255, 136, 0.08)';
            ctx.fillRect(x, padding + 25, colWidth, data.length * cellHeight);

            // Draw column block border
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, padding + 25, colWidth, data.length * cellHeight);

            // Draw cells in column
            data.forEach((row, rowIndex) => {
                const y = padding + 25 + rowIndex * cellHeight;
                const value = String(row[col]);
                const truncated = value.length > 10 ? value.substring(0, 10) + '...' : value;

                // Cell background
                if (rowIndex % 2 === 0) {
                    ctx.fillStyle = 'rgba(0, 255, 136, 0.03)';
                    ctx.fillRect(x, y, colWidth, cellHeight);
                }

                // Cell value
                ctx.fillStyle = '#f5f5f5';
                ctx.font = '10px JetBrains Mono';
                ctx.fillText(truncated, x + cellPadding, y + 15);

                // Cell separator
                if (rowIndex < data.length - 1) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, y + cellHeight);
                    ctx.lineTo(x + colWidth, y + cellHeight);
                    ctx.stroke();
                }
            });

            // Compression indicator
            const compressionY = padding + 25 + data.length * cellHeight + 20;
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 10px JetBrains Mono';
            ctx.fillText('COMPRESSED', x + cellPadding, compressionY);
            
            // Compression ratio (simulated)
            const ratio = this.calculateCompressionRatio(data, col);
            ctx.fillStyle = '#a0a0a0';
            ctx.font = '9px JetBrains Mono';
            ctx.fillText(`${ratio}:1`, x + cellPadding, compressionY + 12);
        });

        // Draw label
        ctx.fillStyle = '#a0a0a0';
        ctx.font = '10px JetBrains Mono';
        ctx.fillText(
            'Column-oriented: Each column stored contiguously with compression',
            padding,
            height - 10
        );
    }

    /**
     * Calculate simulated compression ratio for a column
     */
    calculateCompressionRatio(data, columnName) {
        const values = data.map(row => row[columnName]);
        const uniqueValues = new Set(values);
        
        // Simulate dictionary compression for strings
        if (typeof values[0] === 'string') {
            return (values.length / uniqueValues.size).toFixed(1);
        }
        
        // Simulate RLE compression for numbers
        return (2.5 + Math.random() * 1.5).toFixed(1);
    }

    /**
     * Animate data loading
     */
    animateLoading(targetCanvas, callback) {
        const { canvas, ctx } = targetCanvas;
        let progress = 0;

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw loading bar
            const barWidth = canvas.width * 0.6;
            const barHeight = 4;
            const x = (canvas.width - barWidth) / 2;
            const y = canvas.height / 2;

            ctx.fillStyle = 'rgba(0, 255, 136, 0.2)';
            ctx.fillRect(x, y, barWidth, barHeight);

            ctx.fillStyle = '#00ff88';
            ctx.fillRect(x, y, barWidth * progress, barHeight);

            // Draw text
            ctx.fillStyle = '#a0a0a0';
            ctx.font = '12px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.fillText('Loading data...', canvas.width / 2, y - 20);

            progress += 0.02;

            if (progress >= 1) {
                ctx.textAlign = 'left';
                if (callback) callback();
            } else {
                this.animationFrame = requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * Clear visualizations
     */
    clear() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        if (this.rowCanvas) {
            this.rowCanvas.ctx.clearRect(0, 0, this.rowCanvas.canvas.width, this.rowCanvas.canvas.height);
        }

        if (this.columnCanvas) {
            this.columnCanvas.ctx.clearRect(0, 0, this.columnCanvas.canvas.width, this.columnCanvas.canvas.height);
        }
    }

    /**
     * Highlight query execution on columns
     */
    highlightColumns(columnNames, duration = 1000) {
        // Animation to highlight specific columns during query execution
        // This could be enhanced with more sophisticated animations
        console.log('Highlighting columns:', columnNames);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageVisualizer;
}