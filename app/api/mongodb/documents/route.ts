import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const { connectionString, databaseName, collectionName, query, limit = 100, skip = 0 } = await request.json();

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

    const documents = await collection
      .find(parsedQuery)
      .sort({ _id: -1 }) // Sort by _id descending (newest first)
      .limit(limit)
      .skip(skip)
      .toArray();

    const totalCount = await collection.countDocuments(parsedQuery);

    return NextResponse.json({
      documents,
      totalCount,
      limit,
      skip,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { connectionString, databaseName, collectionName, document } = await request.json();

    if (!connectionString || !databaseName || !collectionName || !document) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const collection = await getCollection(connectionString, databaseName, collectionName);
    
    // If document has _id, update; otherwise insert
    if (document._id) {
      const { _id, ...updateData } = document;
      
      // Convert string _id to ObjectId if needed
      let objectId: any;
      if (typeof _id === 'string') {
        // Check if it's a valid ObjectId string
        if (ObjectId.isValid(_id)) {
          objectId = new ObjectId(_id);
        } else {
          // If not a valid ObjectId, try using it as-is (might be a custom _id)
          objectId = _id;
        }
      } else if (_id && typeof _id === 'object' && _id.toString) {
        // Already an ObjectId object
        objectId = _id;
      } else {
        objectId = _id;
      }
      
      const result = await collection.updateOne(
        { _id: objectId },
        { $set: updateData }
      );
      
      console.log('Update result:', {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        objectId: objectId.toString ? objectId.toString() : objectId
      });
      
      return NextResponse.json({ 
        success: true, 
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
        insertedId: result.upsertedId ? result.upsertedId.toString() : null
      });
    } else {
      const result = await collection.insertOne(document);
      return NextResponse.json({ 
        success: true, 
        insertedId: result.insertedId.toString() 
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to save document' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { connectionString, databaseName, collectionName, documentId } = await request.json();

    if (!connectionString || !databaseName || !collectionName || !documentId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const collection = await getCollection(connectionString, databaseName, collectionName);
    
    // Convert string _id to ObjectId if needed
    let objectId: any;
    if (typeof documentId === 'string') {
      // Check if it's a valid ObjectId string
      if (ObjectId.isValid(documentId)) {
        objectId = new ObjectId(documentId);
      } else {
        // If not a valid ObjectId, try using it as-is (might be a custom _id)
        objectId = documentId;
      }
    } else if (documentId && typeof documentId === 'object' && documentId.toString) {
      // Already an ObjectId object
      objectId = documentId;
    } else {
      objectId = documentId;
    }
    
    const result = await collection.deleteOne({ _id: objectId });

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount 
    });
  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete document' },
      { status: 500 }
    );
  }
}

