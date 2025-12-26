'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Shield, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useWorkflowStore } from '@/store/workflowStore';
import { usePipelineStore } from '@/store/pipelineStore';
import { analyzeSchemaFromDocuments } from '@/lib/schemaAnalyzer';
import { mockDocuments } from '@/lib/mockDocuments';

interface FieldValidation {
  field: string;
  bsonType: string;
  required: boolean;
  min?: number;
  max?: number;
  pattern?: string;
}

export function ValidationView() {
  const { selectedDatabase, selectedCollection, connectionString } = useWorkflowStore();
  const { schema, setSchema } = usePipelineStore();
  const [validator, setValidator] = useState<Record<string, any> | null>(null);
  const [validationLevel, setValidationLevel] = useState<string>('strict');
  const [validationAction, setValidationAction] = useState<string>('error');
  const [loading, setLoading] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [fieldValidations, setFieldValidations] = useState<FieldValidation[]>([]);

  // Fetch documents and populate schema when collection changes
  useEffect(() => {
    if (selectedDatabase && selectedCollection) {
      if (connectionString) {
        fetch('/api/mongodb/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            connectionString,
            databaseName: selectedDatabase,
            collectionName: selectedCollection,
            limit: 100,
          }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.documents && data.documents.length > 0) {
              const analyzedSchema = analyzeSchemaFromDocuments(data.documents);
              setSchema(analyzedSchema);
            } else {
              const mockDocs = mockDocuments(selectedCollection);
              if (mockDocs.length > 0) {
                const analyzedSchema = analyzeSchemaFromDocuments(mockDocs);
                setSchema(analyzedSchema);
              } else {
                setSchema([]);
              }
            }
          })
          .catch(error => {
            console.error('Failed to fetch documents for schema:', error);
            const mockDocs = mockDocuments(selectedCollection);
            if (mockDocs.length > 0) {
              const analyzedSchema = analyzeSchemaFromDocuments(mockDocs);
              setSchema(analyzedSchema);
            } else {
              setSchema([]);
            }
          });
      } else {
        const mockDocs = mockDocuments(selectedCollection);
        if (mockDocs.length > 0) {
          const analyzedSchema = analyzeSchemaFromDocuments(mockDocs);
          setSchema(analyzedSchema);
        } else {
          setSchema([]);
        }
      }
    }
  }, [selectedDatabase, selectedCollection, connectionString, setSchema]);

  useEffect(() => {
    if (connectionString && selectedDatabase && selectedCollection) {
      fetchValidation();
    } else {
      setValidator(null);
      setFieldValidations([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionString, selectedDatabase, selectedCollection]);

  // When dialog opens, always load the latest validation from database
  useEffect(() => {
    if (showEditDialog && connectionString && selectedDatabase && selectedCollection) {
      // Fetch latest validation when dialog opens - always get fresh data
      const loadValidationForDialog = async () => {
        setLoading(true);
        try {
          const response = await fetch('/api/mongodb/validation', {
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
          if (response.ok) {
            // Update state with fresh data from database
            const currentValidator = data.validator || null;
            const currentLevel = data.validationLevel || 'strict';
            const currentAction = data.validationAction || 'error';
            
            setValidator(currentValidator);
            setValidationLevel(currentLevel);
            setValidationAction(currentAction);
            
            // Populate form with current validation from database
            if (currentValidator && currentValidator.$jsonSchema) {
              const jsonSchema = currentValidator.$jsonSchema;
              const required = jsonSchema.required || [];
              const properties = jsonSchema.properties || {};
              
              const validations: FieldValidation[] = Object.entries(properties).map(([field, prop]: [string, any]) => ({
                field,
                bsonType: prop.bsonType || 'string',
                required: required.includes(field),
                min: prop.minimum || prop.minLength,
                max: prop.maximum || prop.maxLength,
                pattern: prop.pattern,
              }));
              
              setFieldValidations(validations.length > 0 ? validations : [{ field: '', bsonType: 'string', required: false }]);
            } else {
              // If no validation exists, start with empty form
              setFieldValidations([{ field: '', bsonType: 'string', required: false }]);
            }
          } else {
            // No validation or error - start with empty form
            setFieldValidations([{ field: '', bsonType: 'string', required: false }]);
          }
        } catch (error) {
          console.error('Error loading validation for dialog:', error);
          setFieldValidations([{ field: '', bsonType: 'string', required: false }]);
        } finally {
          setLoading(false);
        }
      };
      
      loadValidationForDialog();
    } else if (showEditDialog && (!connectionString || !selectedDatabase || !selectedCollection)) {
      // No connection - start with empty form
      setFieldValidations([{ field: '', bsonType: 'string', required: false }]);
    }
  }, [showEditDialog, connectionString, selectedDatabase, selectedCollection]);

  const fetchValidation = async () => {
    if (!connectionString || !selectedDatabase || !selectedCollection) {
      setValidator(null);
      setFieldValidations([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/mongodb/validation', {
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
      if (response.ok) {
        // Always update from database - no hard-coded values
        setValidator(data.validator || null);
        setValidationLevel(data.validationLevel || 'strict');
        setValidationAction(data.validationAction || 'error');
        
        // Parse validator to field validations for display
        if (data.validator && data.validator.$jsonSchema) {
          const jsonSchema = data.validator.$jsonSchema;
          const required = jsonSchema.required || [];
          const properties = jsonSchema.properties || {};
          
          const validations: FieldValidation[] = Object.entries(properties).map(([field, prop]: [string, any]) => ({
            field,
            bsonType: prop.bsonType || 'string',
            required: required.includes(field),
            min: prop.minimum || prop.minLength,
            max: prop.maximum || prop.maxLength,
            pattern: prop.pattern,
          }));
          
          setFieldValidations(validations);
        } else {
          setFieldValidations([]);
        }
      } else {
        console.error('Failed to fetch validation:', data.error);
        setValidator(null);
        setFieldValidations([]);
        setValidationLevel('strict');
        setValidationAction('error');
      }
    } catch (error) {
      console.error('Error fetching validation:', error);
      setValidator(null);
      setFieldValidations([]);
      setValidationLevel('strict');
      setValidationAction('error');
    } finally {
      setLoading(false);
    }
  };

  const buildValidatorFromFields = (): Record<string, any> => {
    const required: string[] = [];
    const properties: Record<string, any> = {};

    fieldValidations.forEach((fv) => {
      if (!fv.field || !fv.bsonType) return; // Skip invalid fields

      if (fv.required) {
        required.push(fv.field);
      }

      const property: Record<string, any> = {
        bsonType: fv.bsonType,
      };

      if (fv.min !== undefined && fv.min !== null && fv.min !== '') {
        if (fv.bsonType === 'string') {
          property.minLength = Number(fv.min);
        } else {
          property.minimum = Number(fv.min);
        }
      }

      if (fv.max !== undefined && fv.max !== null && fv.max !== '') {
        if (fv.bsonType === 'string') {
          property.maxLength = Number(fv.max);
        } else {
          property.maximum = Number(fv.max);
        }
      }

      if (fv.pattern && fv.pattern.trim()) {
        property.pattern = fv.pattern;
      }

      properties[fv.field] = property;
    });

    return {
      $jsonSchema: {
        bsonType: 'object',
        required,
        properties,
      },
    };
  };

  const handleSave = async () => {
    if (!connectionString || !selectedDatabase || !selectedCollection) return;

    // Validate that at least one field has a name and type
    const validFields = fieldValidations.filter(fv => fv.field && fv.bsonType);
    if (validFields.length === 0) {
      alert('Please add at least one field with a name and type.');
      return;
    }

    try {
      const validatorToSave = buildValidatorFromFields();

      const response = await fetch('/api/mongodb/validation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionString,
          databaseName: selectedDatabase,
          collectionName: selectedCollection,
          validator: validatorToSave,
          validationLevel,
          validationAction,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setShowEditDialog(false);
        // Always fetch fresh data from database after save
        await fetchValidation();
      } else {
        alert(`Failed to save validation: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error saving validation:', error);
      alert(`Failed to save validation: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async () => {
    if (!connectionString || !selectedDatabase || !selectedCollection) return;

    try {
      const response = await fetch('/api/mongodb/validation', {
        method: 'DELETE',
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
      if (response.ok) {
        setShowDeleteDialog(false);
        // Always fetch fresh data from database after delete
        await fetchValidation();
      } else {
        alert(`Failed to remove validation: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error removing validation:', error);
      alert(`Failed to remove validation: ${error.message || 'Unknown error'}`);
    }
  };

  const addField = () => {
    setFieldValidations([...fieldValidations, {
      field: '',
      bsonType: 'string',
      required: false,
    }]);
  };

  const removeField = (index: number) => {
    setFieldValidations(fieldValidations.filter((_, i) => i !== index));
  };

  const updateField = (index: number, updates: Partial<FieldValidation>) => {
    const newFields = [...fieldValidations];
    newFields[index] = { ...newFields[index], ...updates };
    setFieldValidations(newFields);
  };

  const loadFromSchema = () => {
    if (schema.length === 0) {
      alert('No schema available. Load documents first to see fields.');
      return;
    }

    const validations: FieldValidation[] = schema
      .filter(s => s.path !== '_id')
      .map(s => {
        const typeMap: Record<string, string> = {
          'String': 'string',
          'Number': 'number',
          'Boolean': 'bool',
          'Date': 'date',
          'Array': 'array',
          'Object': 'object',
          'ObjectId': 'objectId',
        };

        return {
          field: s.path,
          bsonType: typeMap[s.type] || 'string',
          required: false,
        };
      });

    setFieldValidations(validations);
  };

  if (!selectedDatabase || !selectedCollection) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Select a collection to view and manage validation rules.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasValidation = validator && Object.keys(validator).length > 0 && validator.$jsonSchema;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Validation Rules
          </h1>
          <p className="text-muted-foreground mt-2">
            Define validation rules for {selectedCollection} collection
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchValidation} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {hasValidation && (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
          <Button onClick={() => setShowEditDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {hasValidation ? 'Edit' : 'Create'} Rules
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading validation rules...</p>
          </CardContent>
        </Card>
      ) : !hasValidation ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No validation rules configured. Create rules to enforce document structure.
            </p>
            <Button onClick={() => setShowEditDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Validation Rules
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Validation Level</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {validationLevel}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  {validationLevel === 'strict' 
                    ? 'Validates all inserts and updates'
                    : validationLevel === 'moderate'
                    ? 'Validates inserts and updates to existing valid documents'
                    : 'No validation'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Validation Action</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {validationAction}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  {validationAction === 'error'
                    ? 'Rejects invalid documents with an error'
                    : 'Logs validation errors but allows invalid documents'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Field Validations ({fieldValidations.length})</CardTitle>
              <CardDescription>
                Current validation rules for collection fields
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fieldValidations.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No field validations configured
                </p>
              ) : (
                <div className="space-y-2">
                  {fieldValidations.map((fv, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{fv.field}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          <Badge variant="outline">{fv.bsonType}</Badge>
                          {fv.required && <Badge variant="default">Required</Badge>}
                          {fv.min !== undefined && <span>Min: {fv.min}</span>}
                          {fv.max !== undefined && <span>Max: {fv.max}</span>}
                          {fv.pattern && <span className="text-xs font-mono">Pattern</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Validation Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) {
          // When closing, reset to current database state (will be loaded when reopening)
          // Don't reset here - let the useEffect handle it when dialog reopens
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{hasValidation ? 'Edit' : 'Create'} Validation Rules</DialogTitle>
            <DialogDescription>
              Define field validation rules for your collection
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Fields</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadFromSchema}>
                  Load from Schema
                </Button>
                <Button variant="outline" size="sm" onClick={addField}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {fieldValidations.map((fv, idx) => (
                <div key={idx} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium mb-1 block">Field Name</label>
                        <Select
                          value={fv.field}
                          onChange={(e) => updateField(idx, { field: e.target.value })}
                        >
                          <option value="">Select field</option>
                          {schema.map((s) => (
                            <option key={s.path} value={s.path}>
                              {s.path} ({s.type})
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">Type</label>
                        <Select
                          value={fv.bsonType}
                          onChange={(e) => updateField(idx, { bsonType: e.target.value })}
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="bool">Boolean</option>
                          <option value="date">Date</option>
                          <option value="array">Array</option>
                          <option value="object">Object</option>
                          <option value="objectId">ObjectId</option>
                        </Select>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeField(idx)}
                      className="mt-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fv.required}
                        onChange={(e) => updateField(idx, { required: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Required</span>
                    </label>
                  </div>

                  {(fv.bsonType === 'string' || fv.bsonType === 'number') && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium mb-1 block">
                          {fv.bsonType === 'string' ? 'Min Length' : 'Min Value'}
                        </label>
                        <Input
                          type="number"
                          value={fv.min || ''}
                          onChange={(e) => updateField(idx, { min: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="Optional"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">
                          {fv.bsonType === 'string' ? 'Max Length' : 'Max Value'}
                        </label>
                        <Input
                          type="number"
                          value={fv.max || ''}
                          onChange={(e) => updateField(idx, { max: e.target.value ? Number(e.target.value) : undefined })}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  )}

                  {fv.bsonType === 'string' && (
                    <div>
                      <label className="text-xs font-medium mb-1 block">Pattern (Regex)</label>
                      <Input
                        value={fv.pattern || ''}
                        onChange={(e) => updateField(idx, { pattern: e.target.value || undefined })}
                        placeholder="e.g., ^[a-zA-Z0-9]+$"
                      />
                    </div>
                  )}
                </div>
              ))}
              {fieldValidations.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No fields added. Click "Add Field" or "Load from Schema" to get started.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <label className="text-sm font-medium mb-1 block">Validation Level</label>
                <Select
                  value={validationLevel}
                  onChange={(e) => setValidationLevel(e.target.value)}
                >
                  <option value="strict">Strict</option>
                  <option value="moderate">Moderate</option>
                  <option value="off">Off</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Validation Action</label>
                <Select
                  value={validationAction}
                  onChange={(e) => setValidationAction(e.target.value)}
                >
                  <option value="error">Error</option>
                  <option value="warn">Warn</option>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {hasValidation ? 'Update' : 'Create'} Validation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Validation Rules</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove all validation rules from this collection? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Remove Validation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
