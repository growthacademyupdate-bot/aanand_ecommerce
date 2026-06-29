import { MongoClient } from 'mongodb';

type MongoCache = {
  clientPromises?: Map<string, Promise<MongoClient>>;
};

const globalForMongo = globalThis as typeof globalThis & MongoCache;

// Extract database name from MONGODB_URI
export function getDatabaseName(): string {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/morepankh_6th_may';
  const lastSegment = uri.split('/').pop() || '';
  const withoutQuery = lastSegment.split('?')[0];
  const dbName = withoutQuery.trim();
  return dbName || 'morepankh_6th_may';
}

export async function getMongoClient(uri: string) {
  if (!globalForMongo.clientPromises) {
    globalForMongo.clientPromises = new Map();
  }

  const existing = globalForMongo.clientPromises.get(uri);
  if (existing) {
    return existing;
  }

  const clientPromise = (async () => {
    const client = new MongoClient(uri, {
      // Keep pool small per Vercel serverless instance to avoid Atlas connection spikes
      maxPoolSize: 1,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 20_000,
      connectTimeoutMS: 20_000,
    });

    await client.connect();
    return client;
  })().catch((error) => {
    globalForMongo.clientPromises?.delete(uri);
    throw error;
  });

  globalForMongo.clientPromises.set(uri, clientPromise);
  return clientPromise;
}

export async function getDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/morepankh_6th_may';
  const client = await getMongoClient(uri);
  return client.db(getDatabaseName());
}
