# Testing Status

MongoFlow currently includes manual validation through reproducible workflows and classroom evaluation.

A comprehensive automated test suite has not yet been implemented.

## Current Checks

The current project supports standard development checks such as:

```bash
npm run lint
npm run build
```

These commands help identify linting and build issues, but they do not replace a complete automated test suite.

## Planned Automated Tests

Future work will include the following test categories.

### Unit tests

Planned unit tests will cover:

- aggregation pipeline representation;
- pipeline serialization;
- generated MongoDB Shell code;
- generated Node.js code;
- generated Python code;
- utility functions for field and type handling.

### Integration tests

Planned integration tests will cover:

- MongoDB connection handling;
- document listing;
- CRUD operations;
- aggregation execution;
- index-management API routes;
- validation-rule API routes. 

### UI tests

Planned UI tests will cover:

- database selection;
- collection selection;
- document browsing;
- schema tree display;
- visual aggregation builder;
- code export panel;
- shell interaction;
- query history.

### AI-related regression tests

Planned AI tests will cover:

- prompt construction;
- context truncation;
- inclusion of database and collection context;
- inclusion of schema fields;
- inclusion of recent commands;
- inclusion of runtime error messages;
- handling of failed commands;
- destructive-command warning behavior.

Manual Reproduction

The repository includes a reproducibility package with:
- sample data;
- expected queries;
- expected results;
- step-by-step reproduction instructions.