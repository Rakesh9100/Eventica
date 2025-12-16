import { MongoClient } from 'mongodb';

class MongoDB {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.isConnected && this.db) {
        return this.db;
      }

      const uri = process.env.MONGODB_URI;
      if (!uri) {
        throw new Error('MONGODB_URI environment variable is required');
      }

      console.log('🔗 Connecting to MongoDB Atlas...');
      
      this.client = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      await this.client.connect();
      this.db = this.client.db('eventica');
      this.isConnected = true;

      console.log('✅ Connected to MongoDB Atlas successfully');
      return this.db;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  async getCollection(name) {
    const db = await this.connect();
    return db.collection(name);
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.isConnected = false;
      console.log('🔌 MongoDB connection closed');
    }
  }

  async healthCheck() {
    try {
      const db = await this.connect();
      await db.admin().ping();
      return { status: 'healthy', connected: true };
    } catch (error) {
      return { status: 'unhealthy', connected: false, error: error.message };
    }
  }
}

// Create singleton instance
const mongodb = new MongoDB();

export default mongodb;