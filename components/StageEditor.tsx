'use client';

import { useState } from 'react';
import { PipelineStage } from '@/types/pipeline';
import { usePipelineStore } from '@/store/pipelineStore';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { AdaptiveInput } from './AdaptiveInput';

export function StageEditor({ stage }: { stage: PipelineStage }) {
  const { updateStage, schema, selectedField, setSelectedField } = usePipelineStore();

  const handleConfigChange = (key: string, value: any) => {
    updateStage(stage.id, { [key]: value });
  };

  switch (stage.type) {
    case '$match':
      return <MatchStageEditor stage={stage} onUpdate={handleConfigChange} />;
    case '$group':
      return <GroupStageEditor stage={stage} onUpdate={handleConfigChange} />;
    case '$sort':
      return <SortStageEditor stage={stage} onUpdate={handleConfigChange} />;
    case '$limit':
      return <LimitStageEditor stage={stage} onUpdate={handleConfigChange} />;
    case '$skip':
      return <SkipStageEditor stage={stage} onUpdate={handleConfigChange} />;
    case '$project':
      return <ProjectStageEditor stage={stage} onUpdate={handleConfigChange} />;
    case '$unwind':
      return <UnwindStageEditor stage={stage} onUpdate={handleConfigChange} />;
    case '$lookup':
      return <LookupStageEditor stage={stage} onUpdate={handleConfigChange} />;
    case '$addFields':
      return <AddFieldsStageEditor stage={stage} onUpdate={handleConfigChange} />;
    case '$count':
      return <CountStageEditor stage={stage} onUpdate={handleConfigChange} />;
    default:
      return <div>Unknown stage type</div>;
  }
}

function MatchStageEditor({ stage, onUpdate }: { stage: PipelineStage; onUpdate: (key: string, value: any) => void }) {
  const { schema } = usePipelineStore();
  const conditions = stage.config.conditions || [];

  const addCondition = () => {
    const newConditions = [...conditions, { field: '', operator: '$eq', value: '', valueType: 'String' }];
    onUpdate('conditions', newConditions);
  };

  const updateCondition = (index: number, updates: any) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], ...updates };
    onUpdate('conditions', newConditions);
  };

  const removeCondition = (index: number) => {
    const newConditions = conditions.filter((_: any, i: number) => i !== index);
    onUpdate('conditions', newConditions);
  };

  return (
    <div className="space-y-3">
      {conditions.map((condition: any, index: number) => (
        <div key={index} className="flex gap-2 items-start">
          <Select
            value={condition.field}
            onChange={(e) => updateCondition(index, { field: e.target.value })}
            className="flex-1"
          >
            <option value="">Select field</option>
            {schema.map((field) => (
              <option key={field.path} value={field.path}>
                {field.path} ({field.type})
              </option>
            ))}
          </Select>
          <Select
            value={condition.operator}
            onChange={(e) => updateCondition(index, { operator: e.target.value })}
            className="w-32"
          >
            <option value="$eq">Equals</option>
            <option value="$gt">Greater than</option>
            <option value="$gte">Greater or equal</option>
            <option value="$lt">Less than</option>
            <option value="$lte">Less or equal</option>
            <option value="$ne">Not equal</option>
            <option value="$in">In</option>
            <option value="$nin">Not in</option>
            <option value="$regex">Regex</option>
          </Select>
          <AdaptiveInput
            value={condition.value}
            onChange={(value) => updateCondition(index, { value })}
            fieldPath={condition.field}
            schema={schema}
            className="flex-1"
          />
          <Button variant="ghost" size="icon" onClick={() => removeCondition(index)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addCondition}>
        <Plus className="h-4 w-4 mr-2" />
        Add Condition
      </Button>
    </div>
  );
}

function GroupStageEditor({ stage, onUpdate }: { stage: PipelineStage; onUpdate: (key: string, value: any) => void }) {
  const { schema } = usePipelineStore();
  const aggregationFields = stage.config.fields || {};
  const aggregationFieldKeys = Object.keys(aggregationFields);

  const handleIdChange = (value: string) => {
    if (value === 'null' || value === '') {
      onUpdate('_id', null);
    } else {
      onUpdate('_id', value);
    }
  };

  const addAggregationField = () => {
    const defaultName = `total${aggregationFieldKeys.length + 1}`;
    const newFields = { ...aggregationFields, [defaultName]: { $sum: 1 } };
    onUpdate('fields', newFields);
  };

  const updateAggregationField = (key: string, updates: any) => {
    const newFields = { ...aggregationFields };
    if (updates === null) {
      delete newFields[key];
    } else {
      // Replace completely, don't merge - each aggregation field can only have ONE operator
      // updates should be like { $sum: "$price" } or { $count: {} }
      newFields[key] = updates;
    }
    onUpdate('fields', newFields);
  };

  const updateAggregationFieldName = (oldKey: string, newKey: string) => {
    if (oldKey === newKey || !newKey.trim()) return;
    const newFields: any = {};
    Object.keys(aggregationFields).forEach(k => {
      if (k === oldKey) {
        newFields[newKey] = aggregationFields[k];
      } else {
        newFields[k] = aggregationFields[k];
      }
    });
    onUpdate('fields', newFields);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">
          Group by field
          <span className="text-xs text-muted-foreground ml-2">(e.g., category, status, date)</span>
        </label>
        <Select
          value={stage.config._id || 'null'}
          onChange={(e) => handleIdChange(e.target.value)}
          className="w-full"
        >
          <option value="null">All documents (no grouping)</option>
          {schema.map((field) => (
            <option key={field.path} value={field.path}>
              {field.path}
            </option>
          ))}
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          Select a field to group documents by this field
        </p>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">
            Calculations
            <span className="text-xs text-muted-foreground ml-2">(sum, count, average, etc.)</span>
          </label>
          <Button variant="outline" size="sm" onClick={addAggregationField}>
            <Plus className="h-4 w-4 mr-2" />
            Add Calculation
          </Button>
        </div>
        
        {aggregationFieldKeys.length === 0 ? (
          <div className="text-sm text-muted-foreground p-4 border-2 border-dashed rounded-lg text-center bg-muted/30">
            <p className="mb-1">No calculations yet</p>
            <p className="text-xs">Click "Add Calculation" to sum, count, or calculate averages</p>
          </div>
        ) : (
          <div className="space-y-3">
            {aggregationFieldKeys.map((fieldKey) => (
              <AggregationFieldEditor
                key={fieldKey}
                fieldKey={fieldKey}
                fieldValue={aggregationFields[fieldKey]}
                schema={schema}
                onUpdate={(updates) => updateAggregationField(fieldKey, updates)}
                onRename={(newKey) => updateAggregationFieldName(fieldKey, newKey)}
                onDelete={() => updateAggregationField(fieldKey, null)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AggregationFieldEditor({ 
  fieldKey, 
  fieldValue, 
  schema, 
  onUpdate, 
  onRename, 
  onDelete 
}: { 
  fieldKey: string;
  fieldValue: any;
  schema: any[];
  onUpdate: (updates: any) => void;
  onRename: (newKey: string) => void;
  onDelete: () => void;
}) {
  const currentOperator = Object.keys(fieldValue || {})[0] || '$sum';
  const currentValue = fieldValue?.[currentOperator];
  // Extract field path: if it's "$price", extract "price", if it's a number, leave empty
  const isFieldPath = typeof currentValue === 'string' && currentValue.startsWith('$');
  const extractedPath = isFieldPath ? currentValue.substring(1) : '';
  
  const [fieldName, setFieldName] = useState(fieldKey);
  const [operator, setOperator] = useState(currentOperator);
  const [fieldPath, setFieldPath] = useState(extractedPath);

  const operators = [
    { value: '$sum', label: '$sum - Sum values' },
    { value: '$avg', label: '$avg - Average values' },
    { value: '$min', label: '$min - Minimum value' },
    { value: '$max', label: '$max - Maximum value' },
    { value: '$first', label: '$first - First value' },
    { value: '$last', label: '$last - Last value' },
    { value: '$push', label: '$push - Array of values' },
    { value: '$addToSet', label: '$addToSet - Unique array' },
    { value: '$count', label: '$count - Count documents' },
  ];

  const handleOperatorChange = (newOperator: string) => {
    setOperator(newOperator);
    // Replace the entire field value, don't merge - each field can only have ONE operator
    if (newOperator === '$count') {
      onUpdate({ [newOperator]: {} });
    } else {
      // Create a new object with only the new operator
      onUpdate({ [newOperator]: fieldPath ? `$${fieldPath}` : 1 });
    }
  };

  const handleFieldPathChange = (newPath: string) => {
    setFieldPath(newPath);
    if (operator !== '$count') {
      onUpdate({ [operator]: newPath ? `$${newPath}` : 1 });
    }
  };

  const handleNameChange = (newName: string) => {
    setFieldName(newName);
    if (newName !== fieldKey) {
      onRename(newName);
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-3 bg-card">
      <div className="flex gap-2 items-start">
        <div className="flex-1 space-y-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Result field name</label>
            <Input
              value={fieldName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., totalPrice, count, average"
              className="font-medium"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Operation</label>
              <Select
                value={operator}
                onChange={(e) => handleOperatorChange(e.target.value)}
                className="w-full"
              >
                {operators.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label.split(' - ')[0]}
                  </option>
                ))}
              </Select>
            </div>
            
            {operator !== '$count' && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Field to calculate</label>
                <Select
                  value={fieldPath}
                  onChange={(e) => handleFieldPathChange(e.target.value)}
                  className="w-full"
                >
                  <option value="">Use number: 1</option>
                  {schema.map((field) => (
                    <option key={field.path} value={field.path}>
                      {field.path}
                    </option>
                  ))}
                </Select>
              </div>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onDelete} className="mt-6">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SortStageEditor({ stage, onUpdate }: { stage: PipelineStage; onUpdate: (key: string, value: any) => void }) {
  const fields = stage.config.fields || [];
  const { schema } = usePipelineStore();

  const addField = () => {
    onUpdate('fields', [...fields, { name: '', direction: 'desc' }]);
  };

  const updateField = (index: number, updates: any) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onUpdate('fields', newFields);
  };

  const removeField = (index: number) => {
    onUpdate('fields', fields.filter((_: any, i: number) => i !== index));
  };

  return (
    <div className="space-y-3">
      {fields.length === 0 ? (
        <div className="text-sm text-muted-foreground p-4 border-2 border-dashed rounded-lg text-center bg-muted/30">
          <p className="mb-1">No sort fields yet</p>
          <p className="text-xs">Click "Add Sort Field" to sort your results</p>
        </div>
      ) : (
        fields.map((field: any, index: number) => (
          <div key={index} className="flex gap-2 items-center p-3 border rounded-lg bg-card">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Field</label>
                <Select
                  value={field.name}
                  onChange={(e) => updateField(index, { name: e.target.value })}
                  className="w-full"
                >
                  <option value="">Select field</option>
                  {schema.map((s) => (
                    <option key={s.path} value={s.path}>
                      {s.path}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Order</label>
                <Select
                  value={field.direction}
                  onChange={(e) => updateField(index, { direction: e.target.value })}
                  className="w-full"
                >
                  <option value="desc">Descending (High to Low)</option>
                  <option value="asc">Ascending (Low to High)</option>
                </Select>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeField(index)} className="mt-5">
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))
      )}
      <Button variant="outline" size="sm" onClick={addField}>
        <Plus className="h-4 w-4 mr-2" />
        Add Sort Field
      </Button>
    </div>
  );
}

function LimitStageEditor({ stage, onUpdate }: { stage: PipelineStage; onUpdate: (key: string, value: any) => void }) {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block">
        Maximum number of results
        <span className="text-xs text-muted-foreground ml-2">(e.g., 10, 50, 100)</span>
      </label>
      <Input
        type="number"
        value={stage.config.limit || 10}
        onChange={(e) => onUpdate('limit', parseInt(e.target.value) || 0)}
        min="1"
        placeholder="10"
      />
      <p className="text-xs text-muted-foreground mt-1">
        Limit the number of documents returned
      </p>
    </div>
  );
}

function SkipStageEditor({ stage, onUpdate }: { stage: PipelineStage; onUpdate: (key: string, value: any) => void }) {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block">
        Skip documents
        <span className="text-xs text-muted-foreground ml-2">(for pagination)</span>
      </label>
      <Input
        type="number"
        value={stage.config.skip || 0}
        onChange={(e) => onUpdate('skip', parseInt(e.target.value) || 0)}
        min="0"
        placeholder="0"
      />
      <p className="text-xs text-muted-foreground mt-1">
        Skip the first N documents (useful for pagination)
      </p>
    </div>
  );
}

function ProjectStageEditor({ stage, onUpdate }: { stage: PipelineStage; onUpdate: (key: string, value: any) => void }) {
  const { schema } = usePipelineStore();
  const projectFields = stage.config.fields || {};
  const fieldKeys = Object.keys(projectFields);

  const addField = () => {
    if (schema.length > 0) {
      const firstField = schema[0].path;
      const newFields = { ...projectFields, [firstField]: 1 };
      onUpdate('fields', newFields);
    }
  };

  const updateField = (fieldPath: string, value: number | string | null) => {
    const newFields = { ...projectFields };
    if (value === null) {
      delete newFields[fieldPath];
    } else {
      newFields[fieldPath] = value;
    }
    onUpdate('fields', newFields);
  };

  const addRenameField = () => {
    // Add a field to rename _id to something else (common use case)
    const newFields = { ...projectFields, category: '$_id', _id: 0 };
    onUpdate('fields', newFields);
  };

  const addCustomField = () => {
    const newFields = { ...projectFields, '': 1 };
    onUpdate('fields', newFields);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Select and rename fields
          <span className="text-xs text-muted-foreground ml-2">(to format results)</span>
        </label>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addRenameField} title="Rename _id to category (useful after $group)">
            <Plus className="h-4 w-4 mr-2" />
            Rename _id
          </Button>
          <Button variant="outline" size="sm" onClick={addField}>
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </div>
      </div>
      
      {fieldKeys.length === 0 ? (
        <div className="text-sm text-muted-foreground p-4 border-2 border-dashed rounded-lg text-center bg-muted/30">
          <p className="mb-1">No fields selected</p>
          <p className="text-xs">Use "Rename _id" to rename _id to category after grouping</p>
          <p className="text-xs">Or "Add Field" to include/exclude specific fields</p>
        </div>
      ) : (
        <div className="space-y-2">
          {fieldKeys.map((fieldPath) => {
            const fieldValue = projectFields[fieldPath];
            const isRename = typeof fieldValue === 'string' && fieldValue.startsWith('$');
            
            return (
              <div key={fieldPath} className="flex gap-2 items-center p-3 border rounded-lg bg-card">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Output field name</label>
                    {fieldPath === '' ? (
                      <Input
                        value={fieldPath}
                        onChange={(e) => {
                          const oldValue = projectFields[fieldPath];
                          const newFields = { ...projectFields };
                          delete newFields[fieldPath];
                          newFields[e.target.value] = oldValue;
                          onUpdate('fields', newFields);
                        }}
                        placeholder="e.g., category"
                        className="w-full"
                      />
                    ) : (
                      <Select
                        value={fieldPath}
                        onChange={(e) => {
                          const oldValue = projectFields[fieldPath];
                          const newFields = { ...projectFields };
                          delete newFields[fieldPath];
                          newFields[e.target.value] = oldValue;
                          onUpdate('fields', newFields);
                        }}
                        className="w-full"
                      >
                        <option value="">Custom name</option>
                        <option value="category">category</option>
                        <option value="name">name</option>
                        {schema.map((field) => (
                          <option key={field.path} value={field.path}>
                            {field.path}
                          </option>
                        ))}
                      </Select>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {isRename ? 'Source field' : 'Action'}
                    </label>
                    {isRename ? (
                      <Input
                        value={fieldValue}
                        onChange={(e) => updateField(fieldPath, e.target.value)}
                        placeholder="$_id"
                        className="w-full font-mono text-xs"
                      />
                    ) : (
                      <Select
                        value={fieldValue?.toString() || '1'}
                        onChange={(e) => updateField(fieldPath, parseInt(e.target.value))}
                        className="w-full"
                      >
                        <option value="1">Include</option>
                        <option value="0">Exclude</option>
                      </Select>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => updateField(fieldPath, null)} className="mt-5">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UnwindStageEditor({ stage, onUpdate }: { stage: PipelineStage; onUpdate: (key: string, value: any) => void }) {
  const { schema } = usePipelineStore();
  return (
    <div>
      <label className="text-sm font-medium mb-1 block">Array Field Path</label>
      <Select
        value={stage.config.path || ''}
        onChange={(e) => onUpdate('path', e.target.value)}
      >
        <option value="">Select array field</option>
        {schema.filter(s => s.type === 'Array').map((s) => (
          <option key={s.path} value={s.path}>
            {s.path}
          </option>
        ))}
      </Select>
    </div>
  );
}

function LookupStageEditor({ stage, onUpdate }: { stage: PipelineStage; onUpdate: (key: string, value: any) => void }) {
  const { schema } = usePipelineStore();
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium mb-1 block">From Collection</label>
        <Input
          value={stage.config.from || ''}
          onChange={(e) => onUpdate('from', e.target.value)}
          placeholder="collectionName"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Local Field</label>
        <Select
          value={stage.config.localField || ''}
          onChange={(e) => onUpdate('localField', e.target.value)}
        >
          <option value="">Select field</option>
          {schema.map((field) => (
            <option key={field.path} value={field.path}>
              {field.path} ({field.type})
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Foreign Field</label>
        <Input
          value={stage.config.foreignField || ''}
          onChange={(e) => onUpdate('foreignField', e.target.value)}
          placeholder="foreignField (from other collection)"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">As (Output Field)</label>
        <Input
          value={stage.config.as || ''}
          onChange={(e) => onUpdate('as', e.target.value)}
          placeholder="as"
        />
      </div>
    </div>
  );
}

function AddFieldsStageEditor({ stage, onUpdate }: { stage: PipelineStage; onUpdate: (key: string, value: any) => void }) {
  return (
    <div>
      <label className="text-sm font-medium mb-1 block">Add Fields (JSON)</label>
      <Input
        value={JSON.stringify(stage.config.fields || {}, null, 2)}
        onChange={(e) => {
          try {
            onUpdate('fields', JSON.parse(e.target.value));
          } catch {}
        }}
        placeholder='{"fullName": {"$concat": ["$firstName", " ", "$lastName"]}}'
        className="font-mono text-sm"
      />
    </div>
  );
}

function CountStageEditor({ stage, onUpdate }: { stage: PipelineStage; onUpdate: (key: string, value: any) => void }) {
  return (
    <div>
      <label className="text-sm font-medium mb-1 block">Count Field Name</label>
      <Input
        value={stage.config.field || 'count'}
        onChange={(e) => onUpdate('field', e.target.value)}
        placeholder="count"
      />
    </div>
  );
}


