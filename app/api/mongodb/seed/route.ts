import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { generateSeedData } from '@/lib/seedData';
import { MongoClient, ObjectId } from 'mongodb';

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
    const seedCollections = generateSeedData();
    
    // Create ObjectId maps for relationships (map original string IDs to ObjectIds)
    const userIdMap = new Map<string, ObjectId>();
    const productIdMap = new Map<string, ObjectId>();
    
    // First pass: process users and products to build ID maps
    const usersCollection = seedCollections.find(c => c.name === 'users');
    const productsCollection = seedCollections.find(c => c.name === 'products');
    
    if (usersCollection) {
      usersCollection.documents.forEach((doc: any) => {
        if (doc._id && typeof doc._id === 'string') {
          userIdMap.set(doc._id, new ObjectId());
        }
      });
    }
    
    if (productsCollection) {
      productsCollection.documents.forEach((doc: any) => {
        if (doc._id && typeof doc._id === 'string') {
          productIdMap.set(doc._id, new ObjectId());
        }
      });
    }
    
    // Second pass: process all collections with proper ObjectIds and relationships
    const processedCollections = seedCollections.map(collectionData => {
      const processedDocs = collectionData.documents.map((doc: any) => {
        const processedDoc: any = { ...doc };
        
        // Convert _id to ObjectId
        if (collectionData.name === 'users' && doc._id && typeof doc._id === 'string') {
          processedDoc._id = userIdMap.get(doc._id)!;
        } else if (collectionData.name === 'products' && doc._id && typeof doc._id === 'string') {
          processedDoc._id = productIdMap.get(doc._id)!;
        } else {
          processedDoc._id = new ObjectId();
        }
        
        // Replace userId references
        if (doc.userId && typeof doc.userId === 'string' && userIdMap.has(doc.userId)) {
          processedDoc.userId = userIdMap.get(doc.userId);
        }
        
        // Replace productId references
        if (doc.productId && typeof doc.productId === 'string' && productIdMap.has(doc.productId)) {
          processedDoc.productId = productIdMap.get(doc.productId);
        }
        
        // Replace items.productId in orders
        if (doc.items && Array.isArray(doc.items)) {
          processedDoc.items = doc.items.map((item: any) => {
            if (item.productId && typeof item.productId === 'string' && productIdMap.has(item.productId)) {
              return { ...item, productId: productIdMap.get(item.productId) };
            }
            return item;
          });
        }
        
        return processedDoc;
      });
      
      return {
        name: collectionData.name,
        documents: processedDocs,
      };
    });
    
    const results = [];
    
    for (const collectionData of processedCollections) {
      try {
        const collection = db.collection(collectionData.name);
        
        // Drop existing collection if it exists and has data
        const count = await collection.countDocuments();
        if (count > 0) {
          await collection.deleteMany({});
        }
        
        // Insert seed data
        if (collectionData.documents.length > 0) {
          // Insert in batches to avoid issues
          const batchSize = 1000;
          for (let i = 0; i < collectionData.documents.length; i += batchSize) {
            const batch = collectionData.documents.slice(i, i + batchSize);
            await collection.insertMany(batch, { ordered: false });
          }
        }
        
        const finalCount = await collection.countDocuments();
        
        results.push({
          collection: collectionData.name,
          inserted: collectionData.documents.length,
          total: finalCount,
          success: true,
        });
      } catch (error: any) {
        console.error(`Error seeding collection ${collectionData.name}:`, error);
        results.push({
          collection: collectionData.name,
          error: error.message || 'Unknown error',
          success: false,
        });
      }
    }

    const totalInserted = results.reduce((sum, r) => sum + (r.inserted || 0), 0);
    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${successCount} collections with ${totalInserted} documents`,
      results,
      summary: {
        collections: seedCollections.length,
        totalDocuments: totalInserted,
        successful: successCount,
        failed: seedCollections.length - successCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to seed database' },
      { status: 500 }
    );
  }
}

