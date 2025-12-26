import { NextRequest, NextResponse } from 'next/server';
import { getCollection, getDatabase } from '@/lib/mongodb';

// GET - Get collection validation rules
export async function POST(request: NextRequest) {
  try {
    const { connectionString, databaseName, collectionName } = await request.json();

    if (!connectionString || !databaseName || !collectionName) {
      return NextResponse.json(
        { error: 'Connection string, database name, and collection name are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase(connectionString, databaseName);
    const collectionInfo = await db.listCollections({ name: collectionName }).toArray();
    
    if (collectionInfo.length === 0) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const options = collectionInfo[0].options || {};
    const validator = options.validator || {};
    const validationLevel = options.validationLevel || 'strict';
    const validationAction = options.validationAction || 'error';

    return NextResponse.json({ 
      validator,
      validationLevel,
      validationAction,
      hasValidation: !!validator && Object.keys(validator).length > 0
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch validation rules' },
      { status: 500 }
    );
  }
}

// PUT - Set collection validation rules
export async function PUT(request: NextRequest) {
  try {
    const { connectionString, databaseName, collectionName, validator, validationLevel, validationAction } = await request.json();

    if (!connectionString || !databaseName || !collectionName) {
      return NextResponse.json(
        { error: 'Connection string, database name, and collection name are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase(connectionString, databaseName);
    
    // Build collMod command
    const collModCommand: any = {
      collMod: collectionName,
    };

    // Only set validator if it's not empty
    if (validator && Object.keys(validator).length > 0) {
      collModCommand.validator = validator;
    } else {
      collModCommand.validator = {};
    }

    // Set validation level and action
    if (validationLevel) {
      collModCommand.validationLevel = validationLevel;
    }
    if (validationAction) {
      collModCommand.validationAction = validationAction;
    }

    const result = await db.command(collModCommand);

    return NextResponse.json({ 
      success: true,
      result 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update validation rules' },
      { status: 500 }
    );
  }
}

// DELETE - Remove validation rules
export async function DELETE(request: NextRequest) {
  try {
    const { connectionString, databaseName, collectionName } = await request.json();

    if (!connectionString || !databaseName || !collectionName) {
      return NextResponse.json(
        { error: 'Connection string, database name, and collection name are required' },
        { status: 400 }
      );
    }

    const db = await getDatabase(connectionString, databaseName);
    
    // Remove validation by setting empty validator
    const result = await db.command({
      collMod: collectionName,
      validator: {},
    });

    return NextResponse.json({ 
      success: true,
      result 
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to remove validation rules' },
      { status: 500 }
    );
  }
}

