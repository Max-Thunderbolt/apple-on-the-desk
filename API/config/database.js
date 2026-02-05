// Database configuration
const { MongoClient } = require('mongodb');

let client = null;
let db = null;

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db('main');
    console.log('MongoDB connected successfully');
    return { client, db };
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
};

const getClient = () => {
  if (!client) {
    throw new Error('MongoDB client not connected. Call connectDB() first.');
  }
  return client;
};

const closeDB = async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
};

module.exports = {
  connectDB,
  getDB,
  getClient,
  closeDB
};
