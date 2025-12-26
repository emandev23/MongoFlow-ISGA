'use client';

import { useState, useEffect } from 'react';
import { useWorkflowStore } from '@/store/workflowStore';
import { useDocumentStore } from '@/store/documentStore';
import { 
  Database, 
  FileText, 
  Code, 
  Search, 
  Settings,
  ChevronRight,
  ChevronDown,
  LayoutDashboard,
  Plus,
  RefreshCw,
  Folder,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export type ViewType = 
  | 'documents' 
  | 'aggregation' 
  | 'query' 
  | 'settings';

interface MainSidebarProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const NAVIGATION_SECTIONS = [
  {
    title: 'Navigation',
    items: [
      { id: 'documents' as ViewType, label: 'Collections', icon: FileText },
      { id: 'settings' as ViewType, label: 'Settings', icon: Settings },
    ],
  },
];

export function MainSidebar({ activeView, onViewChange }: MainSidebarProps) {
  const { selectedDatabase, selectedCollection, selectDatabase, selectCollection } = useWorkflowStore();
  const { databases, selectDatabase: selectDbInDocStore, selectCollection: selectColInDocStore } = useDocumentStore();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Data': true,
    'Settings': true,
  });
  const [expandedDatabases, setExpandedDatabases] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Auto-expand selected database
    if (selectedDatabase && !expandedDatabases[selectedDatabase]) {
      setExpandedDatabases(prev => ({ ...prev, [selectedDatabase]: true }));
    }
  }, [selectedDatabase, expandedDatabases]);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const toggleDatabase = (dbName: string) => {
    // Only toggle expand/collapse, don't touch any other state
    setExpandedDatabases(prev => ({
      ...prev,
      [dbName]: !prev[dbName],
    }));
    // Explicitly do NOT call selectDatabase here
    // Selection only happens when clicking on a collection
  };

  const filteredDatabases = databases.filter(db => 
    db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    db.collections.some(col => col.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="h-full w-64 bg-card border-r flex flex-col">
      {/* Databases Section */}
      <div className="border-b">
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm">Databases</h2>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => {
                // Refresh databases - can be implemented later
                window.location.reload();
              }}
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Create Database"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-7 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Database Tree */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-0.5">
          {filteredDatabases.map((db) => {
            const isExpanded = expandedDatabases[db.name] || false;
            const isDbSelected = selectedDatabase === db.name;
            
            return (
              <div key={db.name}>
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer group",
                    isDbSelected && !selectedCollection
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                    // Only toggle expand/collapse, don't select database
                    // Selection happens when clicking on a collection
                    // This should NOT cause any navigation or redirect
                    toggleDatabase(db.name);
                    return false;
                  }}
                  onMouseDown={(e) => {
                    // Prevent any default browser behavior
                    e.preventDefault();
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
                  )}
                  <Database className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="flex-1 text-xs font-medium truncate">{db.name}</span>
                </div>
                
                {isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {db.collections
                      .filter(col => 
                        !searchQuery || 
                        col.name.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((collection) => {
                        const isCollectionSelected = 
                          selectedDatabase === db.name && selectedCollection === collection.name;
                        
                        return (
                          <div
                            key={collection.name}
                            className={cn(
                              "flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer group relative",
                              isCollectionSelected
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-accent"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Update both stores to keep them in sync
                              selectDatabase(db.name);
                              selectCollection(collection.name);
                              selectDbInDocStore(db.name);
                              selectColInDocStore(collection.name);
                              // Don't navigate, just select
                            }}
                          >
                            <Folder className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="flex-1 text-xs truncate">{collection.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                // Context menu
                              }}
                            >
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                )}
            </div>
            );
          })}
          {filteredDatabases.length === 0 && (
            <div className="px-2 py-4 text-center text-xs text-muted-foreground">
              {searchQuery ? 'No databases found' : 'No databases'}
            </div>
          )}
          </div>
      </div>

      {/* Navigation Section */}
      <div className="border-t">
        <div className="p-2">
        {NAVIGATION_SECTIONS.map((section) => (
            <div key={section.title} className="mb-2">
            <button
              onClick={() => toggleSection(section.title)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{section.title}</span>
              {expandedSections[section.title] ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
            
            {expandedSections[section.title] && (
              <div className="mt-1 space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => onViewChange(item.id)}
                      className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                    >
                        <Icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t">
        <div className="text-xs text-muted-foreground">
          <div className="font-semibold mb-1">MongoFlow Pro</div>
          <div>Advanced NoSQL IDE</div>
        </div>
      </div>
    </div>
  );
}

