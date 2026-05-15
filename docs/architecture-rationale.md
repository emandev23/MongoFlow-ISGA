# Architecture Rationale

MongoFlow uses a browser-based interface, a server-side application layer, and MongoDB as the data layer.

The architecture was selected to support four goals:

1. Browser-based access without requiring a desktop installation.
2. Server-side handling of MongoDB connection operations.
3. Server-side handling of AI API calls and prompt construction.
4. Reproducible deployment for educational and exploratory use.

## Architecture Overview

MongoFlow follows a three-tier structure:

- Presentation layer: browser interface used for documents, schema inspection, aggregation construction, shell interaction, generated code, and AI chat.
- Application layer: MongoFlow server responsible for API routes, request handling, database mediation, AI context construction, and communication with external services.
- Data layer: MongoDB instance accessed through the server-side MongoDB driver.

The external AI provider is shown separately because it is not part of the database layer. It is used only when AI-assisted query generation, explanation, or correction is requested.

## Why a Server-Side Layer Is Used

MongoFlow uses a server-side layer because MongoDB connection handling and AI API access should not be implemented directly in the browser.

The server-side layer allows MongoFlow to:

- mediate MongoDB operations;
- avoid exposing AI API keys to the browser;
- build AI prompts using database context;
- centralize request handling;
- support local, institutional, or cloud deployment.

## Alternatives Considered

### Desktop application

A desktop application would allow local database interaction but would require installation and updates on each user machine. This is less suitable for classroom and shared environments.

### Client-only web application

A client-only architecture was not selected because it would expose sensitive logic and make credential handling more difficult.

### Microservice architecture

A microservice architecture could separate database access, AI communication, authentication, and logging into independent services. This was not adopted in the current version because it would add deployment complexity beyond the scope of the research prototype.

## Selected Trade-off

The selected architecture balances accessibility, simplicity, and controlled server-side mediation.

It is appropriate for educational and exploratory MongoDB workflows, but production or shared deployments require additional security measures such as authentication, authorization, user-specific connection isolation, and audit logging.

## Mapping to the Architecture Figure

The simplified architecture figure contains four main elements:

- Browser interface: presentation layer.
- MongoFlow server: application layer.
- MongoDB database: data layer.
- AI provider: external service used for AI-assisted features.

The browser interface sends database, query, and AI requests to the MongoFlow server. The server communicates with MongoDB for data operations and with the AI provider when AI assistance is requested. Results, generated code, post-execution statistics, and AI responses are returned to the browser for user review.