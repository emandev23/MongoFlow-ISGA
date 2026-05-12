# MongoFlow Reproducibility Package

This folder contains the material required to reproduce the main MongoFlow demonstration workflow described in the paper.

The package allows reviewers and readers to reproduce the following workflow:

1. Start a local MongoDB instance.
2. Load a sample e-commerce dataset.
3. Connect MongoFlow to the database.
4. Browse the `ecommerce.products` collection.
5. Inspect the schema.
6. Build an aggregation pipeline.
7. Generate MongoDB Shell code.
8. Execute the query.
9. Compare the result with the expected output.
10. Optionally test AI-assisted query generation or correction if a Gemini API key is configured.

## Reproducible components

The following components can be reproduced locally:

- MongoDB database setup
- Sample dataset loading
- Document browsing
- Schema inspection
- Visual aggregation pipeline construction
- Generated MongoDB Shell query
- Query execution
- Post-execution statistics display

## Optional AI component

The AI assistant requires a valid Gemini API key.

If no Gemini API key is provided, the core MongoFlow workflow remains reproducible, but AI-assisted query generation and error correction will not be available.

## Requirements

- Node.js 18 or later
- npm or yarn
- Docker and Docker Compose
- MongoFlow source code
- Optional: Gemini API key for AI features

## Quick reproduction steps

From the root of the MongoFlow repository:

```bash
cd reproducibility
docker compose up -d
```
Import the sample dataset:
```bash
docker exec -i mongoflow-repro-mongodb mongoimport \
  --db ecommerce \
  --collection products \
  --drop \
  --jsonArray < sample-data/products.json
```
Return to the project root:
```bash
cd ..
npm install
npm run dev
```

Open MongoFlow in the browser:
``http://localhost:3000``

Use the following MongoDB connection string: ``mongodb://127.0.0.1:27017``

## Notes
The MongoDB container exposed by this reproducibility package is intended for local testing only. It should not be used as a production database.

The expected aggregation query is provided in `expected-queries.md`

The expected output is provided in `expected-results.md`