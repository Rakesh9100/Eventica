import fs from 'fs';

const migrateViaAPI = async () => {
  try {
    console.log('🚀 Starting migration via API...');
    
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
    
    // Send migration request to API
    console.log('📤 Sending migration request...');
    const response = await fetch('https://eventica-backend.vercel.app/api/v1/event/migrate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ events: eventsData })
    });
    
    console.log('📥 Response status:', response.status);
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Migration successful!');
      console.log(`📊 Migrated ${result.count} events`);
      console.log(`⏰ Completed at: ${result.timestamp}`);
      
      // Verify migration
      console.log('🔍 Verifying migration...');
      const verifyResponse = await fetch('https://eventica-backend.vercel.app/api/v1/event/health');
      const verifyData = await verifyResponse.json();
      console.log(`✅ Verification: ${verifyData.eventCount} events in database`);
      
    } else {
      console.error('❌ Migration failed:', result.message);
      console.error('Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
};

migrateViaAPI();