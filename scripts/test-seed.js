const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');

// Import the seed data generator
// Since it's TypeScript, we'll recreate the logic here
function generateSeedData() {
  const now = new Date();
  
  function generateObjectId() {
    const timestamp = Math.floor(new Date().getTime() / 1000).toString(16);
    const objectId = timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => {
      return Math.floor(Math.random() * 16).toString(16);
    }).toLowerCase();
    return objectId;
  }

  // Users collection
  const users = Array.from({ length: 150 }, (_, i) => ({
    _id: generateObjectId(),
    email: `user${i + 1}@example.com`,
    firstName: ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa'][i % 8],
    lastName: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'][i % 8],
    age: 20 + (i % 50),
    isActive: i % 10 !== 0,
    role: ['customer', 'admin', 'moderator', 'customer', 'customer'][i % 5],
    createdAt: new Date(now.getTime() - (i * 86400000)),
    lastLogin: new Date(now.getTime() - ((i % 30) * 3600000)),
    address: {
      street: `${100 + i} Main St`,
      city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][i % 5],
      state: ['NY', 'CA', 'IL', 'TX', 'AZ'][i % 5],
      zipCode: 10000 + i,
      country: 'USA',
    },
    balance: parseFloat((Math.random() * 10000).toFixed(2)),
    ordersCount: i % 20,
  }));

  // Products collection
  const products = Array.from({ length: 200 }, (_, i) => ({
    _id: generateObjectId(),
    name: [
      'Laptop Pro 15"', 'Wireless Mouse', 'Mechanical Keyboard', 'USB-C Hub',
      'Monitor 27"', 'Webcam HD', 'Headphones Wireless', 'Tablet 10"',
    ][i % 8] + (i > 7 ? ` ${Math.floor(i / 8) + 1}` : ''),
    sku: `SKU-${String(i + 1).padStart(6, '0')}`,
    price: parseFloat((Math.random() * 2000 + 10).toFixed(2)),
    category: ['Electronics', 'Accessories', 'Computers', 'Peripherals', 'Storage'][i % 5],
    inStock: i % 10 !== 0,
    quantity: Math.floor(Math.random() * 500),
  }));

  return [
    { name: 'users', documents: users },
    { name: 'products', documents: products },
  ];
}

async function testSeed() {
  const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const databaseName = process.argv[2] || 'sample_db';

  console.log(`Connecting to MongoDB: ${connectionString}`);
  console.log(`Database: ${databaseName}`);
  console.log('');

  try {
    const client = new MongoClient(connectionString);
    await client.connect();
    console.log('✓ Connected to MongoDB');

    const db = client.db(databaseName);
    const seedCollections = generateSeedData();

    // Create ObjectId maps
    const userIdMap = new Map();
    const productIdMap = new Map();

    const usersCollection = seedCollections.find(c => c.name === 'users');
    const productsCollection = seedCollections.find(c => c.name === 'products');

    if (usersCollection) {
      usersCollection.documents.forEach((doc) => {
        if (doc._id && typeof doc._id === 'string') {
          userIdMap.set(doc._id, new ObjectId());
        }
      });
    }

    if (productsCollection) {
      productsCollection.documents.forEach((doc) => {
        if (doc._id && typeof doc._id === 'string') {
          productIdMap.set(doc._id, new ObjectId());
        }
      });
    }

    // Process collections
    const processedCollections = seedCollections.map(collectionData => {
      const processedDocs = collectionData.documents.map((doc) => {
        const processedDoc = { ...doc };

        if (collectionData.name === 'users' && doc._id && typeof doc._id === 'string') {
          processedDoc._id = userIdMap.get(doc._id);
        } else if (collectionData.name === 'products' && doc._id && typeof doc._id === 'string') {
          processedDoc._id = productIdMap.get(doc._id);
        } else {
          processedDoc._id = new ObjectId();
        }

        return processedDoc;
      });

      return {
        name: collectionData.name,
        documents: processedDocs,
      };
    });

    // Insert data
    for (const collectionData of processedCollections) {
      try {
        const collection = db.collection(collectionData.name);
        
        // Clear existing data
        const count = await collection.countDocuments();
        if (count > 0) {
          await collection.deleteMany({});
          console.log(`  Cleared ${count} existing documents from ${collectionData.name}`);
        }

        // Insert new data
        if (collectionData.documents.length > 0) {
          const batchSize = 1000;
          for (let i = 0; i < collectionData.documents.length; i += batchSize) {
            const batch = collectionData.documents.slice(i, i + batchSize);
            await collection.insertMany(batch, { ordered: false });
          }
        }

        const finalCount = await collection.countDocuments();
        console.log(`✓ ${collectionData.name}: Inserted ${collectionData.documents.length} documents (Total: ${finalCount})`);
      } catch (error) {
        console.error(`✗ Error seeding ${collectionData.name}:`, error.message);
      }
    }

    // Verify
    console.log('');
    console.log('Verification:');
    for (const collectionData of processedCollections) {
      const collection = db.collection(collectionData.name);
      const count = await collection.countDocuments();
      const sample = await collection.findOne({});
      console.log(`  ${collectionData.name}: ${count} documents`);
      if (sample) {
        console.log(`    Sample document keys: ${Object.keys(sample).join(', ')}`);
      }
    }

    await client.close();
    console.log('');
    console.log('✓ Seeding completed successfully!');
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testSeed();

