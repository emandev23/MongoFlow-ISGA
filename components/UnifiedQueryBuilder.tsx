'use client';

import { useState, useRef, useEffect } from 'react';
import { useQueryStore } from '@/store/queryStore';
import { usePipelineStore } from '@/store/pipelineStore';
import { useWorkflowStore } from '@/store/workflowStore';
import { useDocumentStore } from '@/store/documentStore';
import { QueryGroup, QueryCondition } from '@/types/query';
import { analyzeSchemaFromDocuments } from '@/lib/schemaAnalyzer';
import { mockDocuments } from '@/lib/mockDocuments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, X, Play, Code, Database } from 'lucide-react';
import { AdaptiveInput } from './AdaptiveInput';
import { StageEditor } from './StageEditor';
import { generateQueryJSON } from '@/lib/queryGenerator';
import { generateShellCode } from '@/lib/codeGenerator';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const OPERATORS = [
  { value: '$eq', label: 'Equals (=)' },
  { value: '$ne', label: 'Not Equals (≠)' },
  { value: '$gt', label: 'Greater Than (>)' },
  { value: '$gte', label: 'Greater or Equal (≥)' },
  { value: '$lt', label: 'Less Than (<)' },
  { value: '$lte', label: 'Less or Equal (≤)' },
  { value: '$in', label: 'In' },
  { value: '$nin', label: 'Not In' },
  { value: '$exists', label: 'Exists' },
  { value: '$regex', label: 'Regex' },
];

const STAGE_TYPES = [
  { value: '$match', label: '$match' },
  { value: '$group', label: '$group' },
  { value: '$sort', label: '$sort' },
  { value: '$limit', label: '$limit' },
  { value: '$skip', label: '$skip' },
  { value: '$project', label: '$project' },
  { value: '$unwind', label: '$unwind' },
  { value: '$lookup', label: '$lookup' },
  { value: '$addFields', label: '$addFields' },
  { value: '$count', label: '$count' },
] as const;

type StageType = typeof STAGE_TYPES[number]['value'];

export function UnifiedQueryBuilder() {
  const { currentQuery, createQuery, updateQuery, setQueryResults, setLoadingResults, queryResults, isLoadingResults } = useQueryStore();
  const { stages, addStage, removeStage, schema, setExecutionStats, setSchema } = usePipelineStore();
  const { selectedCollection, selectedDatabase, connectionString } = useWorkflowStore();
  const { documents, setDocuments, setLoading } = useDocumentStore();
  const [activeTab, setActiveTab] = useState<'query' | 'pipeline' | 'results' | 'code'>('query');
  const [useQueryAsMatch, setUseQueryAsMatch] = useState(false);
  const [showStageMenu, setShowStageMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const collectionName = selectedCollection || 'collection';

  // Load documents when collection changes to populate schema
  useEffect(() => {
    if (selectedDatabase && selectedCollection) {
      setLoading(true);
      
      if (connectionString) {
        fetch('/api/mongodb/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connectionString,
            databaseName: selectedDatabase,
            collectionName: selectedCollection,
            limit: 100,
          }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.documents && data.documents.length > 0) {
              setDocuments(data.documents);
              const analyzedSchema = analyzeSchemaFromDocuments(data.documents);
              setSchema(analyzedSchema);
            } else {
              const mockDocs = mockDocuments(selectedCollection);
              setDocuments(mockDocs);
              if (mockDocs.length > 0) {
                const analyzedSchema = analyzeSchemaFromDocuments(mockDocs);
                setSchema(analyzedSchema);
              }
            }
            setLoading(false);
          })
          .catch(error => {
            console.error('Failed to fetch documents:', error);
            const mockDocs = mockDocuments(selectedCollection);
            setDocuments(mockDocs);
            if (mockDocs.length > 0) {
              const analyzedSchema = analyzeSchemaFromDocuments(mockDocs);
              setSchema(analyzedSchema);
            }
            setLoading(false);
          });
      } else {
        setTimeout(() => {
          const mockDocs = mockDocuments(selectedCollection);
          setDocuments(mockDocs);
          if (mockDocs.length > 0) {
            const analyzedSchema = analyzeSchemaFromDocuments(mockDocs);
            setSchema(analyzedSchema);
          }
          setLoading(false);
        }, 300);
      }
    }
  }, [selectedDatabase, selectedCollection, connectionString, setDocuments, setSchema, setLoading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowStageMenu(false);
      }
    };

    if (showStageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showStageMenu]);

  useEffect(() => {
    if (documents.length > 0) {
      const analyzedSchema = analyzeSchemaFromDocuments(documents);
      setSchema(analyzedSchema);
    } else {
      setSchema([]);
    }
  }, [documents, setSchema]);

  if (!currentQuery) {
    createQuery('My Query');
    return null;
  }

  const handleExecuteQuery = async () => {
    if (!currentQuery || !connectionString || !selectedDatabase || !selectedCollection) {
      console.error('Cannot execute query: missing required data', {
        hasQuery: !!currentQuery,
        hasConnection: !!connectionString,
        hasDatabase: !!selectedDatabase,
        hasCollection: !!selectedCollection,
      });
      return;
    }

    setLoadingResults(true);
    setActiveTab('results');

    try {
      const queryJSON = generateQueryJSON(currentQuery);
      console.log('Executing query:', queryJSON);
      
      const response = await fetch('/api/mongodb/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionString,
          databaseName: selectedDatabase,
          collectionName: selectedCollection,
          query: queryJSON,
          projection: currentQuery.projection,
          limit: currentQuery.limit || 100,
          skip: currentQuery.skip || 0,
        }),
      });

      const data = await response.json();
      if (response.ok && data.documents) {
        setQueryResults(data.documents);
        console.log('Query executed successfully:', data.documents.length, 'documents');
      } else {
        setQueryResults([]);
        console.error('Query execution failed:', data.error || data);
        alert(`Query failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Query execution error:', error);
      setQueryResults([]);
      alert(`Error executing query: ${error.message || 'Unknown error'}`);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleExecuteAggregation = async () => {
    if (stages.length === 0) {
      return;
    }

    setLoadingResults(true);
    setActiveTab('results');

    let pipelineStages = [...stages];
    if (useQueryAsMatch && currentQuery && currentQuery.query.conditions.length > 0) {
      const matchQuery = generateQueryJSON(currentQuery);
      pipelineStages = [{ 
        id: 'match-from-query',
        type: '$match',
        config: { conditions: Object.entries(matchQuery).map(([field, value]) => ({
          field,
          operator: '$eq',
          value: JSON.stringify(value),
          valueType: typeof value === 'number' ? 'Number' : 'String'
        })) }
      }, ...pipelineStages];
    }

    if (connectionString && selectedDatabase && selectedCollection) {
      try {
        const pipeline = pipelineStages.map(stage => {
          // Ensure stage has a type
          if (!stage.type) {
            console.error('Stage missing type:', stage);
            return null;
          }
          
          if (stage.type === '$match') {
            const matchObj: Record<string, any> = {};
            (stage.config.conditions || []).forEach((cond: any) => {
              if (!cond.field || !cond.operator) {
                return; // Skip invalid conditions
              }
              
              // Parse value based on type
              let parsedValue: any = cond.value;
              if (cond.valueType === 'Number' && typeof cond.value === 'string') {
                parsedValue = parseFloat(cond.value);
                if (isNaN(parsedValue)) {
                  parsedValue = cond.value; // Keep as string if not a valid number
                }
              } else if (cond.valueType === 'Boolean' && typeof cond.value === 'string') {
                parsedValue = cond.value === 'true' || cond.value === '1';
              } else if (typeof cond.value === 'string' && (cond.value.startsWith('{') || cond.value.startsWith('['))) {
                try {
                  parsedValue = JSON.parse(cond.value);
                } catch (e) {
                  // Keep as string if JSON parsing fails
                  parsedValue = cond.value;
                }
              }
              
              if (!matchObj[cond.field]) {
                matchObj[cond.field] = {};
              }
              matchObj[cond.field][cond.operator] = parsedValue;
            });
            return { $match: matchObj };
          }
          
          // For other stages, convert to MongoDB format
          return { [stage.type]: stage.config };
        }).filter((stage): stage is any => stage !== null); // Remove null stages

        const response = await fetch('/api/mongodb/aggregate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            connectionString,
            databaseName: selectedDatabase,
            collectionName: selectedCollection,
            pipeline,
          }),
        });

        const data = await response.json();
        if (response.ok && data.documents) {
          setQueryResults(data.documents);
          setExecutionStats({
            executionTime: data.executionTime || 0,
            documentsScanned: data.documentsExamined || data.documentsScanned || data.documents?.length || 0,
            documentsReturned: data.documentsReturned || data.documents?.length || 0,
            indexUsed: Array.isArray(data.indexesUsed) ? data.indexesUsed.length > 0 : (data.indexUsed ?? false),
          });
        } else {
          setQueryResults([]);
          console.error('Aggregation execution failed:', data.error);
        }
      } catch (error) {
        console.error('Aggregation execution error:', error);
        setQueryResults([]);
      }
    } else {
      setQueryResults([]);
      setLoadingResults(false);
      return;
    }

    setLoadingResults(false);
  };

  const handleAddStage = (stageType: StageType) => {
    addStage(stageType);
    setShowStageMenu(false);
  };

  const generateCombinedCode = () => {
    const hasQuery = currentQuery && currentQuery.query.conditions.length > 0;
    const hasPipeline = stages.length > 0;
    
    let pipelineStages = [...stages];
    if (useQueryAsMatch && hasQuery) {
      const matchQuery = generateQueryJSON(currentQuery);
      pipelineStages = [{ 
        id: 'match-from-query',
        type: '$match',
        config: { conditions: Object.entries(matchQuery).map(([field, value]) => ({
          field,
          operator: '$eq',
          value: JSON.stringify(value),
          valueType: typeof value === 'number' ? 'Number' : 'String'
        })) }
      }, ...pipelineStages];
    }

    if (pipelineStages.length > 0) {
      return generateShellCode(pipelineStages, collectionName);
    }
    
    if (hasQuery) {
      const queryObj = generateQueryJSON(currentQuery);
      const queryStr = JSON.stringify(queryObj, null, 2);
      return `db.${collectionName}.find(${queryStr})`;
    }
    
    return `// No query or pipeline defined`;
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Input
            value={currentQuery.name}
            onChange={(e) => updateQuery({ ...currentQuery, name: e.target.value })}
            className="max-w-xs"
            placeholder="Query name"
          />
          <Button 
            onClick={handleExecuteQuery} 
            size="sm"
            variant="outline"
            disabled={!currentQuery || !connectionString || !selectedDatabase || !selectedCollection}
          >
            <Play className="h-4 w-4 mr-2" />
            Execute Query
          </Button>
          <Button 
            onClick={handleExecuteAggregation} 
            size="sm"
            disabled={stages.length === 0 && (!useQueryAsMatch || !currentQuery || currentQuery.query.conditions.length === 0)}
          >
            <Play className="h-4 w-4 mr-2" />
            Execute Aggregation
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="query">
            <Database className="h-4 w-4 mr-2" />
            Query Builder
          </TabsTrigger>
          <TabsTrigger value="pipeline">
            <Code className="h-4 w-4 mr-2" />
            Aggregation Pipeline
          </TabsTrigger>
          <TabsTrigger value="results">
            Results
            {queryResults.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {queryResults.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="code">
            <Code className="h-4 w-4 mr-2" />
            Generated Code
          </TabsTrigger>
        </TabsList>

        <TabsContent value="query" className="flex-1 overflow-y-auto mt-4 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Query Builder</CardTitle>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="useAsMatch"
                    checked={useQueryAsMatch}
                    onChange={(e) => setUseQueryAsMatch(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="useAsMatch" className="text-sm text-muted-foreground">
                    Use as $match stage
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {schema.length === 0 && documents.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p className="mb-2">Loading schema from collection...</p>
                  <p className="text-sm">If no fields appear, try viewing documents first to analyze the schema.</p>
                </div>
              ) : (
                <QueryGroupEditor
                  group={currentQuery.query}
                  schema={schema}
                  onUpdate={(updatedGroup) => {
                    updateQuery({ ...currentQuery, query: updatedGroup });
                  }}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Fields (Projection)</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose which fields to include or exclude in query results
              </p>
            </CardHeader>
            <CardContent>
              <FieldSelector
                schema={schema}
                projection={currentQuery.projection || {}}
                onUpdate={(projection) => {
                  updateQuery({ ...currentQuery, projection });
                }}
              />
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="pipeline" className="flex-1 overflow-y-auto mt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Aggregation Pipeline</h2>
              <div className="relative" ref={menuRef}>
                <Button onClick={() => setShowStageMenu(!showStageMenu)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stage
                </Button>
                {showStageMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-card border rounded-md shadow-lg z-10">
                    {STAGE_TYPES.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => handleAddStage(value)}
                        className="w-full text-left px-4 py-2 hover:bg-accent first:rounded-t-md last:rounded-b-md text-sm"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {useQueryAsMatch && currentQuery && currentQuery.query.conditions.length > 0 && (
              <Card className="border-primary/50 bg-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">0</Badge>
                      <CardTitle className="text-lg">$match (from Query)</CardTitle>
                    </div>
                    <Badge variant="outline">Auto-generated</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This $match stage will be automatically generated from your query builder conditions.
                  </p>
                </CardContent>
              </Card>
            )}

            {stages.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <p>No stages added yet. Click &quot;Add Stage&quot; to start building your pipeline.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {stages.map((stage, index) => (
                  <Card key={stage.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{index + (useQueryAsMatch && currentQuery && currentQuery.query.conditions.length > 0 ? 1 : 0)}</Badge>
                          <CardTitle className="text-lg">{stage.type}</CardTitle>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeStage(stage.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <StageEditor stage={stage} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="results" className="flex-1 overflow-y-auto mt-4">
          {isLoadingResults ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>Executing...</p>
              </CardContent>
            </Card>
          ) : queryResults.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p>No results yet. Execute a query or aggregation to see results.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Results ({queryResults.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {queryResults.map((result, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-card">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="code" className="flex-1 overflow-y-auto mt-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Generated MongoDB Shell Code</CardTitle>
            </CardHeader>
            <CardContent>
              <SyntaxHighlighter
                language="javascript"
                style={vscDarkPlus}
                customStyle={{ borderRadius: '0.5rem', fontSize: '0.875rem' }}
              >
                {generateCombinedCode()}
              </SyntaxHighlighter>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QueryGroupEditor({
  group,
  schema,
  onUpdate,
  level = 0,
}: {
  group: QueryGroup;
  schema: any[];
  onUpdate: (group: QueryGroup) => void;
  level?: number;
}) {
  const addCondition = () => {
    const newCondition: QueryCondition = {
      id: `cond-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      field: '',
      operator: '$eq',
      value: '',
      logicalOperator: 'AND',
    };
    onUpdate({
      ...group,
      conditions: [...group.conditions, newCondition],
    });
  };

  const updateCondition = (id: string, updates: Partial<QueryCondition>) => {
    onUpdate({
      ...group,
      conditions: group.conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  };

  const removeCondition = (id: string) => {
    onUpdate({
      ...group,
      conditions: group.conditions.filter((c) => c.id !== id),
    });
  };

  const addGroup = () => {
    const newGroup: QueryGroup = {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      conditions: [],
      logicalOperator: 'AND',
      groups: [],
    };
    onUpdate({
      ...group,
      groups: [...(group.groups || []), newGroup],
    });
  };

  const updateSubGroup = (groupId: string, updatedSubGroup: QueryGroup) => {
    if (group.groups) {
      onUpdate({
        ...group,
        groups: group.groups.map((g) => (g.id === groupId ? updatedSubGroup : g)),
      });
    }
  };

  const removeGroup = (groupId: string) => {
    if (group.groups) {
      onUpdate({
        ...group,
        groups: group.groups.filter((g) => g.id !== groupId),
      });
    }
  };

  return (
    <div className={`space-y-3 ${level > 0 ? 'ml-4 pl-4 border-l-2 border-muted' : ''}`}>
      {level > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <Select
            value={group.logicalOperator}
            onChange={(e) => onUpdate({ ...group, logicalOperator: e.target.value as 'AND' | 'OR' })}
            className="w-24"
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </Select>
          <Badge variant="outline">Group</Badge>
        </div>
      )}

      {group.conditions.map((condition, index) => (
        <div key={condition.id} className="flex items-start gap-2 p-3 border rounded-lg bg-card">
          {index > 0 && (
            <div className="flex items-center h-10">
              <Badge variant="secondary" className="mr-2">
                {group.logicalOperator}
              </Badge>
            </div>
          )}
          <div className="flex-1 grid grid-cols-4 gap-2">
            <Select
              value={condition.field}
              onChange={(e) => updateCondition(condition.id, { field: e.target.value })}
            >
              <option value="">Select field</option>
              {schema.length > 0 ? (
                schema.map((field) => (
                  <option key={field.path} value={field.path}>
                    {field.path} ({field.type})
                  </option>
                ))
              ) : (
                <option value="" disabled>No schema available. Load documents first to see fields.</option>
              )}
            </Select>
            <Select
              value={condition.operator}
              onChange={(e) => updateCondition(condition.id, { operator: e.target.value as any })}
            >
              {OPERATORS.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </Select>
            <AdaptiveInput
              value={condition.value}
              onChange={(value) => updateCondition(condition.id, { value })}
              fieldPath={condition.field}
              schema={schema}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeCondition(condition.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {group.groups?.map((subGroup) => (
        <div key={subGroup.id} className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeGroup(subGroup.id)}
              className="h-6 w-6"
            >
              <X className="h-3 w-3" />
            </Button>
            <Badge variant="outline">Nested Group</Badge>
          </div>
          <QueryGroupEditor
            group={subGroup}
            schema={schema}
            onUpdate={(updated) => updateSubGroup(subGroup.id, updated)}
            level={level + 1}
          />
        </div>
      ))}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={addCondition}>
          <Plus className="h-4 w-4 mr-2" />
          Add Condition
        </Button>
        <Button variant="outline" size="sm" onClick={addGroup}>
          <Plus className="h-4 w-4 mr-2" />
          Add Group
        </Button>
      </div>
    </div>
  );
}

function FieldSelector({
  schema,
  projection,
  onUpdate,
}: {
  schema: any[];
  projection: Record<string, number>;
  onUpdate: (projection: Record<string, number>) => void;
}) {
  const [mode, setMode] = useState<'include' | 'exclude'>('include');
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(Object.keys(projection).filter(k => projection[k] === 1))
  );

  const toggleField = (fieldPath: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldPath)) {
      newSelected.delete(fieldPath);
    } else {
      newSelected.add(fieldPath);
    }
    setSelectedFields(newSelected);

    const newProjection: Record<string, number> = {};
    if (mode === 'include') {
      newSelected.forEach(field => {
        newProjection[field] = 1;
      });
      if (!newSelected.has('_id')) {
        newProjection._id = 0;
      }
    } else {
      newSelected.forEach(field => {
        newProjection[field] = 0;
      });
    }
    onUpdate(newProjection);
  };

  const clearProjection = () => {
    setSelectedFields(new Set());
    onUpdate({});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant={mode === 'include' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setMode('include');
              setSelectedFields(new Set());
              onUpdate({});
            }}
          >
            Include Fields
          </Button>
          <Button
            variant={mode === 'exclude' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setMode('exclude');
              setSelectedFields(new Set());
              onUpdate({});
            }}
          >
            Exclude Fields
          </Button>
        </div>
        {Object.keys(projection).length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearProjection}>
            Clear
          </Button>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        {mode === 'include' 
          ? 'Select fields to include in results (all others will be excluded)'
          : 'Select fields to exclude from results (all others will be included)'}
      </div>

      <div className="max-h-64 overflow-y-auto border rounded-lg p-3 space-y-2">
        {schema.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No schema available. Load documents first to see fields.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer" onClick={() => toggleField('_id')}>
              <input
                type="checkbox"
                checked={selectedFields.has('_id')}
                onChange={() => toggleField('_id')}
                className="rounded"
              />
              <span className="text-sm font-mono">_id</span>
            </div>
            {schema.map((field) => (
              <div
                key={field.path}
                className="flex items-center gap-2 p-2 hover:bg-accent rounded cursor-pointer"
                onClick={() => toggleField(field.path)}
              >
                <input
                  type="checkbox"
                  checked={selectedFields.has(field.path)}
                  onChange={() => toggleField(field.path)}
                  className="rounded"
                />
                <span className="text-sm font-mono">{field.path}</span>
                <Badge variant="outline" className="text-xs">
                  {field.type}
                </Badge>
              </div>
            ))}
          </>
        )}
      </div>

      {Object.keys(projection).length > 0 && (
        <div className="p-3 bg-muted rounded-lg">
          <div className="text-xs font-semibold mb-2">Current Projection:</div>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(projection, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
