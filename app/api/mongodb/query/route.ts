import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { 
      connectionString, 
      databaseName, 
      collectionName, 
      query, 
      projection,
      limit = 100,
      skip = 0 
    } = await request.json();

    if (!connectionString || !databaseName || !collectionName) {
      return NextResponse.json(
        { error: 'Connection string, database name, and collection name are required' },
        { status: 400 }
      );
    }

    const collection = await getCollection(connectionString, databaseName, collectionName);
    
    // Parse query if it's a string
    let parsedQuery = {};
    if (query) {
      try {
        parsedQuery = typeof query === 'string' ? JSON.parse(query) : query;
      } catch (e) {
        parsedQuery = {};
      }
    }

    // Build query with projection, skip, and limit
    let findQuery = collection.find(parsedQuery);
    
    if (projection && Object.keys(projection).length > 0) {
      findQuery = findQuery.project(projection);
    }
    
    if (skip > 0) {
      findQuery = findQuery.skip(skip);
    }
    
    if (limit > 0) {
      findQuery = findQuery.limit(limit);
    }

    const documents = await findQuery.toArray();

    return NextResponse.json({ documents });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to execute query' },
      { status: 500 }
    );
  }
}

