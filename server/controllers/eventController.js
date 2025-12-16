import eventService from '../services/eventService.js';

// Add a new event
export const addEvent = async (req, res) => {
  try {
    console.log('📝 Creating new event...');
    
    const event = await eventService.createEvent(req.body);
    
    res.status(201).json({
      message: 'Event created successfully',
      event: event,
      note: 'Event saved to MongoDB database'
    });
  } catch (error) {
    console.error('❌ Add event error:', error);
    
    if (error.message.includes('required')) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({
      message: 'Failed to create event',
      error: error.message
    });
  }
};

// Get all events
export const getAllEvents = async (req, res) => {
  try {
    console.log('📖 Fetching all events...');
    
    const events = await eventService.getAllEvents();
    
    res.status(200).json(events);
  } catch (error) {
    console.error('❌ Get all events error:', error);
    
    res.status(500).json({
      message: 'Failed to fetch events',
      error: error.message
    });
  }
};

// Get event by ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Fetching event with ID: ${id}`);
    
    const event = await eventService.getEventById(id);
    
    res.status(200).json(event);
  } catch (error) {
    console.error('❌ Get event by ID error:', error);
    
    if (error.message === 'Event not found') {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.status(500).json({
      message: 'Failed to fetch event',
      error: error.message
    });
  }
};

// Update an event
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 Updating event with ID: ${id}`);
    
    const event = await eventService.updateEvent(id, req.body);
    
    res.status(200).json({
      message: 'Event updated successfully',
      event: event,
      note: 'Event updated in MongoDB database'
    });
  } catch (error) {
    console.error('❌ Update event error:', error);
    
    if (error.message === 'Event not found') {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (error.message.includes('required')) {
      return res.status(400).json({ message: error.message });
    }
    
    res.status(500).json({
      message: 'Failed to update event',
      error: error.message
    });
  }
};

// Delete an event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ Deleting event with ID: ${id}`);
    
    const deletedEvent = await eventService.deleteEvent(id);
    
    res.status(200).json({
      message: 'Event deleted successfully',
      deletedEvent: deletedEvent,
      note: 'Event removed from MongoDB database'
    });
  } catch (error) {
    console.error('❌ Delete event error:', error);
    
    if (error.message === 'Event not found') {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.status(500).json({
      message: 'Failed to delete event',
      error: error.message
    });
  }
};

// Health check endpoint
export const healthCheck = async (req, res) => {
  try {
    const eventCount = await eventService.getEventCount();
    
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      eventCount: eventCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};