# Research Use of MongoFlow

MongoFlow can be used as a research software artifact for studying MongoDB interaction, database education, visual query construction, and AI-assisted query support.

## Research Context

MongoFlow does not claim that its tasks cannot be performed with separate tools such as MongoDB Compass and a general-purpose AI chat interface.

Its value is that these interactions are integrated into a single open-source web environment where database context, inferred field information, visual query construction, generated code, execution results, recent commands, and AI suggestions can be studied together.

## Possible Research Uses

MongoFlow can support studies on:

- MongoDB learning in classroom settings;
- visual aggregation pipeline construction;
- user understanding of generated database code;
- AI-assisted query formulation;
- AI-assisted post-execution error explanation;
- trust in AI-generated database commands;
- user review of AI-generated code;
- interaction with inferred schema information;
- educational database tooling;
- human-database interaction.

## Instrumentation Potential

Because MongoFlow is open source, future versions can be instrumented to collect anonymized interaction data such as:

- task completion events;
- time spent on each workflow step;
- stages added to aggregation pipelines;
- generated-code views;
- AI-assistant usage;
- query execution outcomes;
- runtime errors;
- correction attempts.

Any such instrumentation should respect privacy, informed consent, and institutional requirements.

## Current Evaluation

MongoFlow was evaluated in an engineering-class practical session. The evaluation focused on usability, learning support, AI usefulness, and task completion in an educational setting.

The results are interpreted as initial evidence, not as proof of superiority over all MongoDB tools or workflows.

## Future Research Directions

Future studies may include:

- controlled comparisons with MongoDB Compass or MongoDB Shell;
- longitudinal classroom deployments;
- AI-query correctness benchmarks;
- repeated AI-output stability tests;
- latency measurements;
- accessibility evaluation;
- studies with professional developers or database administrators.