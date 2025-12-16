import mongodb from './config/mongodb.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testLocalConnection = async () => {
  try {
    console.log('🔗 Testing local MongoDB connection...');
    console.log('📍 MONGODB_URI exists:', !!process.env.MONGODB_URI);
    console.log('📍 MONGODB_URI preview:', process.env.MONGODB_URI?.substring(0, 50) + '...');
    
    // Test connection
    const db = await mongodb.connect();
    console.log('✅ Connected successfully to MongoDB Atlas!');
    
    // Test basic operations
    const eventsCollection = await mongodb.getCollection('events');
    const count = await eventsCollection.countDocuments();
    console.log(`📊 Current events in database: ${count}`);
    
    // Test health check
    const health = await mongodb.healthCheck();
    console.log('🏥 Health check:', health);
    
    // Show sample event
    if (count > 0) {
      const sampleEvent = await eventsCollection.findOne({});
      console.log('📋 Sample event:', {
        id: sampleEvent.id,
        title: sampleEvent.title,
        date: sampleEvent.date
      });
    }
    
    console.log('🎉 Local MongoDB connection test successful!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.error('💡 Make sure to update the MONGODB_URI in server/.env with your actual password');
  } finally {
    await mongodb.close();
    process.exit(0);
  }
};

testLocalConnection();