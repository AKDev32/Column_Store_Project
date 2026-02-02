
/**
 * Performance Charts
 * Visualizes performance metrics using Canvas
 */

class PerformanceCharts {
    constructor() {
        this.charts = {};
    }

    /**
     * Create bar chart
     */
    createBarChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight || 300;

        ctx.clearRect(0, 0, width, height);

        const padding = { top: 40, right: 40, bottom: 60, left: 80 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Find max value
        const maxValue = Math.max(...data.map(d => d.value));
        const scale = chartHeight / maxValue;

        // Draw bars
        const barWidth = chartWidth / data.length * 0.7;
        const barSpacing = chartWidth / data.length;

        data.forEach((item, index) => {
            const barHeight = item.value * scale;
            const x = padding.left + index * barSpacing + (barSpacing - barWidth) / 2;
            const y = padding.top + chartHeight - barHeight;

            // Draw bar with gradient
            const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
            gradient.addColorStop(0, item.color || '#00ff88');
            gradient.addColorStop(1, this.darkenColor(item.color || '#00ff88', 0.3));

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);

            // Draw value on top
            ctx.fillStyle = '#f5f5f5';
            ctx.font = 'bold 12px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.fillText(
                item.value.toFixed(1),
                x + barWidth / 2,
                y - 5
            );

            // Draw label
            ctx.fillStyle = '#a0a0a0';
            ctx.font = '11px JetBrains Mono';
            ctx.save();
            ctx.translate(x + barWidth / 2, padding.top + chartHeight + 20);
            ctx.rotate(-Math.PI / 4);
            ctx.fillText(item.label, 0, 0);
            ctx.restore();
        });

        // Draw axes
        ctx.strokeStyle = '#3f3f3f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, padding.top + chartHeight);
        ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
        ctx.stroke();

        // Draw title
        if (options.title) {
            ctx.fillStyle = '#f5f5f5';
            ctx.font = 'bold 14px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.fillText(options.title, width / 2, 25);
        }

        // Draw Y-axis labels
        ctx.fillStyle = '#a0a0a0';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const value = (maxValue / 5) * i;
            const y = padding.top + chartHeight - (chartHeight / 5) * i;
            ctx.fillText(value.toFixed(0), padding.left - 10, y + 4);
            
            // Grid line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartWidth, y);
            ctx.stroke();
        }
    }

    /**
     * Create line chart
     */
    createLineChart(canvasId, datasets, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight || 300;

        ctx.clearRect(0, 0, width, height);

        const padding = { top: 40, right: 40, bottom: 60, left: 80 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        // Find max value across all datasets
        const allValues = datasets.flatMap(d => d.data);
        const maxValue = Math.max(...allValues);
        const scaleY = chartHeight / maxValue;
        const scaleX = chartWidth / (datasets[0].data.length - 1);

        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartWidth, y);
            ctx.stroke();
        }

        // Draw datasets
        datasets.forEach(dataset => {
            ctx.strokeStyle = dataset.color || '#00ff88';
            ctx.lineWidth = 2;
            ctx.beginPath();

            dataset.data.forEach((value, index) => {
                const x = padding.left + index * scaleX;
                const y = padding.top + chartHeight - value * scaleY;

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.stroke();

            // Draw points
            dataset.data.forEach((value, index) => {
                const x = padding.left + index * scaleX;
                const y = padding.top + chartHeight - value * scaleY;

                ctx.fillStyle = dataset.color || '#00ff88';
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
            });
        });

        // Draw axes
        ctx.strokeStyle = '#3f3f3f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, padding.top + chartHeight);
        ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
        ctx.stroke();

        // Draw title
        if (options.title) {
            ctx.fillStyle = '#f5f5f5';
            ctx.font = 'bold 14px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.fillText(options.title, width / 2, 25);
        }

        // Draw legend
        if (datasets.length > 1) {
            const legendX = padding.left + chartWidth - 150;
            const legendY = padding.top + 20;

            datasets.forEach((dataset, index) => {
                const y = legendY + index * 25;

                ctx.fillStyle = dataset.color || '#00ff88';
                ctx.fillRect(legendX, y, 15, 15);

                ctx.fillStyle = '#f5f5f5';
                ctx.font = '11px JetBrains Mono';
                ctx.textAlign = 'left';
                ctx.fillText(dataset.label, legendX + 25, y + 12);
            });
        }

        // Y-axis labels
        ctx.fillStyle = '#a0a0a0';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 5; i++) {
            const value = (maxValue / 5) * (5 - i);
            const y = padding.top + (chartHeight / 5) * i;
            ctx.fillText(value.toFixed(0), padding.left - 10, y + 4);
        }
    }

    /**
     * Create pie chart
     */
    createPieChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight || 300;

        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.35;

        const total = data.reduce((sum, item) => sum + item.value, 0);
        let currentAngle = -Math.PI / 2;

        data.forEach((item, index) => {
            const sliceAngle = (item.value / total) * Math.PI * 2;

            // Draw slice
            ctx.fillStyle = item.color || this.getColorByIndex(index);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();

            // Draw border
            ctx.strokeStyle = '#0a0a0a';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.fillText(
                ((item.value / total) * 100).toFixed(1) + '%',
                labelX,
                labelY
            );

            currentAngle += sliceAngle;
        });

        // Draw legend
        const legendX = 20;
        let legendY = 20;

        data.forEach((item, index) => {
            ctx.fillStyle = item.color || this.getColorByIndex(index);
            ctx.fillRect(legendX, legendY, 15, 15);

            ctx.fillStyle = '#f5f5f5';
            ctx.font = '11px JetBrains Mono';
            ctx.textAlign = 'left';
            ctx.fillText(item.label, legendX + 25, legendY + 12);

            legendY += 25;
        });
    }

    /**
     * Create comparison chart (row vs column store)
     */
    createComparisonChart(canvasId, metrics) {
        const data = [
            {
                label: 'Row Store',
                value: metrics.rowStore,
                color: '#ff9500'
            },
            {
                label: 'Column Store',
                value: metrics.columnStore,
                color: '#00ff88'
            }
        ];

        this.createBarChart(canvasId, data, {
            title: metrics.title
        });
    }

    /**
     * Utility: Darken color
     */
    darkenColor(color, factor) {
        // Simple color darkening
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);

            const newR = Math.floor(r * (1 - factor));
            const newG = Math.floor(g * (1 - factor));
            const newB = Math.floor(b * (1 - factor));

            return `rgb(${newR}, ${newG}, ${newB})`;
        }
        return color;
    }

    /**
     * Utility: Get color by index
     */
    getColorByIndex(index) {
        const colors = ['#00ff88', '#0a84ff', '#ff9500', '#ff3b30', '#af52de', '#ffd60a'];
        return colors[index % colors.length];
    }

    /**
     * Generate sample performance data
     */
    static generateSampleData() {
        return {
            executionTime: [
                { label: 'SELECT *', value: 45 + Math.random() * 10 },
                { label: 'WHERE filter', value: 32 + Math.random() * 8 },
                { label: 'GROUP BY', value: 78 + Math.random() * 15 },
                { label: 'JOIN', value: 120 + Math.random() * 20 },
                { label: 'Complex Query', value: 95 + Math.random() * 15 }
            ],
            compression: [
                { label: 'Integer', value: 4.2 },
                { label: 'String', value: 8.5 },
                { label: 'Float', value: 3.1 },
                { label: 'Boolean', value: 16.0 }
            ],
            memory: {
                rowStore: 2400,
                columnStore: 850,
                title: 'Memory Usage (MB)'
            },
            io: {
                rowStore: 1200,
                columnStore: 340,
                title: 'I/O Operations'
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceCharts;
}