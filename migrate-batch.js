import fs from 'fs';

const migrateBatch = async () => {
  try {
    console.log('🚀 Starting batch migration via API...');
    
    // Read events.json
    const eventsData = JSON.parse(fs.readFileSync('events.json', 'utf8'));
    console.log(`📖 Found ${eventsData.length} events to migrate`);
    
    // Test API health first
    console.log('🔍 Testing API health...');
    const healthResponse = await fetch('https://eventica-backend.vercel.app/api/v1/event/health');
    const healthData = await healthResponse.json();
    console.log('📊 API Health:', healthData);
    
    if (healthData.status !== 'healthy') {
      throw new Error('API is not healthy');
    }
    
    // Migrate in smaller batches
    const batchSize = 20; // Smaller batches
    const batches = [];
    
    for (let i = 0; i < eventsData.length; i += batchSize) {
      batches.push(eventsData.slice(i, i + batchSize));
    }
    
    console.log(`📦 Split into ${batches.length} batches of ${batchSize} events each`);
    
    let totalMigrated = 0;
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`📤 Migrating batch ${i + 1}/${batches.length} (${batch.length} events)...`);
      
      try {
        const response = await fetch('https://eventica-backend.vercel.app/api/v1/event/migrate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            events: batch,
            clearFirst: i === 0 // Only clear on first batch
          })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          console.log(`✅ Batch ${i + 1} successful: ${result.count} events`);
          totalMigrated += result.count;
        } else {
          console.error(`❌ Batch ${i + 1} failed:`, result.message);
          break;
        }
        
        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Batch ${i + 1} error:`, error.message);
        break;
      }
    }
    
    console.log(`🎉 Migration completed! Total migrated: ${totalMigrated} events`);
    
    // Verify final count
    console.log('🔍 Verifying final migration...');
    const verifyResponse = await fetch('https://eventica-backend.vercel.app/api/v1/event/health');
    const verifyData = await verifyResponse.json();
    console.log(`✅ Final verification: ${verifyData.eventCount} events in database`);
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
};

migrateBatch();