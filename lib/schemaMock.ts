import { SchemaField, FieldType } from '@/types/pipeline';

// Mock schema data - simulates API call to inspect collection
export function mockSchemaDiscovery(): SchemaField[] {
  return [
    {
      name: '_id',
      type: 'ObjectId',
      path: '_id',
    },
    {
      name: 'name',
      type: 'String',
      path: 'name',
    },
    {
      name: 'email',
      type: 'String',
      path: 'email',
    },
    {
      name: 'age',
      type: 'Number',
      path: 'age',
    },
    {
      name: 'isActive',
      type: 'Boolean',
      path: 'isActive',
    },
    {
      name: 'createdAt',
      type: 'Date',
      path: 'createdAt',
    },
    {
      name: 'address',
      type: 'Object',
      path: 'address',
      children: [
        {
          name: 'street',
          type: 'String',
          path: 'address.street',
        },
        {
          name: 'city',
          type: 'String',
          path: 'address.city',
        },
        {
          name: 'zipCode',
          type: 'Number',
          path: 'address.zipCode',
        },
        {
          name: 'country',
          type: 'String',
          path: 'address.country',
        },
      ],
    },
    {
      name: 'tags',
      type: 'Array',
      path: 'tags',
    },
    {
      name: 'metadata',
      type: 'Object',
      path: 'metadata',
      children: [
        {
          name: 'source',
          type: 'String',
          path: 'metadata.source',
        },
        {
          name: 'version',
          type: 'Number',
          path: 'metadata.version',
        },
      ],
    },
  ];
}

export function getFieldType(path: string, schema: SchemaField[]): FieldType | null {
  const findField = (fields: SchemaField[], targetPath: string): SchemaField | null => {
    for (const field of fields) {
      if (field.path === targetPath) {
        return field;
      }
      if (field.children) {
        const found = findField(field.children, targetPath);
        if (found) return found;
      }
    }
    return null;
  };

  const field = findField(schema, path);
  return field?.type || null;
}

// Re-export for backward compatibility
export { analyzeSchemaFromDocuments, generateSchemaFromSample } from './schemaAnalyzer';


