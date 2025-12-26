'use client';

import { useState, useRef, useEffect } from 'react';
import { useWorkflowStore } from '@/store/workflowStore';
import { Button } from '@/components/ui/button';
import { Terminal, Play, Trash2, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CommandHistory {
  command: string;
  result: any;
  error?: string;
  timestamp: Date;
}

interface MongoShellProps {
  isExpanded: boolean;
  onToggle: () => void;
  onHistoryChange?: (history: CommandHistory[]) => void;
}

export type { CommandHistory };

export function MongoShell({ isExpanded, onToggle, onHistoryChange }: MongoShellProps) {
  const { selectedCollection, selectedDatabase, connectionString } = useWorkflowStore();
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const insertCodeRef = useRef<(code: string) => void>();

  // Expose insertCode function globally for AI Assistant
  useEffect(() => {
    insertCodeRef.current = (code: string) => {
      setCommand(code);
      if (inputRef.current) {
        inputRef.current.focus();
        // Scroll to input
        inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };
    // Store in window for AI Assistant access
    (window as any).mongoShellInsertCode = insertCodeRef.current;
    return () => {
      delete (window as any).mongoShellInsertCode;
    };
  }, []);

  const collectionName = selectedCollection || 'collection';
  const dbName = selectedDatabase || 'test';

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  // Listen for external code execution (from AI Assistant)
  useEffect(() => {
    const handleExternalExecution = (event: CustomEvent) => {
      const { command, result, error } = event.detail;
      setHistory((prevHistory) => {
        const newHistory = [
          ...prevHistory,
          {
            command,
            result,
            error,
            timestamp: new Date(),
          },
        ];
        if (onHistoryChange) {
          onHistoryChange(newHistory);
        }
        // Scroll to bottom after a short delay to ensure DOM is updated
        setTimeout(() => {
          if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
          }
        }, 100);
        return newHistory;
      });
      
      // Expand shell if collapsed to show results
      if (!isExpanded) {
        setTimeout(() => {
          onToggle();
          // Scroll after expansion
          setTimeout(() => {
            if (outputRef.current) {
              outputRef.current.scrollTop = outputRef.current.scrollHeight;
            }
          }, 300);
        }, 50);
      } else {
        // If already expanded, just scroll
        setTimeout(() => {
          if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
          }
        }, 100);
      }
    };

    window.addEventListener('mongoShellExecute' as any, handleExternalExecution as EventListener);
    return () => {
      window.removeEventListener('mongoShellExecute' as any, handleExternalExecution as EventListener);
    };
  }, [isExpanded, onToggle, onHistoryChange]);

  const executeCommand = async () => {
    if (!command.trim() || !connectionString || !selectedDatabase) {
      return;
    }

    const commandToExecute = command.trim();
    setIsExecuting(true);

    try {
      const response = await fetch('/api/mongodb/shell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionString,
          databaseName: selectedDatabase,
          collectionName: selectedCollection || collectionName,
          command: commandToExecute,
        }),
      });

      const data = await response.json();

      let newHistory: CommandHistory[];
      if (response.ok) {
        newHistory = [
          ...history,
          {
            command: commandToExecute,
            result: data.result,
            timestamp: new Date(),
          },
        ];
      } else {
        newHistory = [
          ...history,
          {
            command: commandToExecute,
            result: null,
            error: data.error || 'Command execution failed',
            timestamp: new Date(),
          },
        ];
      }
      setHistory(newHistory);
      if (onHistoryChange) {
        onHistoryChange(newHistory);
      }
    } catch (error: any) {
      const newHistory = [
        ...history,
        {
          command: commandToExecute,
          result: null,
          error: error.message || 'Failed to execute command',
          timestamp: new Date(),
        },
      ];
      setHistory(newHistory);
      if (onHistoryChange) {
        onHistoryChange(newHistory);
      }
    } finally {
      setIsExecuting(false);
      setCommand('');
      setHistoryIndex(-1);
    }
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      executeCommand();
    } else if (e.key === 'ArrowUp' && history.length > 0) {
      e.preventDefault();
      const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setCommand(history[newIndex].command);
    } else if (e.key === 'ArrowDown' && historyIndex !== -1) {
      e.preventDefault();
      const newIndex = historyIndex + 1;
      if (newIndex >= history.length) {
        setHistoryIndex(-1);
        setCommand('');
      } else {
        setHistoryIndex(newIndex);
        setCommand(history[newIndex].command);
      }
    }
  };

  const formatResult = (result: any): string => {
    if (result === null || result === undefined) {
      return 'null';
    }
    if (typeof result === 'string') {
      return result;
    }
    if (Array.isArray(result)) {
      return JSON.stringify(result, null, 2);
    }
    if (typeof result === 'object') {
      return JSON.stringify(result, null, 2);
    }
    return String(result);
  };

  const getCommandType = (cmd: string): string => {
    const trimmed = cmd.trim().toLowerCase();
    if (trimmed.startsWith('db.')) {
      if (trimmed.includes('.find(')) return 'Query';
      if (trimmed.includes('.aggregate(')) return 'Aggregation';
      if (trimmed.includes('.insert')) return 'Insert';
      if (trimmed.includes('.update')) return 'Update';
      if (trimmed.includes('.delete')) return 'Delete';
      if (trimmed.includes('.create')) return 'Create';
      if (trimmed.includes('.drop')) return 'Drop';
      return 'Command';
    }
    return 'Command';
  };

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-[#0d1117] border-t border-[#21262d] shadow-2xl transition-all duration-300 z-50 ${
        isExpanded ? 'h-[500px]' : 'h-12'
      }`}
    >
      {/* Header Bar - Always Visible */}
      <div
        className="h-12 flex items-center justify-between px-4 cursor-pointer hover:bg-[#161b22] transition-colors bg-[#0d1117] border-b border-[#21262d]"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-[#8b949e]" />
          <span className="text-sm font-medium text-[#c9d1d9]">MongoDB Shell</span>
          <Badge variant="outline" className="text-xs bg-[#161b22] border-[#30363d] text-[#8b949e]">
            {dbName}
            {selectedCollection && ` > ${selectedCollection}`}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {isExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                clearHistory();
              }}
              disabled={history.length === 0}
              className="h-7 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#161b22]"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-[#8b949e]" />
          ) : (
            <ChevronUp className="h-4 w-4 text-[#8b949e]" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="h-[452px] flex flex-col bg-[#0d1117]">
          {/* Output Area */}
          <div
            ref={outputRef}
            className="flex-1 bg-[#0d1117] text-[#58a6ff] font-mono text-sm p-4 overflow-y-auto"
            style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
          >
            {history.length === 0 ? (
              <div className="text-[#8b949e]">
                <div className="text-[#58a6ff]">MongoFlow Shell</div>
                <div className="mt-2 text-[#6e7681]">Type MongoDB commands and press Ctrl+Enter (or Cmd+Enter) to execute.</div>
                <div className="mt-4 text-[#6e7681]">
                  <div className="text-[#8b949e]">Examples:</div>
                  <div className="mt-2 text-[#58a6ff]">
                    <div>db.{collectionName}.find().limit(5)</div>
                    <div>db.{collectionName}.find({'{'}year: 1982{'}'})</div>
                    <div>db.{collectionName}.aggregate([{'{'}$match: {'{'}year: 1982{'}'}{'}'}])</div>
                  </div>
                </div>
              </div>
            ) : (
              history.map((item, index) => (
                <div key={index} className="mb-4">
                  <div className="text-[#58a6ff] mb-1">
                    <span className="text-[#6e7681]">{`${index + 1}.`}</span>{' '}
                    <span className="text-[#79c0ff]">{'>'}</span> <span className="text-[#ff7b72]">{item.command}</span>
                  </div>
                  {item.error ? (
                    <div className="text-[#f85149] mt-1 ml-4">
                      Error: {item.error}
                    </div>
                  ) : (
                    <div className="text-[#58a6ff] mt-1 ml-4 whitespace-pre-wrap">
                      {formatResult(item.result)}
                    </div>
                  )}
                  <div className="text-[#6e7681] text-xs mt-1 ml-4">
                    {item.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
            {isExecuting && (
              <div className="text-[#79c0ff] mt-2">
                <span className="animate-pulse">Executing...</span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-[#21262d] p-3 bg-[#161b22]">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-sm text-[#8b949e] flex-1 font-mono">
                <span className="text-[#79c0ff]">{'>'}</span> <span className="text-[#58a6ff]">db</span>.<span className="text-[#58a6ff]">{collectionName}</span>.
              </div>
              <Button
                onClick={executeCommand}
                disabled={!command.trim() || isExecuting || !connectionString || !selectedDatabase}
                size="sm"
                className="h-7 bg-[#238636] hover:bg-[#2ea043] text-white border-0"
              >
                <Play className="h-3 w-3 mr-1" />
                Execute
              </Button>
            </div>
            <textarea
              ref={inputRef}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`db.${collectionName}.find().limit(10)`}
              className="w-full h-20 font-mono text-sm p-3 bg-[#0d1117] text-[#c9d1d9] border border-[#30363d] rounded focus:outline-none focus:ring-2 focus:ring-[#58a6ff] focus:border-[#58a6ff] resize-none placeholder:text-[#6e7681]"
              style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
            />
            <div className="text-xs text-[#6e7681] mt-1 flex items-center gap-4">
              <span>Ctrl+Enter (Cmd+Enter) to execute</span>
              <span>↑↓ to navigate history</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

