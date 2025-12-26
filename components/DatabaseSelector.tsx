'use client';

import { useDocumentStore } from '@/store/documentStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Database, Plus, Folder, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function DatabaseSelector() {
  const {
    databases,
    selectedDatabase,
    selectedCollection,
    selectDatabase,
    selectCollection,
    createDatabase,
    createCollection,
  } = useDocumentStore();
  const [showNewDb, setShowNewDb] = useState(false);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [newDbName, setNewDbName] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');

  const handleCreateDatabase = () => {
    if (newDbName.trim()) {
      createDatabase(newDbName.trim());
      setNewDbName('');
      setShowNewDb(false);
    }
  };

  const handleCreateCollection = () => {
    if (newCollectionName.trim() && selectedDatabase) {
      createCollection(selectedDatabase, newCollectionName.trim());
      setNewCollectionName('');
      setShowNewCollection(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5" />
            Databases
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNewDb(!showNewDb)}
            title="Create Database"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {showNewDb && (
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Database name"
              value={newDbName}
              onChange={(e) => setNewDbName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateDatabase()}
              autoFocus
            />
            <Button size="sm" onClick={handleCreateDatabase}>
              Create
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {databases.map((db) => (
            <DatabaseItem
              key={db.name}
              db={db}
              isSelected={selectedDatabase === db.name}
              selectedCollection={selectedCollection}
              onSelectDatabase={selectDatabase}
              onSelectCollection={selectCollection}
              onCreateCollection={() => {
                setShowNewCollection(true);
                selectDatabase(db.name);
              }}
            />
          ))}
          {databases.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No databases. Create one to get started.
            </p>
          )}
        </div>
        {selectedDatabase && showNewCollection && (
          <div className="mt-4 p-3 border rounded-lg bg-muted/50">
            <div className="flex gap-2">
              <Input
                placeholder="Collection name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                autoFocus
              />
              <Button size="sm" onClick={handleCreateCollection}>
                Create
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNewCollection(false);
                  setNewCollectionName('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DatabaseItem({
  db,
  isSelected,
  selectedCollection,
  onSelectDatabase,
  onSelectCollection,
  onCreateCollection,
}: {
  db: { name: string; collections: { name: string; documentCount: number }[] };
  isSelected: boolean;
  selectedCollection: string | null;
  onSelectDatabase: (name: string) => void;
  onSelectCollection: (name: string) => void;
  onCreateCollection: () => void;
}) {
  const [expanded, setExpanded] = useState(isSelected);

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-accent ${
          isSelected ? 'bg-accent' : ''
        }`}
        onClick={() => {
          setExpanded(!expanded);
          onSelectDatabase(db.name);
        }}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <Folder className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-sm font-medium">{db.name}</span>
        <Badge variant="secondary" className="text-xs">
          {db.collections.length}
        </Badge>
      </div>
      {expanded && (
        <div className="ml-6 mt-1 space-y-1">
          {db.collections.map((collection) => (
            <div
              key={collection.name}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent ${
                selectedCollection === collection.name ? 'bg-accent' : ''
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onSelectCollection(collection.name);
              }}
            >
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="flex-1 text-xs">{collection.name}</span>
              <Badge variant="outline" className="text-xs">
                {collection.documentCount}
              </Badge>
            </div>
          ))}
          <button
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-xs text-muted-foreground w-full"
            onClick={(e) => {
              e.stopPropagation();
              onCreateCollection();
            }}
          >
            <Plus className="h-3 w-3" />
            <span>Create Collection</span>
          </button>
        </div>
      )}
    </div>
  );
}

