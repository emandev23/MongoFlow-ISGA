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
    
    // Test connection by listing databases
    const adminDb = client.db().admin();
    const { databases } = await adminDb.listDatabases();

    return NextResponse.json({
      success: true,
      databases: databases.map(db => ({
        name: db.name,
        sizeOnDisk: db.sizeOnDisk,
        empty: db.empty,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to connect to MongoDB' },
      { status: 500 }
    );
  }
}

