'use client';

import { useWorkflowStore } from '@/store/workflowStore';
import { useDocumentStore } from '@/store/documentStore';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Code, Database, Zap, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type CollectionTabType = 'documents' | 'aggregations' | 'schema' | 'indexes' | 'validation';

interface CollectionTabsProps {
  activeTab: CollectionTabType;
  onTabChange: (tab: CollectionTabType) => void;
  documentCount?: number;
  indexCount?: number;
}

export function CollectionTabs({ 
  activeTab, 
  onTabChange,
  documentCount = 0,
  indexCount = 0 
}: CollectionTabsProps) {
  const { selectedDatabase, selectedCollection } = useWorkflowStore();
  const { databases } = useDocumentStore();

  // Get actual counts from database
  const selectedDb = databases.find(db => db.name === selectedDatabase);
  const selectedCol = selectedDb?.collections.find(col => col.name === selectedCollection);
  const actualDocumentCount = selectedCol?.documentCount ?? documentCount;

  // Format count for display
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  if (!selectedDatabase || !selectedCollection) {
    return null;
  }

  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as CollectionTabType)}>
      <TabsList className="bg-transparent h-auto p-0 gap-1">
            <TabsTrigger 
              value="documents" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-none data-[state=active]:shadow-none px-4 py-2"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Documents</span>
                {actualDocumentCount > 0 && (
                  <Badge variant="outline" className="ml-1 text-xs font-normal border-primary/20">
                    {formatCount(actualDocumentCount)}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="aggregations" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-none data-[state=active]:shadow-none px-4 py-2"
            >
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                <span>Aggregations</span>
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="schema" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-none data-[state=active]:shadow-none px-4 py-2"
            >
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>Schema</span>
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="indexes" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-none data-[state=active]:shadow-none px-4 py-2"
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Indexes</span>
                {indexCount > 0 && (
                  <Badge variant="outline" className="ml-1 text-xs font-normal border-primary/20">
                    {indexCount}
                  </Badge>
                )}
              </div>
            </TabsTrigger>
            
            <TabsTrigger 
              value="validation" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:rounded-none data-[state=active]:shadow-none px-4 py-2"
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Validation</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
  );
}

