import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';

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
    
    // Pipeline is already in MongoDB format from the frontend (e.g., { $match: {...} })
    // But we need to handle both formats: { type, config } and { $match: {...} }
    const mongoPipeline = pipeline.map(stage => {
      // If stage already has MongoDB format keys (like $match, $group, etc.)
      if (stage.$match || stage.$group || stage.$sort || stage.$limit || stage.$skip || 
          stage.$project || stage.$unwind || stage.$lookup || stage.$addFields || stage.$count) {
        return stage; // Already in MongoDB format
      }
      
      // Otherwise, convert from { type, config } format
      if (stage.type && stage.config !== undefined) {
      const stageObj: any = {};
      stageObj[stage.type] = stage.config;
      return stageObj;
      }
      
      // If neither format, return as-is (might already be correct)
      return stage;
    });

    console.log('Executing pipeline:', JSON.stringify(mongoPipeline, null, 2));

    const startTime = Date.now();
    const documents = await collection.aggregate(mongoPipeline).toArray();
    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      documents,
      executionTime,
      count: documents.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to execute aggregation pipeline' },
      { status: 500 }
    );
  }
}

