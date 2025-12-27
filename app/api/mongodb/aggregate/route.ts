import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Helper function to serialize MongoDB documents to JSON-compatible format
function serializeDocument(doc: any): any {
  if (doc === null || doc === undefined) {
    return doc;
  }
  
  if (doc instanceof ObjectId) {
    return doc.toString();
  }
  
  if (doc instanceof Date) {
    return doc.toISOString();
  }
  
  if (Array.isArray(doc)) {
    return doc.map(item => serializeDocument(item));
  }
  
  if (typeof doc === 'object') {
    const serialized: any = {};
    for (const [key, value] of Object.entries(doc)) {
      serialized[key] = serializeDocument(value);
    }
    return serialized;
  }
  
  return doc;
}

export async function POST(request: NextRequest) {
  try {
    const { connectionString, databaseName, collectionName, pipeline } = await request.json();

    if (!connectionString || !databaseName || !collectionName) {
      return NextResponse.json(
        { error: 'Connection string, database name, and collection name are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(pipeline)) {
      return NextResponse.json(
        { error: 'Pipeline must be an array' },
        { status: 400 }
      );
    }

    const collection = await getCollection(connectionString, databaseName, collectionName);
    
    // Pipeline should already be in MongoDB format from the frontend
    // No need to convert again - frontend already converts it
    const mongoPipeline = pipeline;

    console.log('Executing pipeline:', JSON.stringify(mongoPipeline, null, 2));

    const startTime = Date.now();
    const documents = await collection.aggregate(mongoPipeline).toArray();
    const executionTime = Date.now() - startTime;

    // Serialize documents to ensure ObjectId, Date, etc. are properly converted
    const serializedDocuments = documents.map(doc => serializeDocument(doc));

    console.log(`Aggregation completed: ${serializedDocuments.length} documents returned`);

    return NextResponse.json({
      documents: serializedDocuments,
      executionTime,
      count: serializedDocuments.length,
    });
  } catch (error: any) {
    console.error('Aggregation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute aggregation pipeline' },
      { status: 500 }
    );
  }
}

