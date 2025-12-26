'use client';

import { useWorkflowStore } from '@/store/workflowStore';
import { ChevronRight, Database, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BreadcrumbNav() {
  const { selectedDatabase, selectedCollection, connectionString } = useWorkflowStore();

  if (!connectionString) {
    return null;
  }

  const breadcrumbs = [
    {
      label: 'Connection',
      icon: Database,
      active: !selectedDatabase,
    },
    ...(selectedDatabase
      ? [
          {
            label: selectedDatabase,
            icon: Database,
            active: !selectedCollection,
          },
        ]
      : []),
    ...(selectedCollection
      ? [
          {
            label: selectedCollection,
            icon: Folder,
            active: true,
          },
        ]
      : []),
  ];

  return (
    <div className="flex items-center gap-1 text-sm">
      {breadcrumbs.map((crumb, index) => {
        const Icon = crumb.icon;
        const isLast = index === breadcrumbs.length - 1;
        
        return (
          <div key={index} className="flex items-center gap-1">
            <div
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded',
                crumb.active
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground cursor-pointer'
              )}
      >
              <Icon className="h-3.5 w-3.5" />
              <span>{crumb.label}</span>
            </div>
            {!isLast && (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        );
      })}
        </div>
  );
}
