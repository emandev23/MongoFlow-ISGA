'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, ChevronRight, ChevronDown, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { usePipelineStore } from '@/store/pipelineStore';
import { SchemaField } from '@/types/pipeline';

export function SchemaView() {
  const { schema, setSelectedField, setBreadcrumbs } = usePipelineStore();

  if (schema.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Database className="h-8 w-8 text-primary" />
              Schema
            </h1>
            <p className="text-muted-foreground mt-2">
              Schema is automatically analyzed from your documents
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No schema available. Select a collection with documents to analyze schema.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            Schema
          </h1>
          <p className="text-muted-foreground mt-2">
            Automatically analyzed schema from your documents
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schema Tree</CardTitle>
          <CardDescription>
            Click on any field to select it for queries and aggregations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {schema.map((field) => (
              <SchemaFieldItem key={field.path} field={field} level={0} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SchemaFieldItem({ field, level }: { field: SchemaField; level: number }) {
  const [expanded, setExpanded] = useState(false);
  const { setSelectedField, setBreadcrumbs } = usePipelineStore();
  const hasChildren = field.children && field.children.length > 0;

  const handleClick = () => {
    setSelectedField(field.path);
    setBreadcrumbs(field.path.split('.'));
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer ${
          level > 0 ? 'ml-4' : ''
        }`}
        onClick={handleClick}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 hover:bg-background rounded"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}
        <span className="font-mono text-sm">{field.name}</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {field.type}
        </Badge>
        {field.required && (
          <Badge variant="outline" className="text-xs">
            required
          </Badge>
        )}
      </div>
      {hasChildren && expanded && (
        <div className="ml-4">
          {field.children?.map((child) => (
            <SchemaFieldItem key={child.path} field={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

