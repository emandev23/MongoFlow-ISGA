# AI Assistant Design

This document describes the design of the MongoFlow AI assistant, including its purpose, context construction, prompt strategy, error-handling workflow, expected output format, limitations, and privacy considerations.

## 1. Purpose

The MongoFlow AI assistant is designed to support users while they interact with MongoDB databases through the web interface. Its role is not to replace the user or execute database operations automatically, but to provide practical assistance during common MongoDB tasks.

The assistant supports the following use cases:

- Generating MongoDB queries from natural-language requests.
- Correcting erroneous MongoDB shell commands.
- Explaining query errors in a concise way.
- Suggesting executable MongoDB Shell or JavaScript code.
- Using the current database, collection, schema, and recent command history to produce context-aware suggestions.

## 2. AI Workflow

The AI assistant follows a server-side request workflow.

1. The user asks a question or triggers AI assistance from the interface.
2. MongoFlow collects the current database context.
3. The backend builds a structured prompt using the user message and available context.
4. The prompt is sent to the configured AI provider.
5. The AI response is returned to the interface.
6. The user reviews the suggested explanation or code.
7. The user decides whether to copy or execute the suggested command.

AI-generated output is treated as a recommendation. MongoFlow does not consider AI output authoritative.

## 3. Context Sent to the AI Assistant

When available, MongoFlow includes the following contextual information in the prompt:

- Current database name.
- Current collection name.
- Inferred collection schema.
- A sample document structure.
- Recent MongoDB commands.
- Recent command errors.
- The failed command that produced an error.
- The user’s current question or request.

The schema is truncated to a limited number of fields before being sent to the model. In the current implementation, up to 30 schema fields are included.

The sample document is also truncated before being sent. In the current implementation, the serialized sample document is limited to approximately 500 characters.

This context is used to help the assistant produce MongoDB code that matches the active collection structure.

## 4. Prompt Construction

MongoFlow builds a system prompt that instructs the AI assistant to behave as a MongoDB coding assistant.

The assistant is instructed to:

- Provide ready-to-use MongoDB code.
- Use the current database, collection, and schema.
- Correct failed commands when errors are detected.
- Return complete and executable examples.
- Prefer MongoDB Shell syntax when relevant.
- Be concise while still explaining important issues.

The current prompt template is shown below.

```typescript
let systemPrompt = `You are an intelligent MongoDB AI agent that actively assists users. Your role is to:

1. **Proactively Help**: When you see errors in the user's commands, immediately provide fixes
2. **Write Code Directly**: Always provide ready-to-use MongoDB code that can be executed immediately
3. **Context Awareness**: Use the current database, collection, and schema to provide accurate solutions
4. **Agent Behavior**: Act like a coding assistant that writes code, not just explains it

**Important Guidelines:**
- Always provide code in \`\`\`javascript or \`\`\`mongodb code blocks
- Code should be complete and executable
- When fixing errors, show the corrected code immediately
- Be concise but thorough
- Use the schema information to write accurate queries
- If you see a failed command, analyze it and provide the fix

**MongoDB Shell Syntax:**
- Use \`new Date()\` for dates (it's supported and will be converted to Date objects)
- Use proper MongoDB shell syntax: \`db.collection.find()\`, \`db.collection.insertMany([...])\`
- For aggregation: \`db.collection.aggregate([...])\`
- For updates with upsert: \`db.collection.updateOne(filter, update, { upsert: true })\`
- Multiple commands can be separated by semicolons: \`command1; command2\`

**Common Error Fixes:**
1. "Invalid insert document syntax": Check for missing commas, unclosed brackets, or quotes
2. "Invalid update syntax": Ensure filter and update are properly separated, check for syntax errors
3. "Command not supported": Use alternative supported commands (bulkWrite is supported, but you can also use multiple insertOne/updateOne)
4. For arrays with multiple documents, ensure proper comma separation
5. When using new Date(), it must be inside the document/array, not as a string
`;
```

The prompt is then extended with runtime context.

````typescript
if (context) {
  systemPrompt += `Current Context:
- Database: ${context.database || 'Not selected'}
- Collection: ${context.collection || 'Not selected'}
`;

  if (context.schema && context.schema.length > 0) {
    systemPrompt += `\nCollection Schema:\n`;
    context.schema.slice(0, 30).forEach((field: any) => {
      systemPrompt += `- ${field.path} (${field.type})\n`;
    });
  }

  if (context.sampleDocuments && context.sampleDocuments.length > 0) {
    systemPrompt += `\nSample Document Structure:\n`;
    systemPrompt += JSON.stringify(context.sampleDocuments[0], null, 2).substring(0, 500);
    systemPrompt += '\n';
  }

  if (context.recentError) {
    systemPrompt += `\n⚠️ CRITICAL: Recent Error Detected - Fix Required!\n`;
    systemPrompt += `Error: ${context.recentError}\n`;
    systemPrompt += `Failed Command: ${context.failedCommand || 'Unknown'}\n`;
    systemPrompt += `\nURGENT: Analyze the error and provide the CORRECTED, COMPLETE code that will work.\n`;
    systemPrompt += `Common issues to check:\n`;
    systemPrompt += `- Missing commas in arrays/objects\n`;
    systemPrompt += `- Unclosed brackets or braces\n`;
    systemPrompt += `- Incorrect parameter order\n`;
    systemPrompt += `- Missing quotes around strings\n`;
    systemPrompt += `- new Date() syntax issues\n`;
    systemPrompt += `- Multiple commands need semicolon separation\n`;
    systemPrompt += `\nProvide the fixed code in a code block immediately.\n`;
  }

  if (context.recentCommands && context.recentCommands.length > 0) {
    systemPrompt += `\nRecent Commands:\n`;
    context.recentCommands.forEach((cmd: any, idx: number) => {
      systemPrompt += `${idx + 1}. ${cmd.command}`;
      if (cmd.error) {
        systemPrompt += ` [ERROR: ${cmd.error}]`;
      }
      systemPrompt += '\n';
    });
  }
}

systemPrompt += `\nProvide clear, concise, and practical answers. When providing code examples, use MongoDB shell syntax or JavaScript syntax as appropriate.`;

const prompt = `${systemPrompt}\n\nUser Question: ${message}\n\nAssistant:`;
````

## 5. Error-Correction Workflow
When MongoFlow detects a failed MongoDB command, the assistant receives both the error message and the failed command.

The prompt explicitly marks this situation as a recent error and asks the assistant to provide corrected code immediately.

The assistant is guided to check for common MongoDB syntax problems, including:
* Missing commas in arrays or objects.
* Unclosed brackets or braces.
* Incorrect parameter order.
* Missing quotes around string values.
* Incorrect new Date() usage.
* Multiple commands that require semicolon separation.

This design allows MongoFlow to provide immediate debugging assistance while keeping the user in control of whether the corrected command is executed.

## 6. Expected AI Output
The AI assistant is expected to return:
* A short explanation of the issue or solution.
* A complete MongoDB Shell or JavaScript code block.
* Code that can be copied or executed by the user.
* Suggestions that use the active database and collection when possible.

Example expected output:
````mongodb
db.products.aggregate([
  {
    $match: {
      category: "Electronics"
    }
  },
  {
    $sort: {
      price: -1
    }
  }
]);
````

## 7. User Control and Execution
MongoFlow displays AI-generated output to the user before execution.

The user remains responsible for reviewing the generated command. This is important because AI-generated code may be syntactically valid but semantically incorrect, incomplete, inefficient, or unsuitable for the user’s dataset.

The assistant should therefore be considered a support tool, not an automatic decision-making component.

## 8. Privacy and Data Considerations

The AI assistant may include database-related context in the prompt. Depending on the active user session, this may include:
* Database name.
* Collection name.
* Field names and inferred types.
* A sample document structure.
* Recent commands.
* Error messages.

Users should avoid using AI assistance with sensitive, confidential, regulated, or production data unless their deployment and AI-provider configuration are approved for that use.

MongoFlow should not send database passwords or connection strings to the AI assistant.

## 9. Limitations
The AI assistant has several limitations:
* It may generate incorrect MongoDB queries.
* It may generate queries that are syntactically valid but do not match the user’s intended meaning.
* It may produce inefficient aggregation pipelines.
* It may fail to account for hidden constraints in the database.
* It depends on the availability and behavior of the configured external AI provider.
* It may produce different answers for similar prompts.
* It may not fully detect security or performance risks in generated commands.

For these reasons, MongoFlow presents AI output as a suggestion that should be reviewed by the user.

## 10. Known Failure Cases
Possible failure cases include:
* Incorrect field names when the schema is incomplete or inferred from too few documents.
* Incorrect assumptions about nested document structures.
* Aggregation pipelines that work on sample data but fail on other documents.
* Queries that return correct results but scan too many documents.
* Explanations that are plausible but incomplete.
* Update or delete commands that require additional user verification before execution.

## 11. Evaluation Plan
The AI assistant will was evaluated as part of a student-based usability study.

The planned evaluation examined:
* Whether students can use the assistant to correct MongoDB errors.
* Whether AI-generated explanations help students understand aggregation queries.
* Whether AI assistance reduces perceived difficulty.
* Whether students trust the AI output only after reviewing it.
* Whether students identify unclear or incorrect AI suggestions.

The evaluation collected both quantitative feedback, such as Likert-scale ratings, and qualitative feedback, such as comments about helpful or incorrect AI responses.