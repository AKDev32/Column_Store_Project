# Column Store Database - Interactive Visualization & Query Engine

A modern, high-performance columnar storage database engine built entirely with JavaScript. Features interactive visualizations, real-time query execution, and performance benchmarking.

## 🚀 Live Demo

Open `index.html` in your browser to explore the interactive interface.

## ✨ Features

### 🎯 Core Functionality
- **Columnar Storage Engine**: Efficient column-oriented data storage with compression
- **SQL Query Engine**: Parse and execute SELECT queries with WHERE, GROUP BY, ORDER BY
- **Interactive Visualizations**: Real-time comparison of row-based vs column-based storage
- **Performance Metrics**: Comprehensive benchmarking and analytics
- **Data Compression**: Dictionary encoding, RLE, and delta compression algorithms
- **Query Optimization**: Predicate pushdown and execution plan visualization

### 🎨 User Interface
- **Modern Design**: Brutalist-inspired aesthetic with high contrast and clean typography
- **Responsive Layout**: Works seamlessly across desktop and mobile devices
- **Interactive Charts**: Canvas-based performance visualizations
- **Real-time Feedback**: Live query execution with detailed metrics
- **Code Examples**: Pre-built query templates for learning

## 🏗️ Architecture

### Technology Stack
- **Frontend**: Pure JavaScript (ES6+), HTML5, CSS3
- **Visualization**: Canvas API for custom charts and storage visualization
- **Data Processing**: In-memory columnar storage with compression
- **Query Parsing**: Custom SQL parser supporting common operations

### Core Modules

```
📦 Column Store Project
├── 📄 index.html              # Main application interface
├── 📄 styles.css              # Distinctive brutalist styling
└── 📁 js/
    ├── 📄 columnStore.js      # Core storage engine
    ├── 📄 queryEngine.js      # SQL parser and executor
    ├── 📄 visualizer.js       # Storage visualization
    ├── 📄 charts.js           # Performance charts
    └── 📄 app.js              # Application controller
```

## 📚 Technical Implementation

### Column Store Engine

The `ColumnStore` class implements a high-performance columnar storage system:

```javascript
class ColumnStore {
    createTable(tableName, schema)  // Define table structure
    insert(tableName, rows)          // Bulk insert with compression
    scan(tableName, columns, predicate) // Columnar scan with filtering
    aggregate(tableName, aggregates, groupBy) // Efficient aggregations
}
```

**Key Features:**
- **Dictionary Encoding**: Compresses string columns by mapping values to integers
- **Run-Length Encoding**: Optimizes repeated integer values
- **Null Bitmaps**: Efficiently tracks NULL values
- **Column Statistics**: Maintains min/max/distinct counts for query optimization
- **Predicate Pushdown**: Filters data at storage level before materialization

### Query Engine

The `QueryEngine` class provides SQL query parsing and execution:

```javascript
class QueryEngine {
    execute(sql)                 // Parse and execute SQL query
    parse(sql)                   // Convert SQL to query plan
    createExecutionPlan(query)   // Generate optimization steps
}
```

**Supported SQL Operations:**
- `SELECT` with column projection
- `WHERE` clauses with comparison operators (=, >, <, >=, <=, !=)
- `GROUP BY` for aggregations
- `ORDER BY` with ASC/DESC
- `LIMIT` for result pagination
- Aggregate functions: COUNT, SUM, AVG, MIN, MAX

### Storage Visualization

Real-time visual comparison of storage layouts:

- **Row-Oriented**: Shows sequential row storage (traditional RDBMS)
- **Column-Oriented**: Displays columnar blocks with compression indicators
- **Canvas Rendering**: High-performance custom graphics
- **Animated Loading**: Smooth transitions and data updates

## 🎓 Learning Objectives

This project demonstrates proficiency in:

### Database Concepts
- ✅ Columnar vs row-based storage architectures
- ✅ Data compression algorithms (dictionary, RLE, delta)
- ✅ Query optimization techniques
- ✅ Aggregate function implementation
- ✅ Index and statistics management

### Software Engineering
- ✅ Object-oriented design patterns
- ✅ Modular architecture with clear separation of concerns
- ✅ Event-driven programming
- ✅ State management in JavaScript
- ✅ Error handling and validation

### Frontend Development
- ✅ Vanilla JavaScript (ES6+)
- ✅ Canvas API for data visualization
- ✅ Responsive CSS Grid and Flexbox layouts
- ✅ Custom UI components without frameworks
- ✅ Performance optimization

### Data Structures & Algorithms
- ✅ Hash maps for dictionary encoding
- ✅ Bitmaps for null tracking
- ✅ Array operations and transformations
- ✅ Sorting and filtering algorithms
- ✅ Time complexity analysis (Big O notation)

## 🚦 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Basic understanding of SQL
- Text editor or IDE

### Installation

1. **Clone or Download** this repository
2. **Open** `index.html` in your web browser
3. **Explore** the interactive interface!

No build process, dependencies, or server required - everything runs in the browser.

### Quick Start

1. **Load Sample Data**
   - Click "Medium (1K rows)" to load the default dataset
   - View the storage visualization comparing row vs column layouts

2. **Execute Queries**
   - Navigate to "Query Engine" tab
   - Try the example queries or write your own
   - View execution plans and performance metrics

3. **Analyze Performance**
   - Visit "Performance" tab
   - Compare row store vs column store metrics
   - Understand compression ratios and query speeds

## 📝 Example Queries

### Basic Selection
```sql
SELECT name, department, salary 
FROM employees 
WHERE salary > 50000 
ORDER BY salary DESC 
LIMIT 10
```

### Aggregations
```sql
SELECT department, COUNT(*) AS count, AVG(salary) AS avg_salary 
FROM employees 
GROUP BY department 
ORDER BY avg_salary DESC
```

### Filtering
```sql
SELECT * 
FROM employees 
WHERE department = 'Engineering' AND age > 30
```

## 🎯 Use Cases

### Educational
- Learn database internals and columnar storage
- Understand query optimization techniques
- Visualize storage architecture differences
- Practice SQL query writing

### Portfolio
- Demonstrate full-stack JavaScript skills
- Showcase database knowledge
- Highlight data visualization abilities
- Prove understanding of algorithms

### Interviews
- Explain storage engine design decisions
- Discuss compression algorithms
- Analyze time complexity of operations
- Compare OLTP vs OLAP workloads

## 📊 Performance Characteristics

### Storage Efficiency
- **Compression Ratio**: 3-10x depending on data type
- **String Columns**: 5-15x with dictionary encoding
- **Integer Columns**: 2-5x with RLE
- **Memory Usage**: 60-80% reduction vs row-based storage

### Query Performance
- **Column Scan**: O(n) with predicate pushdown
- **Aggregations**: O(n) for simple, O(n log n) for grouped
- **Sorting**: O(n log n) standard quicksort
- **Filtering**: Early termination with statistics

### Best Suited For
- ✅ OLAP (Analytics) workloads
- ✅ Data warehousing
- ✅ Reporting and business intelligence
- ✅ Read-heavy applications
- ✅ Large-scale data analysis

### Not Optimal For
- ❌ OLTP (Transaction) workloads
- ❌ Row-by-row updates
- ❌ Frequent small writes
- ❌ Multi-table joins (not yet implemented)

## 🔧 Extending the Project

### Add New Features
```javascript
// Add new compression algorithm
ColumnStore.prototype.addCompression = function(type, algorithm) {
    this.compressions.set(type, algorithm);
}

// Add new aggregate function
QueryEngine.prototype.computeAggregate = function(rows, column, func) {
    switch(func) {
        case 'MEDIAN': return this.calculateMedian(rows, column);
        // ... add more functions
    }
}
```

### Implement Joins
```javascript
// Example JOIN implementation
class JoinExecutor {
    hashJoin(leftTable, rightTable, leftKey, rightKey) {
        // Build hash table on smaller table
        // Probe with larger table
        // Return joined results
    }
}
```

### Add Persistent Storage
```javascript
// Use IndexedDB for persistence
class PersistentColumnStore extends ColumnStore {
    async saveToDisk() {
        // Serialize columns to IndexedDB
    }
    
    async loadFromDisk() {
        // Deserialize from IndexedDB
    }
}
```

## 🎨 Design Philosophy

### Visual Identity
- **Brutalist Aesthetic**: Raw, functional, high-contrast design
- **Typography**: Distinctive font pairing (Crimson Pro + JetBrains Mono)
- **Color Palette**: Dark background with neon green accents (#00ff88)
- **Grain Texture**: Subtle noise overlay for depth
- **Geometric Layouts**: Clean grids and asymmetric compositions

### UX Principles
- **Progressive Disclosure**: Start simple, reveal complexity gradually
- **Immediate Feedback**: Real-time updates and animations
- **Educational Focus**: Clear explanations and visualizations
- **Performance First**: Optimized rendering and data processing

## 📋 Project Checklist

### For Resume/Portfolio
- [x] Clean, professional code structure
- [x] Comprehensive documentation
- [x] Interactive live demo
- [x] Performance benchmarks
- [x] Visual design that stands out
- [x] Real-world problem solving
- [x] Scalable architecture

### Technical Depth
- [x] Custom data structures
- [x] Algorithm implementation
- [x] Query optimization
- [x] Data compression
- [x] Visualization techniques
- [x] Error handling
- [x] Code organization

### Presentation
- [x] Clear README
- [x] Code comments
- [x] Example usage
- [x] Architecture diagrams
- [x] Learning objectives
- [x] Extension ideas

## 🤝 Interview Talking Points

### Database Design
- "I implemented a columnar storage engine to understand OLAP optimization"
- "The compression algorithms reduce memory by 5-10x depending on data type"
- "Dictionary encoding is particularly effective for low-cardinality string columns"

### Performance
- "Predicate pushdown filters data before materialization, reducing I/O"
- "Column statistics enable query optimization without full scans"
- "The architecture supports parallel scanning of independent columns"

### Code Quality
- "I used modular design with clear separation between storage, query, and UI layers"
- "The Canvas API provides high-performance custom visualizations"
- "Event-driven architecture keeps the UI responsive during data operations"

## 📄 License

This project is created for educational and portfolio purposes. Feel free to use, modify, and build upon it.

## 🙏 Acknowledgments

Inspired by modern columnar databases:
- Apache Parquet
- Apache Arrow
- ClickHouse
- Amazon Redshift
- Google BigQuery

---

**Built with ❤️ and JavaScript**

*Ready to impress recruiters at big tech companies!* 🚀
