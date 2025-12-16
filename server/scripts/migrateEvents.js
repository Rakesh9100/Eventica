import mongodb from '../config/mongodb.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrateEvents = async () => {
  try {
    console.log('🚀 Starting event migration to MongoDB...');
    
    // Read events.json from the root directory
    const eventsPath = path.join(__dirname, '..', '..', 'events.json');
    
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
    console.log('💾 Inserting events into MongoDB...');
    const result = await collection.insertMany(eventsWithMetadata);
    
    console.log(`✅ Successfully migrated ${result.insertedCount} events!`);
    
    // Verify the migration
    const finalCount = await collection.countDocuments();
    console.log(`🎉 Total events in database: ${finalCount}`);
    
    // Show sample event
    const sampleEvent = await collection.findOne({});
    if (sampleEvent) {
      console.log('📋 Sample event:', {
        id: sampleEvent.id,
        title: sampleEvent.title,
        date: sampleEvent.date
      });
    }
    
    console.log('✨ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongodb.close();
  }
};

// Run migration
migrateEvents();