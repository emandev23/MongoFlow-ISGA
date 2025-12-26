'use client';

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
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium mb-1 block">Group By (_id)</label>
        <Input
          value={stage.config._id || ''}
          onChange={(e) => onUpdate('_id', e.target.value || null)}
          placeholder="null or field name"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Aggregation Fields</label>
        <Input
          value={JSON.stringify(stage.config.fields || {}, null, 2)}
          onChange={(e) => {
            try {
              onUpdate('fields', JSON.parse(e.target.value));
            } catch {}
          }}
          placeholder='{"total": {"$sum": "$amount"}}'
          className="font-mono text-sm"
        />
      </div>
    </div>
  );
}

function SortStageEditor({ stage, onUpdate }: { stage: PipelineStage; onUpdate: (key: string, value: any) => void }) {
  const fields = stage.config.fields || [];
  const { schema } = usePipelineStore();

  const addField = () => {
    onUpdate('fields', [...fields, { name: '', direction: 'asc' }]);
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
      {fields.map((field: any, index: number) => (
        <div key={index} className="flex gap-2">
          <Select
            value={field.name}
            onChange={(e) => updateField(index, { name: e.target.value })}
            className="flex-1"
          >
            <option value="">Select field</option>
            {schema.map((s) => (
              <option key={s.path} value={s.path}>
                {s.path}
              </option>
            ))}
          </Select>
          <Select
            value={field.direction}
            onChange={(e) => updateField(index, { direction: e.target.value })}
            className="w-32"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </Select>
          <Button variant="ghost" size="icon" onClick={() => removeField(index)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
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
      <label className="text-sm font-medium mb-1 block">Limit</label>
      <Input
        type="number"
        value={stage.config.limit || 10}
        onChange={(e) => onUpdate('limit', parseInt(e.target.value) || 0)}
        min="0"
      />
    </div>
  );
}

function SkipStageEditor({ stage, onUpdate }: { stage: PipelineStage; onUpdate: (key: string, value: any) => void }) {
  return (
    <div>
      <label className="text-sm font-medium mb-1 block">Skip</label>
      <Input
        type="number"
        value={stage.config.skip || 0}
        onChange={(e) => onUpdate('skip', parseInt(e.target.value) || 0)}
        min="0"
      />
    </div>
  );
}

function ProjectStageEditor({ stage, onUpdate }: { stage: PipelineStage; onUpdate: (key: string, value: any) => void }) {
  return (
    <div>
      <label className="text-sm font-medium mb-1 block">Project Fields (JSON)</label>
      <Input
        value={JSON.stringify(stage.config.fields || {}, null, 2)}
        onChange={(e) => {
          try {
            onUpdate('fields', JSON.parse(e.target.value));
          } catch {}
        }}
        placeholder='{"name": 1, "email": 1, "_id": 0}'
        className="font-mono text-sm"
      />
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
        <Input
          value={stage.config.localField || ''}
          onChange={(e) => onUpdate('localField', e.target.value)}
          placeholder="localField"
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Foreign Field</label>
        <Input
          value={stage.config.foreignField || ''}
          onChange={(e) => onUpdate('foreignField', e.target.value)}
          placeholder="foreignField"
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


