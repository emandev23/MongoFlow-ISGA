import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Please set GEMINI_API_KEY in your environment variables.' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Try to discover available models from Google API (optional, non-blocking)
    let availableModels: string[] = [];
    try {
      const modelsResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        { signal: AbortSignal.timeout(3000) } // 3 second timeout
      );
      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        const models = modelsData.models || [];
        availableModels = models
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => m.name.replace('models/', ''))
          .filter((name: string) => name.includes('gemini'));
        console.log('Discovered models:', availableModels);
      }
    } catch (e) {
      // Ignore model listing errors, use defaults
      console.log('Could not fetch available models, using defaults:', e);
    }

    // Build context-aware prompt
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

      // Add recent errors and commands for proactive help
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

    // Try models in order of preference
    // Use discovered models if available, otherwise use current available models
    // Updated with latest Gemini model names (2024/2025)
    const defaultModels = [
      'gemini-2.5-flash',      // Latest fast model
      'gemini-3-flash',        // Latest generation
      'gemini-2.0-flash',      // Alternative
      'gemini-2.5-flash-lite', // Lightweight version
      'gemini-1.5-flash',      // Fallback to older version
      'gemini-1.5-pro',        // Fallback to older version
    ];
    
    const modelsToTry = availableModels.length > 0 
      ? [...availableModels, ...defaultModels] // Try discovered first, then defaults
      : defaultModels;
    
    console.log('Trying models:', modelsToTry);

    let lastError: any = null;
    let success = false;
    let text = '';

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
        success = true;
        console.log(`Successfully used model: ${modelName}`);
        break;
      } catch (error: any) {
        lastError = error;
        console.log(`Model ${modelName} failed:`, error.message);
        // Continue to next model
        continue;
      }
    }

    if (!success) {
      // If all models failed, provide helpful error
      const errorMsg = lastError?.message || 'Unknown error';
      throw new Error(
        `All Gemini models failed. Last error: ${errorMsg}. ` +
        `Please verify your API key is valid and has access to Gemini models. ` +
        `You can check available models at https://ai.google.dev/models`
      );
    }

    return NextResponse.json({ 
      response: text,
      success: true
    });
  } catch (error: any) {
    console.error('Gemini API error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to get AI response' },
      { status: 500 }
    );
  }
}
