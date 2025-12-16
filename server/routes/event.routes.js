import express from 'express';
import { addEvent, updateEvent, deleteEvent, getAllEvents, getEventById, healthCheck } from '../controllers/eventController.js';
import { Event } from '../model/event.model.js';
import { User } from '../model/user.model.js';
import fs from 'fs';
import path from 'path';

const eventRouter = express.Router();

// Helper function to save event to events.json
async function saveToEventsJson(event, additionalData) {
    try {
        // Path to events.json (assuming it's in the parent directory)
        const eventsJsonPath = path.join(process.cwd(), '..', 'events.json');
        
        // Read existing events
        let existingEvents = [];
        try {
            const data = fs.readFileSync(eventsJsonPath, 'utf8');
            existingEvents = JSON.parse(data);
        } catch (error) {
            console.log('events.json not found or empty, creating new array');
        }

        // Format date to DD-MM-YYYY
        const eventDate = new Date(event.eventDate);
        const day = eventDate.getDate().toString().padStart(2, '0');
        const month = (eventDate.getMonth() + 1).toString().padStart(2, '0');
        const year = eventDate.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;

        // Format time
        let timeDisplay = additionalData.time || 'Time TBD';
        if (additionalData.time && additionalData.endTime) {
            timeDisplay = `${formatTimeForJson(additionalData.time)} - ${formatTimeForJson(additionalData.endTime)}`;
        } else if (additionalData.time) {
            timeDisplay = formatTimeForJson(additionalData.time);
        }

        // Create new event in events.json format
        const newEvent = {
            title: event.title,
            date: formattedDate,
            time: timeDisplay,
            location: additionalData.location || 'Location TBD',
            description: event.description,
            image: additionalData.image || 'https://via.placeholder.com/400x200?text=Event+Image',
            website: additionalData.website || '#'
        };

        // Add to beginning of array (newest first)
        existingEvents.unshift(newEvent);

        // Write back to file
        fs.writeFileSync(eventsJsonPath, JSON.stringify(existingEvents, null, 2));
        console.log('Event saved to events.json successfully');
        
    } catch (error) {
        console.error('Error saving to events.json:', error);
        throw error;
    }
}

// Helper function to format time for JSON
function formatTimeForJson(timeString) {
    if (!timeString) return 'Time TBD';
    
    try {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const min = minutes || '00';
        
        if (hour === 0) return `12:${min}am`;
        if (hour < 12) return `${hour}:${min}am`;
        if (hour === 12) return `12:${min}pm`;
        return `${hour - 12}:${min}pm`;
    } catch (error) {
        return timeString;
    }
}

// Test endpoint without authentication
eventRouter.post('/test-add', async (req, res) => {
    try {
        const { title, description, date, time, endTime, location, image, website } = req.body;
        
        if (!title || !description) {
            return res.status(400).json({ message: "Title and description are required." });
        }

        // Create a default admin user if it doesn't exist
        let adminUser = await User.findOne({ email: 'admin@eventica.com' });
        if (!adminUser) {
            adminUser = new User({
                username: 'admin',
                email: 'admin@eventica.com',
                password: 'admin123',
                role: 'admin'
            });
            await adminUser.save();
        }

        const event = new Event({ 
            title: title, 
            description: description, 
            organizer: adminUser._id,
            eventDate: date ? new Date(date) : new Date(),
            time: time || 'Time TBD',
            endTime: endTime || null,
            location: location || 'Location TBD',
            image: image || 'https://via.placeholder.com/400x200?text=Event+Image',
            website: website || '#'
        });
        
        await event.save();

        // Also save to events.json for frontend compatibility
        try {
            await saveToEventsJson(event, { time, endTime, location, image, website });
        } catch (jsonError) {
            console.error('Failed to save to events.json:', jsonError);
            // Don't fail the request if JSON save fails
        }

        res.status(201).json({ 
            message: "Event created successfully.", 
            event: event 
        });
    } catch (error) {
        console.error('Test add event error:', error);
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
});

// Sync endpoint to upload your local events.json
eventRouter.post('/sync', async (req, res) => {
    try {
        const { events } = req.body;
        
        if (!Array.isArray(events)) {
            return res.status(400).json({ message: "Events must be an array." });
        }

        // Add IDs to events that don't have them
        const eventsWithIds = events.map((event, index) => ({
            ...event,
            id: event.id || `existing_${Date.now()}_${index}`,
            createdAt: event.createdAt || new Date().toISOString()
        }));

        // Write to file
        const filePath = process.env.VERCEL ? '/tmp/events.json' : path.join(process.cwd(), '..', 'events.json');
        fs.writeFileSync(filePath, JSON.stringify(eventsWithIds, null, 2));

        res.status(200).json({ 
            message: "Events synced successfully.", 
            count: eventsWithIds.length 
        });
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ 
            message: "Server Error", 
            error: error.message 
        });
    }
});

// Health check endpoint
eventRouter.get('/health', healthCheck);

// Migration endpoint (temporary)
eventRouter.post('/migrate', async (req, res) => {
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events)) {
      return res.status(400).json({ message: "Events must be an array." });
    }

    console.log(`🚀 Starting migration of ${events.length} events...`);
    
    // Import the event service
    const { default: eventService } = await import('../services/eventService.js');
    
    // Clear existing events
    const mongodb = (await import('../config/mongodb.js')).default;
    const collection = await mongodb.getCollection('events');
    await collection.deleteMany({});
    
    // Prepare events with proper IDs and metadata
    const eventsWithMetadata = events.map((event, index) => ({
      ...event,
      id: event.id || (index + 1).toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Insert all events (only if there are events to insert)
    let result = { insertedCount: 0 };
    if (eventsWithMetadata.length > 0) {
      result = await collection.insertMany(eventsWithMetadata);
    }
    
    console.log(`✅ Successfully migrated ${result.insertedCount} events!`);
    
    res.status(200).json({
      message: "Events migrated successfully",
      count: result.insertedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({
      message: "Migration failed",
      error: error.message
    });
  }
});

// Event CRUD endpoints
eventRouter.post('/add', addEvent);
eventRouter.put('/update/:id', updateEvent);
eventRouter.delete('/delete/:id', deleteEvent);
eventRouter.get('/allevents', getAllEvents);
eventRouter.get('/:id', getEventById);

export { eventRouter };