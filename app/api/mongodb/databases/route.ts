import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { connectionString } = await request.json();

    if (!connectionString) {
      return NextResponse.json(
        { error: 'Connection string is required' },
        { status: 400 }
      );
    }

    const client = await connectToMongoDB(connectionString);
    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();

    const databasesWithCollections = await Promise.all(
      databases.map(async (db) => {
        const dbInstance = client.db(db.name);
        const collections = await dbInstance.listCollections().toArray();
        
        const collectionsWithCounts = await Promise.all(
          collections.map(async (coll) => {
            const count = await dbInstance.collection(coll.name).countDocuments();
            return {
              name: coll.name,
              count,
            };
          })
        );

        return {
          name: db.name,
          sizeOnDisk: db.sizeOnDisk,
          empty: db.empty,
          collections: collectionsWithCounts,
        };
      })
    );

    return NextResponse.json({ databases: databasesWithCollections });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch databases' },
      { status: 500 }
    );
  }
}

