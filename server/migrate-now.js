import mongodb from './config/mongodb.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrateEvents = async () => {
  try {
    console.log('🚀 Starting event migration to MongoDB Atlas...');
    
    // Read events.json from the root directory
    const eventsPath = path.join(__dirname, '..', 'events.json');
    
    if (!fs.existsSync(eventsPath)) {
      console.log('❌ events.json not found at:', eventsPath);
      return;
    }
    
    const eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
    console.log(`📖 Found ${eventsData.length} events to migrate`);
    
    // Get events collection
    const collection = await mongodb.getCollection('events');
    
    // Check if events already exist
    const existingCount = await collection.countDocuments();
    console.log(`📊 Current events in database: ${existingCount}`);
    
    if (existingCount > 0) {
      console.log('⚠️  Database already contains events.');
      console.log('🔄 Clearing existing events...');
      await collection.deleteMany({});
    }
    
    // Prepare events with proper IDs and metadata
    const eventsWithMetadata = eventsData.map((event, index) => ({
      ...event,
      id: event.id || (index + 1).toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Insert events in batches
    console.log('💾 Inserting events into MongoDB Atlas...');
    const result = await collection.insertMany(eventsWithMetadata);
    
    console.log(`✅ Successfully migrated ${result.insertedCount} events!`);
    
    // Verify the migration
    const finalCount = await collection.countDocuments();
    console.log(`🎉 Total events in database: ${finalCount}`);
    
    // Show sample events
    const sampleEvents = await collection.find({}).limit(3).toArray();
    console.log('📋 Sample events:');
    sampleEvents.forEach(event => {
      console.log(`  - ${event.title} (${event.date})`);
    });
    
    console.log('✨ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongodb.close();
  }
};

// Run migration
migrateEvents();