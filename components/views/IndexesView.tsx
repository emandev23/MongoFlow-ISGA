'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Plus, Trash2, Zap, RefreshCw, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useWorkflowStore } from '@/store/workflowStore';
import { usePipelineStore } from '@/store/pipelineStore';

interface Index {
  name: string;
  key: Record<string, number>;
  unique?: boolean;
  sparse?: boolean;
  background?: boolean;
  expireAfterSeconds?: number;
  partialFilterExpression?: Record<string, any>;
  weights?: Record<string, number>;
  default_language?: string;
  textIndexVersion?: number;
  '2dsphereIndexVersion'?: number;
  bits?: number;
  min?: number;
  max?: number;
  v?: number;
}

export function IndexesView() {
  const { selectedDatabase, selectedCollection, connectionString } = useWorkflowStore();
  const { schema } = usePipelineStore();
  const [indexes, setIndexes] = useState<Index[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState<string | null>(null);

  // Form state for create
  const [indexName, setIndexName] = useState('');
  const [indexFields, setIndexFields] = useState<Array<{ field: string; order: number }>>([{ field: '', order: 1 }]);
  const [indexUnique, setIndexUnique] = useState(false);
  const [indexSparse, setIndexSparse] = useState(false);
  const [indexBackground, setIndexBackground] = useState(false);
  const [indexTTL, setIndexTTL] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (connectionString && selectedDatabase && selectedCollection) {
      fetchIndexes();
    } else {
      setIndexes([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionString, selectedDatabase, selectedCollection]);

  const fetchIndexes = async () => {
    if (!connectionString || !selectedDatabase || !selectedCollection) return;

    setLoading(true);
    try {
      const response = await fetch('/api/mongodb/indexes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionString,
          databaseName: selectedDatabase,
          collectionName: selectedCollection,
        }),
      });

      const data = await response.json();
      if (response.ok && data.indexes) {
        setIndexes(data.indexes);
      } else {
        console.error('Failed to fetch indexes:', data.error);
        setIndexes([]);
      }
    } catch (error) {
      console.error('Error fetching indexes:', error);
      setIndexes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!connectionString || !selectedDatabase || !selectedCollection) return;
    
    // Validate fields
    const validFields = indexFields.filter(f => f.field);
    if (validFields.length === 0) {
      alert('Please add at least one field to the index');
      return;
    }

    try {
      const key: Record<string, number> = {};
      validFields.forEach(f => {
        key[f.field] = f.order;
      });

      const indexOptions: any = {};
      if (indexName) indexOptions.name = indexName;
      if (indexUnique) indexOptions.unique = true;
      if (indexSparse) indexOptions.sparse = true;
      if (indexBackground) indexOptions.background = true;
      if (indexTTL !== undefined && indexTTL > 0) {
        indexOptions.expireAfterSeconds = indexTTL;
      }

      const response = await fetch('/api/mongodb/indexes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionString,
          databaseName: selectedDatabase,
          collectionName: selectedCollection,
          index: {
            key,
            ...indexOptions,
          },
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setShowCreateDialog(false);
        resetForm();
        await fetchIndexes();
      } else {
        alert(`Failed to create index: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error creating index:', error);
      alert(`Failed to create index: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDelete = (name: string) => {
    if (name === '_id_') {
      alert('Cannot delete the _id_ index');
      return;
    }
    setIndexToDelete(name);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!indexToDelete || !connectionString || !selectedDatabase || !selectedCollection) return;

    try {
      const response = await fetch('/api/mongodb/indexes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionString,
          databaseName: selectedDatabase,
          collectionName: selectedCollection,
          indexName: indexToDelete,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setShowDeleteDialog(false);
        setIndexToDelete(null);
        await fetchIndexes();
      } else {
        alert(`Failed to delete index: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error deleting index:', error);
      alert(`Failed to delete index: ${error.message || 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setIndexName('');
    setIndexFields([{ field: '', order: 1 }]);
    setIndexUnique(false);
    setIndexSparse(false);
    setIndexBackground(false);
    setIndexTTL(undefined);
  };

  const addField = () => {
    setIndexFields([...indexFields, { field: '', order: 1 }]);
  };

  const removeField = (index: number) => {
    if (indexFields.length > 1) {
      setIndexFields(indexFields.filter((_, i) => i !== index));
    }
  };

  const updateField = (index: number, updates: Partial<{ field: string; order: number }>) => {
    const newFields = [...indexFields];
    newFields[index] = { ...newFields[index], ...updates };
    setIndexFields(newFields);
  };

  if (!selectedDatabase || !selectedCollection) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Select a collection to view and manage indexes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Zap className="h-8 w-8 text-primary" />
            Indexes
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage indexes for {selectedCollection} collection
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchIndexes} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Index
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading indexes...</p>
          </CardContent>
        </Card>
      ) : indexes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No indexes found. Create your first index to improve query performance.
            </p>
            <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Index
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Indexes ({indexes.length})</CardTitle>
            <CardDescription>
              Indexes defined for this collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {indexes.map((index) => (
                <div key={index.name} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono font-medium">{index.name}</span>
                      {index.unique && <Badge variant="default">Unique</Badge>}
                      {index.sparse && <Badge variant="outline">Sparse</Badge>}
                      {index.background && <Badge variant="outline">Background</Badge>}
                      {index.expireAfterSeconds !== undefined && (
                        <Badge variant="secondary">TTL: {index.expireAfterSeconds}s</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Object.entries(index.key).map(([field, order], idx) => (
                        <span key={field}>
                          {idx > 0 && ', '}
                          <span className="font-medium">{field}</span>
                          <span className="text-xs ml-1">({order === 1 ? 'asc' : 'desc'})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  {index.name !== '_id_' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(index.name)}
                      className="ml-4"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Index Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Index</DialogTitle>
            <DialogDescription>
              Define fields and options for the new index
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Index Name (optional)</label>
              <Input 
                placeholder="Leave empty for auto-generated name"
                value={indexName}
                onChange={(e) => setIndexName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                If not specified, MongoDB will generate a name based on the fields
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Index Fields</label>
                <Button variant="outline" size="sm" onClick={addField}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>
              <div className="space-y-2">
                {indexFields.map((field, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Select
                      value={field.field}
                      onChange={(e) => updateField(idx, { field: e.target.value })}
                      className="flex-1"
                    >
                      <option value="">Select field</option>
                      {schema.map((s) => (
                        <option key={s.path} value={s.path}>
                          {s.path} ({s.type})
                        </option>
                      ))}
                    </Select>
                    <Select
                      value={field.order.toString()}
                      onChange={(e) => updateField(idx, { order: parseInt(e.target.value) })}
                      className="w-32"
                    >
                      <option value="1">Ascending (1)</option>
                      <option value="-1">Descending (-1)</option>
                    </Select>
                    {indexFields.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeField(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <h3 className="text-sm font-medium">Index Options</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={indexUnique}
                    onChange={(e) => setIndexUnique(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Unique</span>
                  <span className="text-xs text-muted-foreground">- Ensures no duplicate values</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={indexSparse}
                    onChange={(e) => setIndexSparse(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Sparse</span>
                  <span className="text-xs text-muted-foreground">- Skips documents missing the indexed field</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={indexBackground}
                    onChange={(e) => setIndexBackground(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Background</span>
                  <span className="text-xs text-muted-foreground">- Builds index in the background</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t">
              <label className="text-sm font-medium mb-1 block">TTL (Time To Live) in seconds (optional)</label>
              <Input 
                type="number"
                placeholder="e.g., 3600 for 1 hour"
                value={indexTTL || ''}
                onChange={(e) => setIndexTTL(e.target.value ? Number(e.target.value) : undefined)}
                min="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Automatically delete documents after the specified number of seconds
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Index</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Index</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the index &quot;{indexToDelete}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
