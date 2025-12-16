import fs from 'fs';

const fixMigration = async () => {
  try {
    console.log('🔍 Analyzing migration discrepancy...');
    
    // Read events.json
    const eventsData = JSON.parse(fs.readFileSync('events.json', 'utf8'));
    console.log(`📖 Events in events.json: ${eventsData.length}`);
    
    // Get current database count
    const healthResponse = await fetch('http://localhost:3002/api/v1/event/health');
    const healthData = await healthResponse.json();
    console.log(`📊 Events in database: ${healthData.eventCount}`);
    
    // Get all events from database
    const dbResponse = await fetch('http://localhost:3002/api/v1/event/allevents');
    const dbEvents = await dbResponse.json();
    console.log(`📋 Retrieved ${dbEvents.length} events from database`);
    
    // Check for duplicate IDs in events.json
    const ids = eventsData.map(e => e.id);
    const uniqueIds = [...new Set(ids)];
    console.log(`🔢 Unique IDs in events.json: ${uniqueIds.length}`);
    console.log(`🔢 Total events in events.json: ${eventsData.length}`);
    
    if (uniqueIds.length !== eventsData.length) {
      console.log('⚠️  Found duplicate IDs in events.json!');
      
      // Find duplicates
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      console.log('🔍 Duplicate IDs:', [...new Set(duplicates)]);
    }
    
    // Check which events are missing from database
    const dbIds = new Set(dbEvents.map(e => e._id));
    const missingEvents = eventsData.filter(e => !dbIds.has(e.id));
    
    console.log(`❌ Missing events from database: ${missingEvents.length}`);
    
    if (missingEvents.length > 0) {
      console.log('📋 Missing events:');
      missingEvents.slice(0, 5).forEach(event => {
        console.log(`  - ID: ${event.id}, Title: ${event.title}`);
      });
      
      if (missingEvents.length > 5) {
        console.log(`  ... and ${missingEvents.length - 5} more`);
      }
    }
    
    // Offer to fix the migration
    console.log('\n🔧 Would you like to:');
    console.log('1. Clear database and re-migrate all 179 events');
    console.log('2. Add only the missing events to database');
    console.log('3. Show detailed analysis');
    
    return {
      totalInFile: eventsData.length,
      totalInDb: healthData.eventCount,
      missingCount: missingEvents.length,
      missingEvents: missingEvents,
      duplicateIds: uniqueIds.length !== eventsData.length
    };
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
};

const remigrateMissing = async (missingEvents) => {
  try {
    console.log(`🚀 Adding ${missingEvents.length} missing events to database...`);
    
    // Add missing events in small batches
    const batchSize = 10;
    let added = 0;
    
    for (let i = 0; i < missingEvents.length; i += batchSize) {
      const batch = missingEvents.slice(i, i + batchSize);
      console.log(`📤 Adding batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(missingEvents.length/batchSize)} (${batch.length} events)...`);
      
      const response = await fetch('http://localhost:3002/api/v1/event/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          events: batch,
          clearFirst: false // Don't clear existing events
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        added += result.count;
        console.log(`✅ Added ${result.count} events (Total: ${added})`);
      } else {
        console.error(`❌ Batch failed: ${result.message}`);
        break;
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`🎉 Migration completed! Added ${added} missing events`);
    
    // Verify final count
    const healthResponse = await fetch('http://localhost:3002/api/v1/event/health');
    const healthData = await healthResponse.json();
    console.log(`✅ Final count: ${healthData.eventCount} events in database`);
    
  } catch (error) {
    console.error('❌ Re-migration failed:', error.message);
  }
};

const fullRemigration = async () => {
  try {
    console.log('🔄 Performing full re-migration...');
    
    // Read all events
    const eventsData = JSON.parse(fs.readFileSync('events.json', 'utf8'));
    
    // Clear and re-migrate all events
    const response = await fetch('http://localhost:3002/api/v1/event/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        events: eventsData,
        clearFirst: true // Clear existing events first
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ Full migration completed! Migrated ${result.count} events`);
    } else {
      console.error(`❌ Full migration failed: ${result.message}`);
    }
    
    // Verify final count
    const healthResponse = await fetch('http://localhost:3002/api/v1/event/health');
    const healthData = await healthResponse.json();
    console.log(`✅ Final count: ${healthData.eventCount} events in database`);
    
  } catch (error) {
    console.error('❌ Full re-migration failed:', error.message);
  }
};

// Run analysis
const analysis = await fixMigration();

if (analysis && analysis.missingCount > 0) {
  console.log('\n🔧 Automatically adding missing events...');
  await remigrateMissing(analysis.missingEvents);
}