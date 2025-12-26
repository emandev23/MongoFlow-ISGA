import { NextRequest, NextResponse } from 'next/server';
import { getCollection, getDatabase } from '@/lib/mongodb';

// GET - List all indexes
export async function POST(request: NextRequest) {
  try {
    const { connectionString, databaseName, collectionName } = await request.json();

    if (!connectionString || !databaseName || !collectionName) {
      return NextResponse.json(
        { error: 'Connection string, database name, and collection name are required' },
        { status: 400 }
      );
    }

    const collection = await getCollection(connectionString, databaseName, collectionName);
    const indexes = await collection.indexes();

    // Format indexes for frontend
    const formattedIndexes = indexes.map((idx: any) => ({
      name: idx.name,
      key: idx.key,
      unique: idx.unique || false,
      sparse: idx.sparse || false,
      background: idx.background || false,
      expireAfterSeconds: idx.expireAfterSeconds,
      partialFilterExpression: idx.partialFilterExpression,
      weights: idx.weights,
      default_language: idx.default_language,
      textIndexVersion: idx.textIndexVersion,
      '2dsphereIndexVersion': idx['2dsphereIndexVersion'],
      bits: idx.bits,
      min: idx.min,
      max: idx.max,
      v: idx.v,
    }));

    return NextResponse.json({ 
      indexes: formattedIndexes,
      count: formattedIndexes.length 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch indexes' },
      { status: 500 }
    );
  }
}

// PUT - Create a new index
export async function PUT(request: NextRequest) {
  try {
    const { connectionString, databaseName, collectionName, index } = await request.json();

    if (!connectionString || !databaseName || !collectionName || !index) {
      return NextResponse.json(
        { error: 'Connection string, database name, collection name, and index are required' },
        { status: 400 }
      );
    }

    if (!index.key || Object.keys(index.key).length === 0) {
      return NextResponse.json(
        { error: 'Index key is required' },
        { status: 400 }
      );
    }

    const collection = await getCollection(connectionString, databaseName, collectionName);
    
    // Build index options
    const indexOptions: any = {};
    if (index.name) indexOptions.name = index.name;
    if (index.unique) indexOptions.unique = true;
    if (index.sparse) indexOptions.sparse = true;
    if (index.background) indexOptions.background = true;
    if (index.expireAfterSeconds !== undefined) indexOptions.expireAfterSeconds = index.expireAfterSeconds;
    if (index.partialFilterExpression) indexOptions.partialFilterExpression = index.partialFilterExpression;

    const result = await collection.createIndex(index.key, indexOptions);

    return NextResponse.json({ 
      success: true,
      indexName: result 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create index' },
      { status: 500 }
    );
  }
}

// DELETE - Drop an index
export async function DELETE(request: NextRequest) {
  try {
    const { connectionString, databaseName, collectionName, indexName } = await request.json();

    if (!connectionString || !databaseName || !collectionName || !indexName) {
      return NextResponse.json(
        { error: 'Connection string, database name, collection name, and index name are required' },
        { status: 400 }
      );
    }

    // Prevent dropping _id_ index
    if (indexName === '_id_') {
      return NextResponse.json(
        { error: 'Cannot drop the _id_ index' },
        { status: 400 }
      );
    }

    const collection = await getCollection(connectionString, databaseName, collectionName);
    const result = await collection.dropIndex(indexName);

    return NextResponse.json({ 
      success: true,
      result 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete index' },
      { status: 500 }
    );
  }
}

