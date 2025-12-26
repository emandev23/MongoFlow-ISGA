'use client';

import { Input } from '@/components/ui/input';
import { getFieldType } from '@/lib/schemaMock';
import { SchemaField, FieldType } from '@/types/pipeline';
import { format } from 'date-fns';

interface AdaptiveInputProps {
  value: string;
  onChange: (value: string) => void;
  fieldPath: string;
  schema: SchemaField[];
  className?: string;
}

export function AdaptiveInput({ value, onChange, fieldPath, schema, className }: AdaptiveInputProps) {
  const fieldType = fieldPath ? getFieldType(fieldPath, schema) : null;

  if (fieldType === 'Date') {
    return (
      <Input
        type="datetime-local"
        value={value ? format(new Date(value), "yyyy-MM-dd'T'HH:mm") : ''}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      />
    );
  }

  if (fieldType === 'Number') {
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      />
    );
  }

  if (fieldType === 'Boolean') {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <option value="">Select...</option>
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    );
  }

  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={fieldType ? `Enter ${fieldType.toLowerCase()}` : 'Enter value'}
      className={className}
    />
  );
}


