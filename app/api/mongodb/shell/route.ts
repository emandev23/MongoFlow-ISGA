import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

// Simple MongoDB shell command parser and executor
// This is a basic implementation that handles common MongoDB shell commands
export async function POST(request: NextRequest) {
  try {
    const { connectionString, databaseName, collectionName, command } = await request.json();

    if (!connectionString || !databaseName || !command) {
      return NextResponse.json(
        { error: 'Connection string, database name, and command are required' },
        { status: 400 }
      );
    }

    let client: MongoClient | null = null;
    try {
      client = new MongoClient(connectionString);
      await client.connect();
      const db = client.db(databaseName);
      const collection = collectionName ? db.collection(collectionName) : null;

      // Parse and execute the command
      const result = await executeMongoCommand(db, collection, command, collectionName);

      return NextResponse.json({ result });
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Failed to execute command' },
        { status: 500 }
      );
    } finally {
      if (client) {
        await client.close();
      }
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Invalid request' },
      { status: 400 }
    );
  }
}

// Helper function to evaluate JavaScript expressions safely
function evaluateJSExpression(expr: string): any {
  // For expressions with new Date(), we need to evaluate them
  // Create a safe evaluation context
  try {
    // Use Function constructor for safer evaluation
    const func = new Function('return ' + expr);
    return func();
  } catch (e) {
    // If evaluation fails, try JSON.parse as fallback
    try {
      return JSON.parse(expr);
    } catch {
      throw e;
    }
  }
}

// Helper function to extract balanced parentheses content
function extractBalancedContent(str: string, startPos: number): { content: string; endPos: number } | null {
  let depth = 0;
  let start = startPos;
  let i = startPos;
  
  if (str[i] !== '(') return null;
  
  depth = 1;
  i++;
  
  while (i < str.length && depth > 0) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')') depth--;
    i++;
  }
  
  if (depth === 0) {
    return {
      content: str.substring(start + 1, i - 1),
      endPos: i
    };
  }
  
  return null;
}

async function executeMongoCommand(
  db: any,
  collection: any,
  command: string,
  defaultCollectionName: string
): Promise<any> {
  const trimmed = command.trim();
  
  // Handle multiple commands separated by semicolons
  if (trimmed.includes(';') && !trimmed.match(/;\s*$/)) {
    const commands = trimmed.split(';').map(c => c.trim()).filter(c => c);
    const results: any[] = [];
    let lastResult: any = null;
    
    for (const cmd of commands) {
      try {
        lastResult = await executeMongoCommand(db, collection, cmd, defaultCollectionName);
        results.push(lastResult);
      } catch (error: any) {
        return { error: `Error in command "${cmd}": ${error.message}` };
      }
    }
    
    return lastResult; // Return the last result
  }

  // Handle db.collection.find() commands
  if (trimmed.includes('.find(')) {
    const collectionMatch = trimmed.match(/db\.(\w+)\.find\(/);
    const collName = collectionMatch ? collectionMatch[1] : defaultCollectionName;
    const coll = db.collection(collName);

    // Extract query, projection, and methods
    const findMatch = trimmed.match(/\.find\(([^)]*)\)/);
    let query = {};
    let projection: any = null;
    let limit = 0;
    let skip = 0;
    let sort: any = null;

    if (findMatch && findMatch[1].trim()) {
      try {
        query = JSON.parse(findMatch[1]);
      } catch {
        // If parsing fails, try to extract basic queries
        const queryStr = findMatch[1].trim();
        if (queryStr && queryStr !== '') {
          try {
            query = eval(`(${queryStr})`);
          } catch {
            query = {};
          }
        }
      }
    }

    // Parse chained methods
    if (trimmed.includes('.limit(')) {
      const limitMatch = trimmed.match(/\.limit\((\d+)\)/);
      if (limitMatch) limit = parseInt(limitMatch[1], 10);
    }

    if (trimmed.includes('.skip(')) {
      const skipMatch = trimmed.match(/\.skip\((\d+)\)/);
      if (skipMatch) skip = parseInt(skipMatch[1], 10);
    }

    if (trimmed.includes('.sort(')) {
      const sortMatch = trimmed.match(/\.sort\(([^)]+)\)/);
      if (sortMatch) {
        try {
          sort = JSON.parse(sortMatch[1]);
        } catch {
          try {
            sort = eval(`(${sortMatch[1]})`);
          } catch {
            sort = null;
          }
        }
      }
    }

    if (trimmed.includes('.project(') || trimmed.includes('.projection(')) {
      const projMatch = trimmed.match(/\.(?:project|projection)\(([^)]+)\)/);
      if (projMatch) {
        try {
          projection = JSON.parse(projMatch[1]);
        } catch {
          try {
            projection = eval(`(${projMatch[1]})`);
          } catch {
            projection = null;
          }
        }
      }
    }

    let queryBuilder = coll.find(query);
    if (projection) queryBuilder = queryBuilder.project(projection);
    if (sort) queryBuilder = queryBuilder.sort(sort);
    if (skip > 0) queryBuilder = queryBuilder.skip(skip);
    if (limit > 0) queryBuilder = queryBuilder.limit(limit);

    const results = await queryBuilder.toArray();
    return results;
  }

  // Handle db.collection.aggregate() commands
  if (trimmed.includes('.aggregate(')) {
    const collectionMatch = trimmed.match(/db\.(\w+)\.aggregate\(/);
    const collName = collectionMatch ? collectionMatch[1] : defaultCollectionName;
    const coll = db.collection(collName);

    const aggMatch = trimmed.match(/\.aggregate\(([^)]+)\)/);
    if (aggMatch) {
      let pipeline: any[] = [];
      try {
        pipeline = JSON.parse(aggMatch[1]);
      } catch {
        try {
          pipeline = eval(`(${aggMatch[1]})`);
        } catch {
          return { error: 'Invalid aggregate pipeline syntax' };
        }
      }

      const results = await coll.aggregate(pipeline).toArray();
      return results;
    }
  }

  // Handle db.collection.countDocuments() or .count()
  if (trimmed.includes('.count(') || trimmed.includes('.countDocuments(')) {
    const collectionMatch = trimmed.match(/db\.(\w+)\.(?:count|countDocuments)\(/);
    const collName = collectionMatch ? collectionMatch[1] : defaultCollectionName;
    const coll = db.collection(collName);

    const countMatch = trimmed.match(/\.(?:count|countDocuments)\(([^)]*)\)/);
    let query = {};
    if (countMatch && countMatch[1].trim()) {
      try {
        query = JSON.parse(countMatch[1]);
      } catch {
        query = {};
      }
    }

    const count = await coll.countDocuments(query);
    return count;
  }

  // Handle db.collection.insertOne() or .insertMany()
  if (trimmed.includes('.insertOne(') || trimmed.includes('.insertMany(')) {
    const collectionMatch = trimmed.match(/db\.(\w+)\.insert(One|Many)\(/);
    if (!collectionMatch) {
      return { error: 'Invalid insert command syntax' };
    }
    
    const collName = collectionMatch[1] || defaultCollectionName;
    const coll = db.collection(collName);
    const insertType = collectionMatch[2];

    const insertStartPos = trimmed.indexOf(`.insert${insertType}(`);
    const contentResult = extractBalancedContent(trimmed, insertStartPos + `.insert${insertType}(`.length - 1);
    
    if (!contentResult) {
      return { error: 'Invalid insert document syntax: unbalanced parentheses' };
    }

    let doc: any;
    
    try {
      // First try JSON.parse for pure JSON
      doc = JSON.parse(contentResult.content);
    } catch {
      try {
        // If JSON.parse fails, evaluate as JavaScript (handles new Date(), etc.)
        doc = evaluateJSExpression(`(${contentResult.content})`);
      } catch (e: any) {
        return { error: `Invalid insert document syntax: ${e.message}` };
      }
    }

    if (insertType === 'One') {
      const result = await coll.insertOne(doc);
      return { insertedId: result.insertedId, insertedCount: 1 };
    } else {
      const docs = Array.isArray(doc) ? doc : [doc];
      const result = await coll.insertMany(docs);
      return { insertedIds: result.insertedIds, insertedCount: result.insertedCount };
    }
  }

  // Handle db.collection.updateOne() or .updateMany()
  if (trimmed.includes('.updateOne(') || trimmed.includes('.updateMany(')) {
    const collectionMatch = trimmed.match(/db\.(\w+)\.update(One|Many)\(/);
    if (!collectionMatch) {
      return { error: 'Invalid update command syntax' };
    }
    
    const collName = collectionMatch[1] || defaultCollectionName;
    const coll = db.collection(collName);
    const updateType = collectionMatch[2];

    const updateStartPos = trimmed.indexOf(`.update${updateType}(`);
    const contentResult = extractBalancedContent(trimmed, updateStartPos + `.update${updateType}(`.length - 1);
    
    if (!contentResult) {
      return { error: 'Invalid update syntax: unbalanced parentheses' };
    }

    // Parse the content to extract filter, update, and optional options
    const content = contentResult.content;
    let filter: any, update: any, options: any = {};
    
    // Find the comma that separates filter and update
    let commaPos = -1;
    let depth = 0;
    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{') depth++;
      else if (content[i] === '}') depth--;
      else if (content[i] === ',' && depth === 0) {
        commaPos = i;
        break;
      }
    }

    if (commaPos === -1) {
      return { error: 'Invalid update syntax: missing filter or update parameter' };
    }

    const filterStr = content.substring(0, commaPos).trim();
    const restStr = content.substring(commaPos + 1).trim();
    
    // Check if there's a third parameter (options)
    let updateStr = restStr;
    let optionsStr = '';
    let secondCommaPos = -1;
    depth = 0;
    for (let i = 0; i < restStr.length; i++) {
      if (restStr[i] === '{') depth++;
      else if (restStr[i] === '}') depth--;
      else if (restStr[i] === ',' && depth === 0) {
        secondCommaPos = i;
        break;
      }
    }

    if (secondCommaPos !== -1) {
      updateStr = restStr.substring(0, secondCommaPos).trim();
      optionsStr = restStr.substring(secondCommaPos + 1).trim();
    }

    try {
      // Try JSON.parse first
      filter = JSON.parse(filterStr);
      update = JSON.parse(updateStr);
      if (optionsStr) {
        options = JSON.parse(optionsStr);
      }
    } catch {
      try {
        // If JSON.parse fails, evaluate as JavaScript
        filter = evaluateJSExpression(`(${filterStr})`);
        update = evaluateJSExpression(`(${updateStr})`);
        if (optionsStr) {
          options = evaluateJSExpression(`(${optionsStr})`);
        }
      } catch (e: any) {
        return { error: `Invalid update syntax: ${e.message}` };
      }
    }

    if (updateType === 'One') {
      const result = await coll.updateOne(filter, update, options);
      return { 
        matchedCount: result.matchedCount, 
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId,
        upsertedCount: result.upsertedCount || 0
      };
    } else {
      const result = await coll.updateMany(filter, update, options);
      return { 
        matchedCount: result.matchedCount, 
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId,
        upsertedCount: result.upsertedCount || 0
      };
    }
  }

  // Handle db.collection.deleteOne() or .deleteMany()
  if (trimmed.includes('.deleteOne(') || trimmed.includes('.deleteMany(')) {
    const collectionMatch = trimmed.match(/db\.(\w+)\.delete(One|Many)\(/);
    const collName = collectionMatch ? collectionMatch[1] : defaultCollectionName;
    const coll = db.collection(collName);

    const deleteMatch = trimmed.match(/\.delete(One|Many)\(([^)]+)\)/);
    if (deleteMatch) {
      let filter: any;
      try {
        filter = JSON.parse(deleteMatch[2]);
      } catch {
        try {
          filter = eval(`(${deleteMatch[2]})`);
        } catch {
          return { error: 'Invalid delete filter syntax' };
        }
      }

      if (deleteMatch[1] === 'One') {
        const result = await coll.deleteOne(filter);
        return { deletedCount: result.deletedCount };
      } else {
        const result = await coll.deleteMany(filter);
        return { deletedCount: result.deletedCount };
      }
    }
  }

  // Handle db.collection.bulkWrite()
  if (trimmed.includes('.bulkWrite(')) {
    const collectionMatch = trimmed.match(/db\.(\w+)\.bulkWrite\(/);
    if (!collectionMatch) {
      return { error: 'Invalid bulkWrite command syntax' };
    }
    
    const collName = collectionMatch[1] || defaultCollectionName;
    const coll = db.collection(collName);

    const bulkWriteStartPos = trimmed.indexOf('.bulkWrite(');
    const contentResult = extractBalancedContent(trimmed, bulkWriteStartPos + '.bulkWrite('.length - 1);
    
    if (!contentResult) {
      return { error: 'Invalid bulkWrite syntax: unbalanced parentheses' };
    }

    let operations: any[];
    
    try {
      // Try JSON.parse first
      operations = JSON.parse(contentResult.content);
    } catch {
      try {
        // If JSON.parse fails, evaluate as JavaScript
        operations = evaluateJSExpression(`(${contentResult.content})`);
      } catch (e: any) {
        return { error: `Invalid bulkWrite operations syntax: ${e.message}` };
      }
    }

    if (!Array.isArray(operations)) {
      return { error: 'bulkWrite requires an array of operations' };
    }

    // Process operations to handle MongoDB driver format
    const processedOps = operations.map((op: any) => {
      if (op.insertOne) {
        return { insertOne: { document: op.insertOne.document || op.insertOne } };
      } else if (op.updateOne) {
        return {
          updateOne: {
            filter: op.updateOne.filter,
            update: op.updateOne.update,
            upsert: op.updateOne.upsert || false
          }
        };
      } else if (op.updateMany) {
        return {
          updateMany: {
            filter: op.updateMany.filter,
            update: op.updateMany.update,
            upsert: op.updateMany.upsert || false
          }
        };
      } else if (op.deleteOne) {
        return { deleteOne: { filter: op.deleteOne.filter || op.deleteOne } };
      } else if (op.deleteMany) {
        return { deleteMany: { filter: op.deleteMany.filter || op.deleteMany } };
      } else if (op.replaceOne) {
        return {
          replaceOne: {
            filter: op.replaceOne.filter,
            replacement: op.replaceOne.replacement,
            upsert: op.replaceOne.upsert || false
          }
        };
      }
      return op;
    });

    const result = await coll.bulkWrite(processedOps);
    return {
      insertedCount: result.insertedCount,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      deletedCount: result.deletedCount,
      upsertedCount: result.upsertedCount,
      upsertedIds: result.upsertedIds
    };
  }

  // Handle db.getCollectionNames() or show collections
  if (trimmed.includes('getCollectionNames') || trimmed.includes('show collections')) {
    const collections = await db.listCollections().toArray();
    return collections.map((c: any) => c.name);
  }

  // Handle db.stats()
  if (trimmed.includes('db.stats(') || trimmed === 'db.stats()') {
    const stats = await db.stats();
    return stats;
  }

  // Default: return error for unsupported commands
  return {
    error: 'Command not supported or invalid syntax. Supported commands: find, aggregate, count, insertOne, insertMany, updateOne, updateMany, deleteOne, deleteMany, bulkWrite, getCollectionNames, db.stats()',
  };
}

