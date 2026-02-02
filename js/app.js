/**
 * Main Application Controller
 * Coordinates all modules and handles user interactions
 */

// Global state
const app = {
    store: null,
    queryEngine: null,
    visualizer: null,
    charts: null,
    currentDataset: null
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadInitialData();
});

/**
 * Initialize all modules
 */
function initializeApp() {
    // Initialize column store
    app.store = new ColumnStore();

    // Create employees table
    const schema = [
        { name: 'id', type: 'integer' },
        { name: 'name', type: 'string' },
        { name: 'department', type: 'string' },
        { name: 'salary', type: 'integer' },
        { name: 'age', type: 'integer' },
        { name: 'active', type: 'boolean' }
    ];

    app.store.createTable('employees', schema);

    // Initialize query engine
    app.queryEngine = new QueryEngine(app.store);

    // Initialize visualizer
    app.visualizer = new StorageVisualizer();
    app.visualizer.init('row-viz', 'column-viz');

    // Initialize charts
    app.charts = new PerformanceCharts();
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.dataset.section;
            navigateToSection(section);
        });
    });

    // Data loading controls
    document.getElementById('load-small')?.addEventListener('click', () => loadData(100));
    document.getElementById('load-medium')?.addEventListener('click', () => loadData(1000));
    document.getElementById('load-large')?.addEventListener('click', () => loadData(10000));
    document.getElementById('generate-custom')?.addEventListener('click', showCustomDataDialog);

    // Query execution
    document.getElementById('execute-query')?.addEventListener('click', executeQuery);
    document.getElementById('format-sql')?.addEventListener('click', formatSQL);
    document.getElementById('clear-sql')?.addEventListener('click', clearSQL);

    // Query examples
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const queryType = e.target.dataset.query;
            loadQueryExample(queryType);
        });
    });

    // Result tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            switchTab(e.target);
        });
    });
}

/**
 * Navigate to section
 */
function navigateToSection(sectionId) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.section === sectionId) {
            btn.classList.add('active');
        }
    });

    // Update sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');

        // Load section-specific content
        if (sectionId === 'performance') {
            loadPerformanceCharts();
        }
    }
}

/**
 * Load initial data
 */
function loadInitialData() {
    loadData(1000);
}

/**
 * Load sample data
 */
function loadData(rowCount) {
    // Update active button
    document.querySelectorAll('.control-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeBtn = rowCount === 100 ? 'load-small' :
                      rowCount === 1000 ? 'load-medium' : 'load-large';
    document.getElementById(activeBtn)?.classList.add('active');

    // Show loading animation
    app.visualizer.animateLoading(app.visualizer.rowCanvas, () => {
        // Generate and insert data
        const data = ColumnStore.generateSampleData(rowCount);
        app.currentDataset = data;

        const result = app.store.insert('employees', data);
        
        console.log('Data loaded:', result);

        // Visualize storage
        app.visualizer.visualize(data, Math.min(rowCount, 10));

        // Show notification
        showNotification(`Loaded ${rowCount.toLocaleString()} rows in ${result.insertTime}`, 'success');
    });
}

/**
 * Show custom data dialog
 */
function showCustomDataDialog() {
    const rowCount = prompt('Enter number of rows to generate:', '5000');
    if (rowCount && !isNaN(rowCount)) {
        loadData(parseInt(rowCount));
    }
}

/**
 * Execute SQL query
 */
function executeQuery() {
    const sqlInput = document.getElementById('sql-input');
    const sql = sqlInput.value.trim();

    if (!sql) {
        showNotification('Please enter a SQL query', 'warning');
        return;
    }

    try {
        const result = app.queryEngine.execute(sql);
        displayQueryResults(result);
        showNotification(`Query executed in ${result.execution.executionTime}`, 'success');
    } catch (error) {
        showNotification(`Error: ${error.message}`, 'error');
        displayError(error);
    }
}

/**
 * Display query results
 */
function displayQueryResults(result) {
    const container = document.getElementById('results-container');
    const emptyState = document.querySelector('.empty-state');
    const meta = document.getElementById('query-meta');

    // Hide empty state
    if (emptyState) {
        emptyState.style.display = 'none';
    }

    // Update metadata
    if (meta) {
        meta.innerHTML = `
            <span>${result.data.length} rows</span>
            <span>•</span>
            <span>${result.execution.executionTime}</span>
        `;
    }

    // Create table
    if (result.data.length > 0) {
        const table = createResultTable(result.data);
        container.innerHTML = '';
        container.appendChild(table);
    } else {
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #a0a0a0;">No results</div>';
    }

    // Update execution plan
    displayExecutionPlan(result.execution.executionPlan);

    // Update metrics
    displayMetrics(result);
}

/**
 * Create result table
 */
function createResultTable(data) {
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontSize = '0.875rem';
    table.style.fontFamily = 'JetBrains Mono, monospace';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    Object.keys(data[0]).forEach(key => {
        const th = document.createElement('th');
        th.textContent = key.toUpperCase();
        th.style.padding = '0.75rem';
        th.style.textAlign = 'left';
        th.style.borderBottom = '2px solid #00ff88';
        th.style.color = '#00ff88';
        th.style.fontWeight = '600';
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    
    data.slice(0, 100).forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #2a2a2a';
        
        if (index % 2 === 0) {
            tr.style.background = 'rgba(0, 255, 136, 0.02)';
        }

        Object.values(row).forEach(value => {
            const td = document.createElement('td');
            td.textContent = value !== null ? value : 'NULL';
            td.style.padding = '0.75rem';
            td.style.color = value !== null ? '#f5f5f5' : '#606060';
            tr.appendChild(td);
        });
        
        tbody.appendChild(tr);
    });

    if (data.length > 100) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = Object.keys(data[0]).length;
        td.textContent = `... and ${data.length - 100} more rows`;
        td.style.padding = '1rem';
        td.style.textAlign = 'center';
        td.style.color = '#a0a0a0';
        td.style.fontStyle = 'italic';
        tr.appendChild(td);
        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    return table;
}

/**
 * Display execution plan
 */
function displayExecutionPlan(plan) {
    const container = document.getElementById('execution-plan');
    if (!container || !plan) return;

    container.innerHTML = '';

    const planDiv = document.createElement('div');
    planDiv.style.fontFamily = 'JetBrains Mono, monospace';
    planDiv.style.fontSize = '0.875rem';

    plan.forEach((step, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.style.padding = '1rem';
        stepDiv.style.marginBottom = '0.5rem';
        stepDiv.style.background = 'rgba(0, 255, 136, 0.05)';
        stepDiv.style.border = '1px solid #2a2a2a';
        stepDiv.style.borderRadius = '4px';
        stepDiv.style.borderLeft = '3px solid #00ff88';

        stepDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                <span style="color: #00ff88; font-weight: 600;">Step ${step.step}</span>
                <span style="color: #f5f5f5; font-weight: 600;">${step.operation}</span>
                <span style="color: #a0a0a0; margin-left: auto;">${step.cost}</span>
            </div>
            <div style="color: #a0a0a0; font-size: 0.8rem;">${step.description}</div>
            ${step.target ? `<div style="color: #606060; font-size: 0.75rem; margin-top: 0.25rem;">Target: ${step.target}</div>` : ''}
        `;

        if (index < plan.length - 1) {
            const arrow = document.createElement('div');
            arrow.textContent = '↓';
            arrow.style.textAlign = 'center';
            arrow.style.color = '#00ff88';
            arrow.style.fontSize = '1.5rem';
            arrow.style.margin = '0.5rem 0';
            planDiv.appendChild(stepDiv);
            planDiv.appendChild(arrow);
        } else {
            planDiv.appendChild(stepDiv);
        }
    });

    container.appendChild(planDiv);
}

/**
 * Display metrics
 */
function displayMetrics(result) {
    const container = document.getElementById('metrics-grid');
    if (!container) return;

    const metrics = [
        {
            label: 'Rows Scanned',
            value: result.metadata.rowsScanned || 'N/A',
            icon: '📊'
        },
        {
            label: 'Rows Returned',
            value: result.metadata.rowsReturned || result.data.length,
            icon: '✓'
        },
        {
            label: 'Execution Time',
            value: result.execution.executionTime,
            icon: '⚡'
        },
        {
            label: 'Columns Scanned',
            value: result.metadata.columnsScanned || 'N/A',
            icon: '📋'
        }
    ];

    container.innerHTML = '';

    metrics.forEach(metric => {
        const card = document.createElement('div');
        card.style.padding = '1.5rem';
        card.style.background = 'rgba(0, 255, 136, 0.05)';
        card.style.border = '1px solid #2a2a2a';
        card.style.borderRadius = '8px';
        card.style.textAlign = 'center';

        card.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">${metric.icon}</div>
            <div style="font-size: 1.5rem; font-weight: 700; color: #00ff88; margin-bottom: 0.25rem;">${metric.value}</div>
            <div style="font-size: 0.875rem; color: #a0a0a0;">${metric.label}</div>
        `;

        container.appendChild(card);
    });
}

/**
 * Display error
 */
function displayError(error) {
    const container = document.getElementById('results-container');
    container.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
            <div style="font-size: 3rem; color: #ff3b30; margin-bottom: 1rem;">⚠</div>
            <div style="color: #ff3b30; font-weight: 600; margin-bottom: 0.5rem;">Query Error</div>
            <div style="color: #a0a0a0;">${error.message}</div>
        </div>
    `;
}

/**
 * Format SQL
 */
function formatSQL() {
    const sqlInput = document.getElementById('sql-input');
    let sql = sqlInput.value.trim();
    
    // Basic SQL formatting
    sql = sql.replace(/\s+/g, ' ');
    sql = sql.replace(/\s*,\s*/g, ', ');
    sql = sql.replace(/\bSELECT\b/gi, 'SELECT\n  ');
    sql = sql.replace(/\bFROM\b/gi, '\nFROM ');
    sql = sql.replace(/\bWHERE\b/gi, '\nWHERE ');
    sql = sql.replace(/\bGROUP BY\b/gi, '\nGROUP BY ');
    sql = sql.replace(/\bORDER BY\b/gi, '\nORDER BY ');
    sql = sql.replace(/\bLIMIT\b/gi, '\nLIMIT ');
    
    sqlInput.value = sql;
}

/**
 * Clear SQL
 */
function clearSQL() {
    document.getElementById('sql-input').value = '';
}

/**
 * Load query example
 */
function loadQueryExample(type) {
    const examples = QueryEngine.getExamples();
    const sqlInput = document.getElementById('sql-input');
    
    if (examples[type]) {
        sqlInput.value = examples[type];
    }
}

/**
 * Switch tab
 */
function switchTab(tabElement) {
    const tabName = tabElement.dataset.tab;
    
    // Update tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    tabElement.classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    const targetContent = document.getElementById(`${tabName}-tab`);
    if (targetContent) {
        targetContent.classList.add('active');
    }
}

/**
 * Load performance charts
 */
function loadPerformanceCharts() {
    const data = PerformanceCharts.generateSampleData();

    // Execution time chart
    app.charts.createBarChart('execution-chart', data.executionTime.map(d => ({
        ...d,
        color: d.label.includes('Column') ? '#00ff88' : '#ff9500'
    })));

    // Compression chart
    app.charts.createBarChart('compression-chart', data.compression.map(d => ({
        ...d,
        color: '#0a84ff'
    })));

    // Memory usage comparison
    app.charts.createComparisonChart('memory-chart', data.memory);

    // I/O operations comparison
    app.charts.createComparisonChart('io-chart', data.io);
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.textContent = message;
    
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        background: type === 'success' ? '#00ff88' : 
                   type === 'error' ? '#ff3b30' : 
                   type === 'warning' ? '#ff9500' : '#0a84ff',
        color: '#0a0a0a',
        borderRadius: '8px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.875rem',
        fontWeight: '600',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
        zIndex: '10000',
        animation: 'slideInRight 0.3s ease-out'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);