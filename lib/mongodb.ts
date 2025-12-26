import { MongoClient, Db, Collection } from 'mongodb';

let client: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToMongoDB(connectionString: string): Promise<MongoClient> {
  if (client) {
    return client;
  }

  try {
    client = new MongoClient(connectionString);
    await client.connect();
    return client;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function getDatabase(connectionString: string, dbName: string): Promise<Db> {
  const client = await connectToMongoDB(connectionString);
  return client.db(dbName);
}

export async function getCollection(
  connectionString: string,
  dbName: string,
  collectionName: string
): Promise<Collection> {
  const db = await getDatabase(connectionString, dbName);
  return db.collection(collectionName);
}

export async function disconnectMongoDB(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    cachedDb = null;
  }
}

