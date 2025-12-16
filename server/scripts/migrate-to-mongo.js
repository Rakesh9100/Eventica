import { connectDB } from '../config/database.js';
import fs from 'fs';
import path from 'path';

const migrateEventsToMongo = async () => {
  try {
    console.log('🚀 Starting migration to MongoDB...');
    
    // Connect to MongoDB
    const db = await connectDB();
    const eventsCollection = db.collection('events');
    
    // Read existing events.json
    const eventsPath = path.join(process.cwd(), 'events.json');
    const eventsData = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
    
    console.log(`📖 Found ${eventsData.length} events in events.json`);
    
    // Check if events already exist in MongoDB
    const existingCount = await eventsCollection.countDocuments();
    if (existingCount > 0) {
      console.log(`⚠️  MongoDB already has ${existingCount} events. Skipping migration.`);
      console.log('💡 If you want to re-migrate, delete the events collection first.');
      return;
    }
    
    // Add metadata to each event
    const eventsWithMetadata = eventsData.map(event => ({
      ...event,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Insert all events
    const result = await eventsCollection.insertMany(eventsWithMetadata);
    
    console.log(`✅ Successfully migrated ${result.insertedCount} events to MongoDB!`);
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateEventsToMongo();
}

export { migrateEventsToMongo };