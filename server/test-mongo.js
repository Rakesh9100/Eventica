import { connectDB } from './config/database.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testConnection = async () => {
  try {
    console.log('🔗 Testing MongoDB connection...');
    console.log('📍 MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    const db = await connectDB();
    console.log('✅ Connected successfully!');
    
    // Test basic operations
    const eventsCollection = db.collection('events');
    const count = await eventsCollection.countDocuments();
    console.log(`📊 Current events in database: ${count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
};

testConnection();