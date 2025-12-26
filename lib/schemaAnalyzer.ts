import { SchemaField, FieldType } from '@/types/pipeline';
import { Document } from '@/types/pipeline';

/**
 * Analyze documents to generate a dynamic schema
 */
export function analyzeSchemaFromDocuments(documents: Document[]): SchemaField[] {
  if (documents.length === 0) {
    return [];
  }

  const fieldMap = new Map<string, SchemaField>();
  
  // Always include _id
  fieldMap.set('_id', {
    name: '_id',
    type: 'ObjectId',
    path: '_id',
  });

  // Analyze each document
  documents.forEach(doc => {
    analyzeDocument(doc, '', fieldMap);
  });

  return Array.from(fieldMap.values()).sort((a, b) => a.path.localeCompare(b.path));
}

function analyzeDocument(obj: any, prefix: string, fieldMap: Map<string, SchemaField>) {
  Object.keys(obj).forEach(key => {
    if (key === '_id') return; // Already handled
    
    const path = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];
    const type = inferType(value);

    if (!fieldMap.has(path)) {
      const field: SchemaField = {
        name: key,
        type,
        path,
        children: [],
      };

      // Handle nested objects
      if (type === 'Object' && value !== null && typeof value === 'object' && !Array.isArray(value)) {
        analyzeDocument(value, path, fieldMap);
        // Collect children
        const children: SchemaField[] = [];
        Object.keys(value).forEach(childKey => {
          const childPath = `${path}.${childKey}`;
          const childField = fieldMap.get(childPath);
          if (childField) {
            children.push(childField);
          }
        });
        field.children = children.length > 0 ? children : undefined;
      }

      // Handle arrays
      if (type === 'Array' && Array.isArray(value) && value.length > 0) {
        const firstElement = value[0];
        if (typeof firstElement === 'object' && firstElement !== null && !Array.isArray(firstElement)) {
          // Array of objects - analyze first element
          analyzeDocument(firstElement, `${path}[]`, fieldMap);
        }
      }

      fieldMap.set(path, field);
    } else {
      // Field already exists, check if type needs updating
      const existingField = fieldMap.get(path)!;
      const newType = inferType(value);
      
      // If types differ, mark as Mixed
      if (existingField.type !== newType && existingField.type !== 'Mixed') {
        if (newType !== existingField.type) {
          existingField.type = 'Mixed';
        }
      }

      // Update children if it's an object
      if (newType === 'Object' && value !== null && typeof value === 'object' && !Array.isArray(value)) {
        analyzeDocument(value, path, fieldMap);
      }
    }
  });
}

function inferType(value: any): FieldType {
  if (value === null || value === undefined) {
    return 'Mixed';
  }
  
  if (Array.isArray(value)) {
    return 'Array';
  }
  
  if (value instanceof Date) {
    return 'Date';
  }
  
  if (typeof value === 'boolean') {
    return 'Boolean';
  }
  
  if (typeof value === 'number') {
    return 'Number';
  }
  
  if (typeof value === 'string') {
    // Check if it's an ObjectId-like string
    if (/^[0-9a-fA-F]{24}$/.test(value)) {
      return 'ObjectId';
    }
    return 'String';
  }
  
  if (typeof value === 'object') {
    return 'Object';
  }
  
  return 'Mixed';
}

/**
 * Generate schema from a single sample document
 */
export function generateSchemaFromSample(document: Document): SchemaField[] {
  return analyzeSchemaFromDocuments([document]);
}

