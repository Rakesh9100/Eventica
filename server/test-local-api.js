import fetch from 'node-fetch';

const testLocalAPI = async () => {
  const baseUrl = 'http://localhost:3002/api/v1';
  
  try {
    console.log('🧪 Testing local API endpoints...');
    
    // Test health endpoint
    console.log('🔍 Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/event/health`);
    const healthData = await healthResponse.json();
    console.log('📊 Health:', healthData);
    
    if (healthData.status !== 'healthy') {
      throw new Error('API is not healthy');
    }
    
    // Test get all events
    console.log('📖 Testing get all events...');
    const eventsResponse = await fetch(`${baseUrl}/event/allevents`);
    const events = await eventsResponse.json();
    console.log(`📋 Found ${events.length} events`);
    
    // Test add event
    console.log('➕ Testing add event...');
    const newEvent = {
      title: 'Local Test Event',
      description: 'This is a test event created locally',
      date: '2025-12-20',
      time: '10:00',
      endTime: '11:00',
      location: 'Local Test Location',
      image: 'https://via.placeholder.com/400x200?text=Local+Test',
      website: 'https://example.com'
    };
    
    const addResponse = await fetch(`${baseUrl}/event/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent)
    });
    
    const addResult = await addResponse.json();
    console.log('✅ Add event result:', addResult.message);
    
    if (!addResponse.ok) {
      throw new Error(`Add event failed: ${addResult.message}`);
    }
    
    const eventId = addResult.event.id;
    console.log(`📝 Created event with ID: ${eventId}`);
    
    // Test get single event
    console.log('🔍 Testing get single event...');
    const singleEventResponse = await fetch(`${baseUrl}/event/${eventId}`);
    const singleEvent = await singleEventResponse.json();
    console.log('📋 Single event:', singleEvent.title);
    
    // Test update event
    console.log('✏️ Testing update event...');
    const updateData = {
      ...newEvent,
      title: 'Updated Local Test Event',
      description: 'This event has been updated locally'
    };
    
    const updateResponse = await fetch(`${baseUrl}/event/update/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    
    const updateResult = await updateResponse.json();
    console.log('✅ Update event result:', updateResult.message);
    
    // Test delete event
    console.log('🗑️ Testing delete event...');
    const deleteResponse = await fetch(`${baseUrl}/event/delete/${eventId}`, {
      method: 'DELETE'
    });
    
    const deleteResult = await deleteResponse.json();
    console.log('✅ Delete event result:', deleteResult.message);
    
    console.log('🎉 All local API tests passed!');
    
  } catch (error) {
    console.error('❌ Local API test failed:', error.message);
  }
};

// Check if local server is running
const checkServer = async () => {
  try {
    const response = await fetch('http://localhost:3002/api/v1/event/health');
    if (response.ok) {
      await testLocalAPI();
    } else {
      console.log('❌ Local server is not responding properly');
    }
  } catch (error) {
    console.log('❌ Local server is not running. Please start it first with: npm run dev');
    console.log('💡 Run: cd server && node local-server.js (will start on port 3002)');
  }
};

checkServer();