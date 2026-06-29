const { MongoClient } = require('mongodb');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');
const mongoUriLine = env.split('\n').find(line => line.startsWith('MONGODB_URI='));
const uri = mongoUriLine ? mongoUriLine.substring('MONGODB_URI='.length).trim() : null;

if (!uri) {
  console.error("MONGODB_URI not found in .env");
  process.exit(1);
}

const client = new MongoClient(uri);
async function run() {
  try {
    console.log("Attempting to connect to MongoDB...");
    await client.connect();
    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log("✅ Successfully connected to MongoDB!");
    console.log("Collections in database:", collections.map(c => c.name));
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
  } finally {
    await client.close();
  }
}
run();
