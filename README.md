# MongoFlow

MongoFlow is an open-source, web-based MongoDB IDE for document exploration, sample-based schema inference, visual aggregation construction, multi-language code export, post-execution statistics, and optional AI-assisted query explanation and correction.

MongoFlow is designed for educational, exploratory, and research-oriented MongoDB workflows. It provides a browser-based interface that helps users inspect MongoDB collections, build aggregation pipelines, view generated code, execute queries, and review AI-assisted suggestions.

## Main Features

### Core workflow

- Browser-based MongoDB interaction
- Sample-based schema inference from MongoDB documents
- Type-aware controls based on inferred fields
- Visual aggregation pipeline construction
- Multi-language code export to MongoDB Shell, Node.js, and Python
- Post-execution statistics after query execution
- AI-assisted query explanation and correction

### Supporting database-client functions

- MongoDB connection management
- Document browsing, creation, update, and deletion
- Integrated MongoDB shell
- Index management
- Collection validation-rule management
- Query history
- Breadcrumb navigation

## Project Status

MongoFlow is an early-stage research software artifact. It is suitable for MongoDB learning, exploratory data work, and experimentation with AI-assisted database interaction.

It is not currently presented as a production-ready multi-tenant database platform. Public or institutional deployments require additional security mechanisms, including authentication, authorization, user-specific connection isolation, secure credential storage, and audit logging.

## Requirements

- Node.js 18 or later
- npm or yarn
- A MongoDB instance, local or cloud-based
- Optional: Google Gemini API key for AI-assisted features

## Installation

Clone the repository:

```bash
git clone https://github.com/emandev23/MongoFlow-ISGA.git
cd MongoFlow-ISGA
```

Install dependencies:
```bash
npm install
```

Create an environment file:
```bash
cp .env.example .env
```

Configure the optional AI key:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the development server:
```bash
npm run dev
```

Open the application in the browser: `http://localhost:3000`

## Basic Usage
1. Open MongoFlow in the browser.
2. Enter a MongoDB connection string.
3. Select a database and collection.
4. Browse documents and inspect inferred fields.
5. Build an aggregation pipeline using the visual interface.
6. Review the generated MongoDB Shell, Node.js, or Python code.
7. Execute the query and inspect the returned results.
8. Review post-execution statistics when available.
9. Optionally use the AI assistant for query generation, explanation, or correction.

## AI Assistant
MongoFlow includes an optional AI assistant based on a configured external model provider.

The assistant can help with:
- Natural-language query formulation
- MongoDB query explanation
- Post-execution error explanation
- Query correction suggestions
- Aggregation pipeline generation

The AI assistant works by sending a structured prompt to the configured provider. When available, the prompt may include:
- Selected database name
- Selected collection name
- Inferred field information 
- Truncated sample document structure
- Recent commands
- Runtime error messages
- Failed command text

AI-generated output is shown to the user for review. It should not be treated as authoritative. Generated queries may be incorrect, incomplete, inefficient, or unsafe if executed without verification.

## AI Privacy Notice

When AI assistance is enabled, MongoFlow may send database context to the configured AI provider, including collection names, inferred field information, sample document structure, recent commands, and error messages.

Do not use AI assistance with sensitive, confidential, regulated, or production data unless your deployment and provider configuration satisfy your privacy and security requirements.

The AI assistant does not require sending MongoDB passwords or connection strings to the model provider.

## Security Considerations
MongoFlow handles MongoDB operations through a server-side layer so that database operations and AI requests are not executed directly from the browser.

However, the current version should not be exposed as a public shared service without additional security hardening.

For secure deployment, consider:
- Enabling authentication for the MongoFlow interface
- Isolating database connections per user
- Avoiding shared credentials
- Using least-privilege MongoDB users
- Avoiding public exposure of development deployments
- Using HTTPS
- Avoiding logs that contain connection strings or sensitive data
- Reviewing AI-provider privacy settings before enabling AI features

## Reproducibility

A reproducibility package is provided in the repository under: `reproducibility/`

The package includes:
- Local MongoDB setup instructions
- Sample e-commerce dataset
- Reproduction workflow
- Expected aggregation query
- Expected results
- Notes on optional AI-assisted reproduction

The core workflow can be reproduced without an AI key. AI-assisted query generation and correction require a configured Gemini API key.

## Evaluation

MongoFlow was evaluated during an engineering-class practical session. The evaluation covered representative MongoDB tasks, including:
- Database connection
- Document browsing
- Schema inspection
- Visual aggregation construction
- Code generation
- Query execution
- AI-assisted query generation or correction

## Testing Status
The current version includes manual validation through reproducible workflows and classroom evaluation.

A comprehensive automated test suite is planned. Future tests should include:
- Unit tests for aggregation pipeline serialization
- Integration tests for MongoDB API routes 
- UI tests for the visual aggregation builder 
- Regression tests for AI prompt and context construction 
- Safety tests for destructive-command warnings

Current available checks:
```bash
npm run lint
npm run build
```

## Accessibility Status
MongoFlow has not yet undergone a formal WCAG accessibility audit.

Future accessibility work should include:
- Keyboard navigation checks
- Focus-order checks
- Screen-reader label review
- Color-contrast review
- Form-label review
- Error-message accessibility review

## Documentation
The detailed documentation for MongoFlow is available in the `docs/` directory.

## Limitations
MongoFlow has the following current limitations:
- AI-generated queries are not formally verified.
- AI outputs may vary across runs. 
- AI features depend on an external model provider. 
- AI use may send database context to the configured provider. 
- Sample-based schema inference may miss rare fields or mixed field types. 
- The tool does not currently provide full production-grade multi-user isolation. 
- The project does not yet include a comprehensive automated test suite. 
- A formal accessibility audit has not yet been conducted. 

## Roadmap
Planned improvements include:
- Stronger authentication and authorization support 
- User-specific connection isolation 
- Additional AI-provider configuration options 
- Optional support for local or self-hosted language models 
- Pre-execution validation for unknown fields and potentially unsafe operations 
- More complete automated testing 
- More onboarding examples and tutorials 
- Broader evaluation with additional users and datasets 
- Formal accessibility review

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or contributions, please open an issue on GitHub.
