'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, X, Minimize2, Maximize2, Sparkles, Code, Copy, Play, AlertCircle, Lightbulb } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { usePipelineStore } from '@/store/pipelineStore';
import { useDocumentStore } from '@/store/documentStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeBlocks?: string[];
  suggestions?: string[];
}

interface AIAssistantProps {
  shellHistory?: Array<{ command: string; error?: string; result?: any }>;
  onInsertCode?: (code: string) => void;
  onExecuteCode?: (code: string) => void;
}

export function AIAssistant({ shellHistory = [], onInsertCode, onExecuteCode }: AIAssistantProps) {
  const { selectedDatabase, selectedCollection, connectionString } = useWorkflowStore();
  const { schema } = usePipelineStore();
  const { documents } = useDocumentStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your MongoDB AI assistant. I can help you write queries, fix errors, and write code directly. I\'m watching your shell for errors and will help automatically!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const processedErrorsRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Monitor shell for errors and proactively help
  useEffect(() => {
    if (shellHistory.length > 0) {
      const lastCommand = shellHistory[shellHistory.length - 1];
      // Check if there's a new error
      if (lastCommand.error) {
        const errorKey = `${lastCommand.command}-${lastCommand.error}`;
        if (errorKey !== lastError) {
          setLastError(errorKey);
          // Automatically ask AI to help with the error
          handleAutoHelp(lastCommand.command, lastCommand.error);
        }
      } else if (lastCommand.result && lastError) {
        // Clear error state if command succeeded
        setLastError(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shellHistory, lastError]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractCodeBlocks = (text: string): string[] => {
    const codeBlockRegex = /```(?:javascript|js|mongodb|mongo)?\n?([\s\S]*?)```/g;
    const matches = [];
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      matches.push(match[1].trim());
    }
    return matches;
  };

  const handleAutoHelp = async (command: string, error: string) => {
    // Prevent duplicate processing
    const errorKey = `${command}-${error}`;
    if (processedErrorsRef.current.has(errorKey) || isLoading) {
      return;
    }
    processedErrorsRef.current.add(errorKey);

    setIsLoading(true);
    
    // Show that AI is analyzing the error
    const analyzingMessage: Message = {
      role: 'assistant',
      content: `🔍 **Error Detected!**\n\nI'm analyzing the error and preparing a fix...`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, analyzingMessage]);

    try {
      const context = {
        database: selectedDatabase,
        collection: selectedCollection,
        schema: schema.slice(0, 50),
        sampleDocuments: documents.slice(0, 3),
        recentError: error,
        failedCommand: command,
      };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `I got this error: "${error}" when running this MongoDB command: "${command}". 

Please:
1. Analyze the error
2. Identify what's wrong
3. Provide the CORRECTED, COMPLETE code that will work
4. Make sure the code is ready to execute (use proper MongoDB shell syntax)`,
          context,
        }),
      });

      const data = await response.json();

      if (data.success && data.response) {
        const codeBlocks = extractCodeBlocks(data.response);
        
        // If no code blocks found, try to extract code from the response
        let finalCodeBlocks = codeBlocks;
        if (codeBlocks.length === 0) {
          // Look for code patterns in the response
          const codePattern = /(db\.\w+\.\w+\([^)]*\)|db\.\w+\.\w+\(\[[\s\S]*?\]\))/g;
          const matches = data.response.match(codePattern);
          if (matches) {
            finalCodeBlocks = matches;
          }
        }

        const assistantMessage: Message = {
          role: 'assistant',
          content: `❌ **Error Fixed!**\n\n**Original Error:** ${error}\n**Failed Command:** \`${command.substring(0, 100)}${command.length > 100 ? '...' : ''}\`\n\n---\n\n**Solution:**\n${data.response}\n\n💡 Use the buttons below to insert or execute the corrected code.`,
          timestamp: new Date(),
          codeBlocks: finalCodeBlocks,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get AI response');
      }
    } catch (error: any) {
      console.error('Auto-help error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `⚠️ I tried to help but encountered an issue: ${error.message}. You can ask me directly to fix the error.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Prepare context for AI
      const context = {
        database: selectedDatabase,
        collection: selectedCollection,
        schema: schema.slice(0, 50),
        sampleDocuments: documents.slice(0, 3),
        recentCommands: shellHistory.slice(-3).map(h => ({
          command: h.command,
          error: h.error,
        })),
      };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userInput,
          context,
        }),
      });

      const data = await response.json();

      if (data.success && data.response) {
        const codeBlocks = extractCodeBlocks(data.response);
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          codeBlocks,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please make sure GEMINI_API_KEY is set in your environment variables.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInsertCode = (code: string) => {
    // Try to insert into shell via window function
    if ((window as any).mongoShellInsertCode) {
      (window as any).mongoShellInsertCode(code);
      const confirmMessage: Message = {
        role: 'assistant',
        content: `✅ Code inserted into shell! You can now execute it.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, confirmMessage]);
    } else if (onInsertCode) {
      onInsertCode(code);
      const confirmMessage: Message = {
        role: 'assistant',
        content: `✅ Code inserted!`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, confirmMessage]);
    }
  };

  const handleExecuteCode = async (code: string) => {
    if (!connectionString || !selectedDatabase) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ Cannot execute: No database connection. Please connect to MongoDB first.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const executingMessage: Message = {
      role: 'assistant',
      content: `🚀 Executing code...`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, executingMessage]);

    try {
      const response = await fetch('/api/mongodb/shell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionString,
          databaseName: selectedDatabase,
          collectionName: selectedCollection,
          command: code,
        }),
      });

      const data = await response.json();

      // Dispatch event to update shell history and expand shell
      const executeEvent = new CustomEvent('mongoShellExecute', {
        detail: {
          command: code,
          result: data.result,
          error: data.error,
        },
      });
      window.dispatchEvent(executeEvent);
      
      // Also trigger shell expansion event
      const expandEvent = new CustomEvent('mongoShellExpand');
      window.dispatchEvent(expandEvent);

      // Also call callback if provided
      if (onExecuteCode) {
        onExecuteCode(code);
      }

      // Show result in chat
      let resultContent = '';
      if (data.error) {
        resultContent = `❌ **Execution Failed**\n\n**Error:** ${data.error}\n\n💡 I'm analyzing this error and will provide a fix...`;
        
        // Automatically trigger error fix
        setTimeout(() => {
          handleAutoHelp(code, data.error);
        }, 500);
      } else {
        const resultStr = typeof data.result === 'string' 
          ? data.result 
          : JSON.stringify(data.result, null, 2);
        const preview = resultStr.length > 500 
          ? resultStr.substring(0, 500) + '\n... (truncated, see shell for full result)'
          : resultStr;
        resultContent = `✅ Executed successfully!\n\n📋 Preview:\n\`\`\`json\n${preview}\n\`\`\`\n\n💡 Check the MongoDB Shell below to see the full result.`;
      }

      const resultMessage: Message = {
        role: 'assistant',
        content: resultContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, resultMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ Execution failed: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    const confirmMessage: Message = {
      role: 'assistant',
      content: `📋 Code copied to clipboard!`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, confirmMessage]);
  };

  const suggestedQuestions = [
    'Write a query to find all products in stock',
    'Create an aggregation to group by category',
    'Show me how to create an index',
    'Fix my last error',
  ];

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <Bot className="h-6 w-6" />
        {lastError && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
            <AlertCircle className="h-3 w-3 text-white" />
          </span>
        )}
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-6 right-6 w-96 ${isMinimized ? 'h-16' : 'h-[600px]'} shadow-2xl z-50 flex flex-col transition-all duration-300`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">AI Assistant</CardTitle>
          {selectedCollection && (
            <Badge variant="outline" className="text-xs">
              {selectedCollection}
            </Badge>
          )}
          {lastError && (
            <Badge variant="destructive" className="text-xs animate-pulse">
              <AlertCircle className="h-3 w-3 mr-1" />
              Error Detected
            </Badge>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 1 && (
              <div className="space-y-2 mb-4">
                <p className="text-xs text-muted-foreground font-medium">Quick actions:</p>
                {suggestedQuestions.map((q, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start h-auto py-2 text-xs"
                    onClick={() => setInput(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            )}

            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* Code blocks with action buttons */}
                    {msg.codeBlocks && msg.codeBlocks.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.codeBlocks.map((code, codeIdx) => (
                          <div key={codeIdx} className="bg-background border rounded-lg p-2">
                            <pre className="text-xs overflow-x-auto mb-2">
                              <code>{code}</code>
                            </pre>
                            <div className="flex gap-2">
                              {onInsertCode && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleInsertCode(code)}
                                >
                                  <Code className="h-3 w-3 mr-1" />
                                  Insert
                                </Button>
                              )}
                              {onExecuteCode && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleExecuteCode(code)}
                                >
                                  <Play className="h-3 w-3 mr-1" />
                                  Execute
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => copyToClipboard(code)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>

          <div className="border-t p-3">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything or say 'fix my error'..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {lastError && (
                <Badge variant="destructive" className="text-xs">
                  <Lightbulb className="h-3 w-3 mr-1" />
                  I&apos;m helping with your error
                </Badge>
              )}
              {!selectedCollection && (
                <p className="text-xs text-muted-foreground">
                  💡 Select a collection for context-aware assistance
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
