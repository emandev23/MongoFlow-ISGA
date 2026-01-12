# MongoFlow - Advanced MongoDB IDE

A professional MongoDB management tool built with Next.js, TypeScript, and modern React patterns. MongoFlow provides a MongoDB Compass-like experience with AI-powered assistance, real-time query building, and document management.

## 📋 For SoftwareX Reviewers

**Repository:** [https://github.com/emandev23/MongoFlow-ISGA.git](https://github.com/emandev23/MongoFlow-ISGA.git)

**SoftwareX Documentation:** See [softwarxDocs.md](./softwarxDocs.md) for complete software description, architecture, and metadata information required for SoftwareX submission.

**Quick Start for Reviewers:**
1. Clone the repository: `git clone https://github.com/emandev23/MongoFlow-ISGA.git`
2. Install dependencies: `npm install`
3. Set up environment: Create `.env.local` with `GEMINI_API_KEY=your_key_here` (see [Getting Started](#getting-started) below)
4. Run the application: `npm run dev`
5. Access at: http://localhost:3000

**Note:** The application requires a MongoDB instance (local or cloud) and a Google Gemini API key for AI features. See the [Installation](#installation) section for detailed setup instructions.

## Features

**Core Features:**
- Database connection management with connection string support
- Hierarchical database tree with expandable databases and collections
- Document CRUD operations with form-based editing
- Visual query builder for complex nested queries
- Aggregation pipeline builder with visual interface
- Interactive MongoDB shell
- AI assistant powered by Google Gemini for query assistance and error fixing

**Collection Views:**
- Documents: View, create, edit, and delete with dynamic form inputs
- Aggregations: Build and execute aggregation pipelines
- Schema: Dynamic schema analysis showing field types and structure
- Indexes: Create, view, and manage indexes
- Validation: Create and manage collection validation rules

**AI Features:**
- Intelligent error detection and automatic fixes
- Code generation for MongoDB queries
- Context-aware assistance based on database schema
- Proactive help when errors occur

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB instance (local or remote)
- Google Gemini API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/emandev23/MongoFlow-ISGA.git
cd MongoFlow
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
   Get your API key from: https://makersuite.google.com/app/apikey

4. Run the development server:
```bash
npm run dev
```

5. Open your browser:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm start
```

### Deployment

**Important:** Local MongoDB (`mongodb://localhost:27017`) is not accessible from the internet. When deploying to Vercel, Netlify, or any cloud platform, use MongoDB Atlas (cloud MongoDB).

**Quick Solution:**
1. Create a free MongoDB Atlas account: [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (free tier available)
3. Get your connection string (format: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`)
4. Users can enter this connection string in your deployed app

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

## Project Structure

```
MongoFlow/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   │   ├── ai/             # AI assistant endpoints
│   │   └── mongodb/        # MongoDB operation endpoints
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/             # React components
│   ├── ui/                 # Shadcn/UI components
│   ├── layout/             # Layout components
│   ├── views/              # Collection view components
│   └── [various components]
├── lib/                    # Utility functions
├── store/                  # Zustand state management
├── types/                  # TypeScript definitions
└── scripts/                # Utility scripts
```

## Usage

**Connecting to MongoDB:**
1. Click "Connect to MongoDB" on the home page
2. Enter your MongoDB connection string (e.g., `mongodb://localhost:27017`)
3. Click "Connect"

**Working with Documents:**
- Select a collection from the sidebar
- View, create, edit, and delete documents in the Documents tab
- Use the search bar to filter documents

**Building Queries:**
- Navigate to Aggregations tab
- Add query conditions using the visual query builder
- Select fields from the schema sidebar
- Execute query to see results

**MongoDB Shell:**
- Expand the MongoDB Shell at the bottom
- Type MongoDB commands (e.g., `db.products.find()`)
- Press Ctrl+Enter (Cmd+Enter) to execute

**AI Assistant:**
- Open the AI Assistant from the floating button
- Ask questions about MongoDB operations
- Get code suggestions with executable code blocks
- AI automatically detects and fixes command errors

**Managing Indexes and Validation:**
- Navigate to Indexes or Validation tabs
- Create, view, and manage indexes or validation rules

## Technologies

- Next.js 14 - React framework with App Router
- TypeScript - Type safety
- Zustand - State management
- MongoDB - Official MongoDB Node.js driver
- Google Gemini AI - AI-powered assistance
- Tailwind CSS - Utility-first CSS framework
- Shadcn/UI - React components

## API Routes

**MongoDB Operations:**
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

**AI Operations:**
- `POST /api/ai/chat` - Chat with AI assistant
- `GET /api/ai/models` - List available Gemini models

## Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or contributions, please open an issue on GitHub.
