# Changelog

All notable changes to MongoFlow are documented in this file.

The project follows semantic versioning where possible.

## [0.2.0] - SoftwareX revision

### Added

- Added reproducibility material for the SoftwareX revision.
- Added an advanced e-commerce aggregation workflow example.
- Added sample-data and expected-query documentation for reproducing the paper example.
- Added evaluation documentation based on an engineering-class practical session.
- Added documentation for the AI assistant design, including prompt construction, context fields, error-handling workflow, and limitations.
- Added architecture-rationale documentation explaining the three-tier design, alternatives considered, and trade-offs.
- Added security documentation covering connection strings, shared deployments, AI-related privacy, and destructive-command risks.
- Added limitations documentation covering AI output variability, external provider dependency, evaluation scope, and deployment assumptions.
- Added accessibility-status documentation.
- Added testing-status documentation.
- Added related-tools comparison documentation.
- Added paper-positioning documentation for the SoftwareX submission.
- Added research-use documentation explaining how MongoFlow can support studies on MongoDB learning and AI-assisted database interaction.

### Changed

- Revised project terminology to avoid overstatement and align with the revised manuscript.
- Replaced “schema-aware exploration” with “sample-based schema inference” or “inferred-schema exploration.”
- Replaced “polyglot code generation” with “multi-language code export.”
- Replaced “real-time performance feedback” with “post-execution statistics.”
- Replaced “contextual error detection” and “automatic error detection” with “post-execution error capture” and “AI-assisted error explanation and correction.”
- Reorganized documentation to distinguish core MongoFlow workflow features from supporting database-client functionality.
- Updated the README to include clearer project scope, requirements, usage, AI privacy notice, security considerations, reproducibility, evaluation, testing status, accessibility status, limitations, and roadmap.
- Updated the project positioning to clarify that MongoFlow is a research software artifact, not a new database algorithm or a new language model.
- Updated AI documentation to state that generated queries are suggestions and should be reviewed before execution.
- Updated comparison wording to acknowledge the mature capabilities of existing tools such as MongoDB Compass, Studio 3T, NoSQLBooster, and Chat2DB.
- Updated deployment/security wording to avoid suggesting production-ready multi-tenant use without additional hardening.

### Removed

- Removed or replaced promotional terminology such as “astute copilot,” “advanced,” “professional,” and “significantly diminishing development time.”
- Removed wording that implied formal AI validation, static query analysis, or automatic correctness guarantees.
- Removed wording that implied MongoFlow is a replacement for mature MongoDB clients.
- Removed or archived outdated reviewer-facing setup notes that were no longer relevant to the public repository.
- Removed duplicate or outdated SoftwareX draft documentation that was not synchronized with the revised manuscript.

### Documentation

- Added `docs/index.md`.
- Added `docs/architecture-rationale.md`.
- Added `docs/security.md`.
- Added `docs/accessibility.md`.
- Added `docs/testing.md`.
- Added `docs/related-tools-comparison.md`.
- Added `docs/research-use.md`.
- Added `docs/examples/advanced-ecommerce-aggregation.md`.
- Added `docs/figures/simplified-architecture.mmd`.

### Evaluation

- Added evaluation task descriptions.
- Added questionnaire documentation.
- Added aggregated evaluation summary.
- Added expected queries for evaluation and reproduction.

### Reproducibility

- Added a reproducibility workflow for the advanced e-commerce aggregation example.
- Added documentation explaining which features can be reproduced without AI access.
- Clarified that AI-assisted features require a configured Gemini API key.

### Security and Privacy

- Added explicit AI privacy notice.
- Added warning that AI assistance may send database context to the configured AI provider.
- Added guidance not to use AI assistance with sensitive or regulated data unless privacy requirements are satisfied.
- Added warning that MongoFlow should not be exposed publicly without authentication, authorization, user-specific connection isolation, secure credential handling, and HTTPS.

### Known Limitations

- No comprehensive automated test suite is included yet.
- No formal WCAG accessibility audit has been completed yet.
- AI-generated outputs are not formally verified.
- AI responses may vary across runs.
- AI features depend on an external model provider.
- Production multi-user deployment requires additional security mechanisms.

## [0.1.0] - Initial release

### Added

- Initial MongoFlow web application.
- MongoDB connection interface.
- Document browsing and editing.
- Visual aggregation pipeline builder.
- Generated MongoDB Shell, Node.js, and Python code.
- Integrated MongoDB shell.
- AI-assisted query generation and correction using Gemini.
- Schema inspection interface.
- Index management.
- Validation-rule management.
- Query history.
- Breadcrumb navigation.
- Initial SoftwareX submission repository.