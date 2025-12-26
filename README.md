# MongoFlow - Advanced MongoDB IDE

A professional, feature-rich MongoDB management tool built with Next.js, TypeScript, and modern React patterns. MongoFlow provides a MongoDB Compass-like experience with advanced features including AI-powered assistance, real-time query building, document management, and more.

![MongoFlow](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green?style=for-the-badge&logo=mongodb)

## ✨ Features

### 🎯 Core Features

- **Database Connection Management**: Connect to MongoDB instances with connection string support
- **Hierarchical Database Tree**: MongoDB Compass-style sidebar with expandable databases and collections
- **Document Management**: Full CRUD operations with form-based editing (not JSON)
- **Query Builder**: Visual query builder with support for complex nested queries
- **Aggregation Pipeline Builder**: Build multi-stage aggregation pipelines with visual interface
- **MongoDB Shell**: Interactive shell for executing MongoDB commands
- **AI Assistant**: Powered by Google Gemini AI for intelligent query assistance and error fixing

### 📊 Collection Views

- **Documents**: View, create, edit, and delete documents with dynamic form inputs
- **Aggregations**: Build and execute aggregation pipelines
- **Schema**: Dynamic schema analysis showing field types and structure
- **Indexes**: Create, view, and manage indexes with CRUD operations
- **Validation**: Create and manage collection validation rules with form-based interface

### 🤖 AI-Powered Features

- **Intelligent Error Detection**: Automatically detects errors in MongoDB commands and provides fixes
- **Code Generation**: AI generates MongoDB queries and commands
- **Context-Aware Assistance**: AI understands your database schema and provides relevant suggestions
- **Proactive Help**: AI automatically suggests fixes when errors occur

### 🎨 User Experience

- **Modern UI**: Built with Shadcn/UI components for a polished, professional interface
- **Responsive Design**: Works seamlessly on desktop and tablet devices
- **Real-time Updates**: Changes reflect immediately across all views
- **Breadcrumb Navigation**: Easy navigation through nested object paths
- **Collection Tabs**: Quick access to different collection views
- **Execution Statistics**: View query performance metrics

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB instance (local or remote)
- Google Gemini API key (for AI features)

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd MongoFlow
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
   Get your API key from: https://makersuite.google.com/app/apikey

4. **Run the development server**:
```bash
npm run dev
```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
MongoFlow/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── ai/                   # AI assistant endpoints
│   │   │   ├── chat/             # Gemini chat API
│   │   │   └── models/           # Available models API
│   │   └── mongodb/              # MongoDB operation endpoints
│   │       ├── connect/          # Connection management
│   │       ├── databases/        # Database operations
│   │       ├── collections/     # Collection operations
│   │       ├── documents/        # Document CRUD
│   │       ├── aggregate/       # Aggregation execution
│   │       ├── query/           # Query execution
│   │       ├── indexes/         # Index management
│   │       ├── validation/     # Validation rules
│   │       ├── shell/          # MongoDB shell
│   │       └── seed/          # Data seeding
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                # Main application page
│   └── globals.css             # Global styles
├── components/                  # React components
│   ├── ui/                     # Shadcn/UI components
│   ├── layout/                 # Layout components
│   │   └── MainSidebar.tsx    # Database tree sidebar
│   ├── views/                  # Collection view components
│   │   ├── SchemaView.tsx      # Schema analysis view
│   │   ├── IndexesView.tsx    # Index management view
│   │   ├── ValidationView.tsx  # Validation rules view
│   │   └── SettingsView.tsx   # Settings view
│   ├── AIAssistant.tsx        # AI chat assistant
│   ├── MongoShell.tsx          # MongoDB shell interface
│   ├── DocumentViewer.tsx     # Document management
│   ├── UnifiedQueryBuilder.tsx # Query builder
│   ├── CollectionTabs.tsx     # Collection view tabs
│   ├── DatabaseConnection.tsx  # Connection UI
│   ├── ExecutionStats.tsx     # Performance metrics
│   ├── BreadcrumbNav.tsx      # Breadcrumb navigation
│   ├── SchemaSidebar.tsx      # Schema tree sidebar
│   ├── StageEditor.tsx        # Pipeline stage editor
│   └── AdaptiveInput.tsx     # Type-aware inputs
├── lib/                        # Utility functions
│   ├── mongodb.ts             # MongoDB connection utilities
│   ├── schemaAnalyzer.ts      # Schema analysis
│   ├── codeGenerator.ts       # Code generation
│   ├── queryGenerator.ts      # Query generation
│   ├── performanceAnalyzer.ts # Performance analysis
│   ├── seedData.ts            # Data seeding
│   ├── mockDocuments.ts       # Mock data
│   ├── schemaMock.ts          # Schema utilities
│   └── utils.ts               # General utilities
├── store/                      # Zustand state management
│   ├── workflowStore.ts        # Connection & navigation state
│   ├── documentStore.ts        # Document state
│   ├── pipelineStore.ts        # Pipeline state
│   ├── queryStore.ts           # Query state
│   └── settingsStore.ts        # Settings state
├── types/                      # TypeScript definitions
│   ├── pipeline.ts             # Pipeline types
│   └── query.ts                # Query types
└── scripts/                    # Utility scripts
    └── test-seed.js            # Seed testing script
```

## 🎯 Usage Guide

### Connecting to MongoDB

1. Click "Connect to MongoDB" on the home page
2. Enter your MongoDB connection string (e.g., `mongodb://localhost:27017`)
3. Click "Connect"
4. Once connected, you'll see your databases in the sidebar

### Working with Documents

1. **Select a collection** from the sidebar
2. **View documents** in the Documents tab
3. **Create a document**: Click "New Document" and fill in the form
4. **Edit a document**: Click the edit icon on any document
5. **Delete a document**: Click the delete icon
6. **Search documents**: Use the search bar to filter documents

### Building Queries

1. **Navigate to Aggregations tab**
2. **Add query conditions** using the visual query builder
3. **Select fields** from the schema sidebar (inputs adapt to field types)
4. **Execute query** to see results
5. **View execution stats** in the toast notification

### Using the MongoDB Shell

1. **Expand the MongoDB Shell** at the bottom of the page
2. **Type MongoDB commands** (e.g., `db.products.find()`)
3. **Press Ctrl+Enter (Cmd+Enter)** to execute
4. **View results** in the shell output
5. **Navigate history** with arrow keys

### AI Assistant

1. **Open the AI Assistant** from the floating button
2. **Ask questions** about MongoDB operations
3. **Get code suggestions** with executable code blocks
4. **Auto-fix errors**: AI automatically detects and fixes command errors
5. **Insert or Execute** code directly from AI suggestions

### Managing Indexes

1. **Navigate to Indexes tab**
2. **View existing indexes** for the collection
3. **Create new index**: Click "Create Index"
4. **Configure index**: Select fields, order, and options (unique, sparse, background)
5. **Delete index**: Click delete icon on any index

### Validation Rules

1. **Navigate to Validation tab**
2. **View current rules** (if any)
3. **Create validation rule**: Click "Create Rule"
4. **Select field** from dropdown (populated from schema)
5. **Configure validation**: Set required, min, max, pattern, etc.
6. **Save rule** to apply to collection

## 🛠️ Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Zustand** - Lightweight state management
- **MongoDB** - Official MongoDB Node.js driver
- **Google Gemini AI** - AI-powered assistance
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - High-quality React components
- **Lucide React** - Beautiful icon library
- **React Syntax Highlighter** - Code syntax highlighting

## 🔧 API Routes

### MongoDB Operations

- `POST /api/mongodb/connect` - Connect to MongoDB
- `GET /api/mongodb/databases` - List databases
- `GET /api/mongodb/collections` - List collections
- `POST /api/mongodb/documents` - Create document
- `GET /api/mongodb/documents` - Get documents
- `PUT /api/mongodb/documents` - Update document
- `DELETE /api/mongodb/documents` - Delete document
- `POST /api/mongodb/aggregate` - Execute aggregation
- `POST /api/mongodb/query` - Execute query
- `POST /api/mongodb/indexes` - Get indexes
- `PUT /api/mongodb/indexes` - Create index
- `DELETE /api/mongodb/indexes` - Delete index
- `POST /api/mongodb/validation` - Get validation rules
- `PUT /api/mongodb/validation` - Set validation rules
- `DELETE /api/mongodb/validation` - Remove validation rules
- `POST /api/mongodb/shell` - Execute shell command

### AI Operations

- `POST /api/ai/chat` - Chat with AI assistant
- `GET /api/ai/models` - List available Gemini models

## 🎨 Key Features Explained

### Dynamic Schema Analysis

The application automatically analyzes your collection's documents to determine:
- Field types (String, Number, Date, Boolean, Object, Array, ObjectId)
- Nested object structures
- Field paths for easy reference

### Adaptive Input Components

Input components automatically adapt based on field type:
- **Date fields** → Date picker
- **Number fields** → Number input with validation
- **Boolean fields** → Dropdown (True/False)
- **String fields** → Text input

### AI Error Detection

The AI assistant automatically:
- Monitors MongoDB shell for errors
- Detects syntax errors, validation errors, etc.
- Provides corrected code with explanations
- Offers executable fixes

### Real-time Code Generation

See your queries and pipelines in multiple formats:
- **Node.js** - MongoDB Native Driver syntax
- **Python** - PyMongo syntax
- **MongoDB Shell** - Native shell syntax

## 📝 Environment Variables

```env
# Required for AI features
GEMINI_API_KEY=your_gemini_api_key_here
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- MongoDB for the excellent database
- Google for Gemini AI
- Shadcn for the beautiful UI components
- Next.js team for the amazing framework

## 📧 Support

For issues, questions, or contributions, please open an issue on GitHub.

---

**Built with ❤️ for MongoDB developers**
