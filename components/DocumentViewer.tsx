'use client';

import { useDocumentStore } from '@/store/documentStore';
import { useWorkflowStore } from '@/store/workflowStore';
import { usePipelineStore } from '@/store/pipelineStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Save, X, FileText, Search, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Document } from '@/types/pipeline';
import { mockDocuments } from '@/lib/mockDocuments';
import { AdaptiveInput } from '@/components/AdaptiveInput';

export function DocumentViewer() {
  // Use workflowStore for selection state (source of truth)
  const { selectedDatabase, selectedCollection, connectionString } = useWorkflowStore();
  const { schema } = usePipelineStore();
  const {
    documents,
    selectedDocument,
    setDocuments,
    selectDocument,
    addDocument,
    updateDocument,
    deleteDocument,
    setLoading,
    isLoading,
  } = useDocumentStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDatabase && selectedCollection) {
      setLoading(true);
      
      // connectionString is already available from useWorkflowStore above
      
      if (connectionString) {
        // Fetch real documents from MongoDB
        fetch('/api/mongodb/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            connectionString,
            databaseName: selectedDatabase,
            collectionName: selectedCollection,
            limit: 1000, // Increased limit to show more documents
          }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.documents) {
              setDocuments(data.documents);
            } else {
              // Fallback to mock
              const mockDocs = mockDocuments(selectedCollection);
              setDocuments(mockDocs);
            }
            setLoading(false);
          })
          .catch(error => {
            console.error('Failed to fetch documents:', error);
            // Fallback to mock
            const mockDocs = mockDocuments(selectedCollection);
            setDocuments(mockDocs);
            setLoading(false);
          });
      } else {
        // No connection, use mock
        setTimeout(() => {
          const mockDocs = mockDocuments(selectedCollection);
          setDocuments(mockDocs);
          setLoading(false);
        }, 300);
      }
    } else {
      setDocuments([]);
    }
  }, [selectedDatabase, selectedCollection, connectionString, setDocuments, setLoading]);

  const refreshDocuments = async () => {
    if (!connectionString || !selectedDatabase || !selectedCollection) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/mongodb/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionString,
          databaseName: selectedDatabase,
          collectionName: selectedCollection,
          limit: 1000, // Increased limit to show more documents
        }),
      });

      const data = await response.json();
      if (data.documents) {
        console.log('Documents refreshed:', data.documents.length, 'documents loaded, totalCount:', data.totalCount);
        setDocuments(data.documents);
        
        // Log first few document _ids to verify sorting
        if (data.documents.length > 0) {
          console.log('First 3 document _ids:', data.documents.slice(0, 3).map((d: any) => d._id));
        }
      } else {
        console.warn('No documents in response:', data);
      }

      // Also refresh the database list to update document counts
      try {
        const dbResponse = await fetch('/api/mongodb/databases', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ connectionString }),
        });

        const dbData = await dbResponse.json();
        if (dbResponse.ok && dbData.databases) {
          const { setDatabases } = useDocumentStore.getState();
          const formattedDatabases = dbData.databases.map((db: any) => ({
            name: db.name,
            collections: (db.collections || []).map((coll: any) => ({
              name: coll.name,
              documentCount: coll.count || 0,
            })),
          }));
          setDatabases(formattedDatabases);
        }
      } catch (error) {
        console.error('Failed to refresh database list:', error);
        // Don't fail the whole operation if this fails
      }
    } catch (error) {
      console.error('Failed to refresh documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (doc: Document) => {
    setEditingDoc(JSON.parse(JSON.stringify(doc)));
    setIsEditing(true);
    selectDocument(doc);
  };

  const handleSave = async () => {
    if (editingDoc && selectedDatabase && selectedCollection) {
      if (connectionString) {
        // Update in real MongoDB
        try {
          // Ensure _id is a string for JSON serialization
          let docId: any = editingDoc._id;
          if (docId && typeof docId === 'object' && 'toString' in docId && typeof docId.toString === 'function') {
            docId = docId.toString();
          }
          const docToSave = {
            ...editingDoc,
            _id: docId
          };
          
          console.log('Updating document with _id:', docToSave._id);
          
          const response = await fetch('/api/mongodb/documents', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              connectionString,
              databaseName: selectedDatabase,
              collectionName: selectedCollection,
              document: docToSave,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Update successful:', data);
            setIsEditing(false);
            setEditingDoc(null);
            selectDocument(null);
            // Refresh documents from server
            await refreshDocuments();
          } else {
            const errorData = await response.json();
            console.error('Update failed:', errorData);
            alert(`Failed to update document: ${errorData.error || 'Unknown error'}`);
          }
        } catch (error: any) {
          console.error('Update error:', error);
          alert(`Failed to update document: ${error.message || 'Unknown error'}`);
        }
      } else {
        // Fallback to local
      updateDocument(editingDoc._id, editingDoc);
      setIsEditing(false);
      setEditingDoc(null);
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingDoc(null);
    selectDocument(null);
  };

  const handleDelete = (id: string | any) => {
    // Convert to string if it's an ObjectId object
    let docId: any = id;
    if (docId && typeof docId === 'object' && 'toString' in docId && typeof docId.toString === 'function') {
      docId = docId.toString();
    } else {
      docId = String(docId);
    }
    setDocumentToDelete(docId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (documentToDelete && selectedDatabase && selectedCollection) {
      if (connectionString) {
        // Delete from real MongoDB
        try {
          // documentToDelete should already be a string from handleDelete, but ensure it is
          const docId = String(documentToDelete);
          
          console.log('Deleting document with _id:', docId);
          
          const response = await fetch('/api/mongodb/documents', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              connectionString,
              databaseName: selectedDatabase,
              collectionName: selectedCollection,
              documentId: docId,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Delete successful:', data);
            deleteDocument(documentToDelete);
            if (selectedDocument?._id === documentToDelete || 
                (selectedDocument?._id && String(selectedDocument._id) === docId)) {
              selectDocument(null);
            }
            // Refresh documents from server
            await refreshDocuments();
          } else {
            const errorData = await response.json();
            console.error('Delete failed:', errorData);
            alert(`Failed to delete document: ${errorData.error || 'Unknown error'}`);
          }
        } catch (error: any) {
          console.error('Delete error:', error);
          alert(`Failed to delete document: ${error.message || 'Unknown error'}`);
        }
      } else {
        // Fallback to local
        deleteDocument(documentToDelete);
        if (selectedDocument?._id === documentToDelete) {
          selectDocument(null);
        }
      }
      setShowDeleteDialog(false);
      setDocumentToDelete(null);
    }
  };

  const handleNewDocument = () => {
    const newDoc: Document = {
      _id: `new-${Date.now()}`,
      name: '',
      createdAt: new Date().toISOString(),
    };
    setEditingDoc(newDoc);
    setIsEditing(true);
    setShowNewDoc(true);
    selectDocument(null);
  };

  const handleCreate = async () => {
    if (editingDoc && selectedDatabase && selectedCollection) {
      if (connectionString) {
        // Create in real MongoDB
        try {
          const { _id, ...docData } = editingDoc;
          const response = await fetch('/api/mongodb/documents', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              connectionString,
              databaseName: selectedDatabase,
              collectionName: selectedCollection,
              document: docData,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setIsEditing(false);
            setEditingDoc(null);
            setShowNewDoc(false);
            selectDocument(null);
            
            // Clear search query so new document is visible
            setSearchQuery('');
            
            console.log('Document created successfully, insertedId:', data.insertedId);
            
            // Force immediate refresh - no delay needed as MongoDB writes are immediate
            await refreshDocuments();
            
            console.log('Documents refreshed after creation');
          } else {
            const errorData = await response.json();
            alert(`Failed to create document: ${errorData.error || 'Unknown error'}`);
          }
        } catch (error: any) {
          console.error('Create error:', error);
          alert(`Failed to create document: ${error.message || 'Unknown error'}`);
        }
      } else {
        // Fallback to local
        const { _id, ...docData } = editingDoc;
        addDocument(docData);
        setIsEditing(false);
        setEditingDoc(null);
        setShowNewDoc(false);
        selectDocument(null);
      }
    }
  };

  if (!selectedDatabase || !selectedCollection) {
    return (
      <Card className="h-full">
        <CardContent className="py-12 text-center text-muted-foreground">
          <p>Select a database and collection to view documents</p>
        </CardContent>
      </Card>
    );
  }

  // Filter documents based on search query
  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    // Search in all document fields
    return Object.entries(doc).some(([key, value]) => {
      if (key === '_id') {
        return String(value).toLowerCase().includes(query);
      }
      // Convert value to string for searching
      const valueStr = typeof value === 'object' 
        ? JSON.stringify(value).toLowerCase()
        : String(value).toLowerCase();
      return valueStr.includes(query);
    });
  });

  return (
    <div className="h-full flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-lg">
              {selectedCollection} ({documents.length} documents)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                onClick={refreshDocuments} 
                size="sm" 
                variant="outline"
                disabled={isLoading}
                title="Refresh documents"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            <Button onClick={handleNewDocument} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Document
            </Button>
            </div>
          </div>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No documents in this collection</p>
              <Button onClick={handleNewDocument} variant="outline" className="mt-4">
                Create First Document
              </Button>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No documents match your search query</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc._id}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                    selectedDocument?._id === doc._id ? 'bg-accent border-primary' : ''
                  }`}
                  onClick={() => selectDocument(doc)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono text-xs">
                          {doc._id.substring(0, 8)}...
                        </Badge>
                        {doc.name && <span className="font-medium">{doc.name}</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Object.keys(doc).filter(k => k !== '_id').length} fields
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(doc);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc._id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {searchQuery && filteredDocuments.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground text-center">
              Showing {filteredDocuments.length} of {documents.length} documents
            </div>
          )}
        </CardContent>
      </Card>

      {(isEditing && editingDoc) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {showNewDoc ? 'Create Document' : 'Edit Document'}
              </CardTitle>
              <div className="flex gap-2">
                <Button onClick={showNewDoc ? handleCreate : handleSave} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  {showNewDoc ? 'Create' : 'Save'}
                </Button>
                <Button variant="ghost" onClick={handleCancel} size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DocumentEditor doc={editingDoc} onChange={setEditingDoc} schema={schema} />
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent onClose={() => setShowDeleteDialog(false)}>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
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

      {selectedDocument && !isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(selectedDocument, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DocumentEditor({
  doc,
  onChange,
  schema,
}: {
  doc: Document;
  onChange: (doc: Document) => void;
  schema: any[];
}) {
  const [customFields, setCustomFields] = useState<Array<{ key: string; value: string; type: string }>>([]);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldType, setNewFieldType] = useState('String');

  // Get all fields from document (excluding _id)
  const docFields = Object.keys(doc).filter(key => key !== '_id');
  
  // Get schema fields
  const schemaFieldPaths = schema.length > 0 ? schema.map(f => f.path) : [];
  
  // Combine schema fields and document fields
  const allFields = Array.from(new Set([...schemaFieldPaths, ...docFields]));
  
  // If no fields exist, show at least common fields
  const hasFields = allFields.length > 0;

  const updateField = (fieldPath: string, value: any) => {
    const updated = { ...doc };
    
    // Convert value based on type
    let convertedValue = value;
    if (value === '') {
      delete updated[fieldPath];
    } else {
      // Try to infer type from schema
      const schemaField = schema.find(f => f.path === fieldPath);
      if (schemaField) {
        if (schemaField.type === 'Number') {
          convertedValue = value ? Number(value) : null;
        } else if (schemaField.type === 'Boolean') {
          convertedValue = value === 'true' || value === true;
        } else if (schemaField.type === 'Date') {
          convertedValue = value ? new Date(value).toISOString() : null;
        }
      }
      updated[fieldPath] = convertedValue;
      }
    
    onChange(updated);
  };

  const addCustomField = () => {
    if (newFieldKey.trim() && !doc[newFieldKey.trim()]) {
      const updated = { ...doc };
      let value: any = '';
      
      if (newFieldType === 'Number') {
        value = 0;
      } else if (newFieldType === 'Boolean') {
        value = false;
      } else if (newFieldType === 'Date') {
        value = new Date().toISOString();
      }
      
      updated[newFieldKey.trim()] = value;
      onChange(updated);
      setNewFieldKey('');
      setNewFieldType('String');
    }
  };

  const removeField = (fieldPath: string) => {
    const updated = { ...doc };
    delete updated[fieldPath];
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Schema-based fields */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold">Document Fields</h4>
        {hasFields ? (
          <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4">
            {allFields.map((fieldPath) => {
              const schemaField = schema.find(f => f.path === fieldPath);
              const value = doc[fieldPath];
              
              // Format value for display
              let displayValue = '';
              if (value !== null && value !== undefined) {
                if (typeof value === 'object' && !Array.isArray(value)) {
                  displayValue = JSON.stringify(value);
                } else if (Array.isArray(value)) {
                  displayValue = JSON.stringify(value);
                } else {
                  displayValue = String(value);
                }
              }

              return (
                <div key={fieldPath} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <span className="font-mono">{fieldPath}</span>
                      {schemaField && (
                        <Badge variant="outline" className="text-xs">
                          {schemaField.type}
                        </Badge>
                      )}
                      {!schemaField && (
                        <Badge variant="secondary" className="text-xs">
                          Custom
                        </Badge>
                      )}
                    </label>
                    {fieldPath !== '_id' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeField(fieldPath)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  {typeof value === 'object' && value !== null && !Array.isArray(value) ? (
                    <textarea
                      value={displayValue}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          updateField(fieldPath, parsed);
                        } catch {
                          // Invalid JSON, keep as string
                          updateField(fieldPath, e.target.value);
                        }
                      }}
                      className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                      rows={3}
                      placeholder="Enter JSON object"
                    />
                  ) : Array.isArray(value) ? (
      <textarea
                      value={displayValue}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          updateField(fieldPath, parsed);
                        } catch {
                          // Invalid JSON, keep as string
                          updateField(fieldPath, e.target.value);
                        }
                      }}
                      className="w-full p-2 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                      rows={3}
                      placeholder="Enter JSON array"
                    />
                  ) : (
                    <AdaptiveInput
                      value={displayValue}
                      onChange={(value) => updateField(fieldPath, value)}
                      fieldPath={fieldPath}
                      schema={schema}
      />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border rounded-lg p-4 text-center text-sm text-muted-foreground">
            <p>No fields yet. Add a field below to get started.</p>
          </div>
        )}
      </div>

      {/* Add new field */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold mb-3">Add New Field</h4>
        <div className="flex gap-2">
          <Input
            placeholder="Field name"
            value={newFieldKey}
            onChange={(e) => setNewFieldKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomField()}
            className="flex-1"
          />
          <select
            value={newFieldType}
            onChange={(e) => setNewFieldType(e.target.value)}
            className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="String">String</option>
            <option value="Number">Number</option>
            <option value="Boolean">Boolean</option>
            <option value="Date">Date</option>
          </select>
          <Button onClick={addCustomField} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

