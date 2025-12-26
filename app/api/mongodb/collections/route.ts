import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { connectionString, databaseName } = await request.json();

    if (!connectionString || !databaseName) {
      return NextResponse.json(
        { error: 'Connection string and database name are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase(connectionString, databaseName);
    const collections = await db.listCollections().toArray();

    const collectionsWithCounts = await Promise.all(
      collections.map(async (coll) => {
        const count = await db.collection(coll.name).countDocuments();
        return {
          name: coll.name,
          count,
        };
      })
    );

    return NextResponse.json({ collections: collectionsWithCounts });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

