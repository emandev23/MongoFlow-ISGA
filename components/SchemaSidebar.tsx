'use client';

import { SchemaField } from '@/types/pipeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { usePipelineStore } from '@/store/pipelineStore';

interface SchemaSidebarProps {
  schema: SchemaField[];
}

export function SchemaSidebar({ schema }: SchemaSidebarProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Schema Tree</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {schema.map((field) => (
            <SchemaFieldItem key={field.path} field={field} level={0} />
          ))}
        </div>
      </CardContent>
    </Card>
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
        <span className="text-sm font-medium flex-1">{field.name}</span>
        <Badge variant="outline" className="text-xs">
          {field.type}
        </Badge>
      </div>
      {hasChildren && expanded && (
        <div className="ml-2">
          {field.children!.map((child) => (
            <SchemaFieldItem key={child.path} field={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}


