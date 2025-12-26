# Changelog

All notable changes to MongoFlow will be documented in this file.

## [Unreleased]

### Added
- AI Assistant powered by Google Gemini AI
- Automatic error detection and fixing in MongoDB shell
- MongoDB Shell with command history
- Collection-centric tabs (Documents, Aggregations, Schema, Indexes, Validation)
- Dynamic schema analysis
- Form-based document editing (replaces JSON editor)
- Index management with CRUD operations
- Validation rules management with form-based interface
- Next.js routing with browser history support
- Hierarchical database tree sidebar (MongoDB Compass-style)
- Real-time code generation (Node.js, Python, MongoDB Shell)
- Execution statistics display

### Changed
- Restructured app to be collection-centric
- Moved collection tabs to header
- Improved error handling across all components
- Enhanced MongoDB shell parser to support:
  - `new Date()` expressions
  - Multiple commands (semicolon-separated)
  - `updateOne`/`updateMany` with options (upsert, etc.)
  - `bulkWrite` operations
- Improved AI error detection and auto-fix capabilities

### Fixed
- React Hooks violations (hooks called conditionally)
- ESLint warnings and errors
- Document refresh after create/update/delete
- Query execution button logic
- Update and delete operations with ObjectId handling
- Aggregation pipeline parsing
- Field dropdown in validation view
- Code execution visibility in MongoDB shell

### Removed
- Unused components: PipelineBuilder, VisualQueryBuilder, CodeViewer, HistorySidebar, DashboardStats, ContextNavbar, PerformanceView
- Unused lib files: mockExecution.ts, indexAnalyzer.ts, validationGenerator.ts
- Empty notebook file: DashboardStatsPlaceholder.ipynb

### Documentation
- Comprehensive README.md with full feature documentation
- CONTRIBUTING.md for contributors
- Updated .gitignore
- Project structure documentation

## [0.1.0] - Initial Release

### Features
- MongoDB connection management
- Database and collection navigation
- Document CRUD operations
- Query builder
- Aggregation pipeline builder
- Schema discovery
- Code generation

