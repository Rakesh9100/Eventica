import { connectDB } from '../config/database.js';
import { ObjectId } from 'mongodb';

const secretKey = process.env.SECRET_KEY;
if (!secretKey) {
  console.error("JWT secret key not set. Exiting...");
  process.exit(1);
}

// Helper functions
const formatTimeForJson = (timeString) => {
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
};

const parseEventDate = (dateString) => {
  // Convert DD-MM-YYYY to Date object
  const [day, month, year] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const parseEventTime = (timeString) => {
  // Extract start time from "9:00am - 4:00pm" or "9:00am" format
  if (!timeString || timeString === 'Time TBD') return null;
  
  const startTime = timeString.split(' - ')[0].trim();
  return convertTimeToMinutes(startTime);
};

const convertTimeToMinutes = (timeStr) => {
  // Convert "9:00am" to minutes since midnight for comparison
  if (!timeStr) return 0;
  
  const match = timeStr.match(/(\d{1,2}):(\d{2})(am|pm)/i);
  if (!match) return 0;
  
  let [, hours, minutes, period] = match;
  hours = parseInt(hours);
  minutes = parseInt(minutes);
  
  if (period.toLowerCase() === 'pm' && hours !== 12) {
    hours += 12;
  } else if (period.toLowerCase() === 'am' && hours === 12) {
    hours = 0;
  }
  
  return hours * 60 + minutes;
};

const sortEventsByDate = (events) => {
  // Sort events by date in descending order (newest first), then by time
  return events.sort((a, b) => {
    const dateA = parseEventDate(a.date);
    const dateB = parseEventDate(b.date);
    
    // First sort by date (descending - newer dates first)
    const dateDiff = dateB - dateA;
    if (dateDiff !== 0) {
      return dateDiff;
    }
    
    // If same date, sort by start time (ascending - earlier times first)
    const timeA = parseEventTime(a.time);
    const timeB = parseEventTime(b.time);
    
    if (timeA === null && timeB === null) return 0;
    if (timeA === null) return 1; // Put "Time TBD" at the end
    if (timeB === null) return -1;
    
    return timeA - timeB; // Earlier times first
  });
};

// Add a new event
const addEvent = async (req, res) => {
  try {
    const { title, description, date, time, endTime, location, image, website } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required." });
    }

    // Connect to database
    const db = await connectDB();
    const eventsCollection = db.collection('events');

    // Format date to DD-MM-YYYY
    const eventDate = new Date(date);
    const day = eventDate.getDate().toString().padStart(2, '0');
    const month = (eventDate.getMonth() + 1).toString().padStart(2, '0');
    const year = eventDate.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    // Format time
    let timeDisplay = time || 'Time TBD';
    if (time && endTime) {
      timeDisplay = `${formatTimeForJson(time)} - ${formatTimeForJson(endTime)}`;
    } else if (time) {
      timeDisplay = formatTimeForJson(time);
    }

    // Generate new ID (find highest existing ID and add 1)
    const lastEvent = await eventsCollection.findOne({}, { sort: { id: -1 } });
    const maxId = lastEvent ? parseInt(lastEvent.id) || 0 : 0;
    const newId = (maxId + 1).toString();

    // Create new event
    const newEvent = {
      id: newId,
      title: title,
      date: formattedDate,
      time: timeDisplay,
      location: location || 'Location TBD',
      description: description,
      image: image || 'https://via.placeholder.com/400x200?text=Event+Image',
      website: website || '#',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert into MongoDB
    const result = await eventsCollection.insertOne(newEvent);
    
    console.log('✅ Event added to MongoDB:', newEvent.title);
    
    res.status(201).json({ 
      message: "Event created successfully.", 
      event: newEvent,
      note: "Event saved to MongoDB database"
    });
  } catch (error) {
    console.error('❌ Error adding event:', error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete an event by ID
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Connect to database
    const db = await connectDB();
    const eventsCollection = db.collection('events');

    // Find and delete event
    const result = await eventsCollection.findOneAndDelete({ id: id });

    if (!result.value) {
      return res.status(404).json({ message: "Event not found." });
    }

    console.log('✅ Event deleted from MongoDB:', result.value.title);

    res.status(200).json({ 
      message: "Event deleted successfully.", 
      deletedEvent: result.value,
      note: "Event removed from MongoDB database"
    });
  } catch (error) {
    console.error('❌ Error deleting event:', error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get all events
const getAllEvents = async (req, res) => {
  try {
    // Connect to database
    const db = await connectDB();
    const eventsCollection = db.collection('events');

    // Get all events
    const events = await eventsCollection.find({}).toArray();
    
    console.log('📖 Retrieved', events.length, 'events from MongoDB');
    
    // Sort events
    const sortedEvents = sortEventsByDate(events);
    
    // Convert to backend-compatible format for frontend
    const formattedEvents = sortedEvents.map(event => ({
      _id: event.id,
      title: event.title,
      description: event.description,
      time: event.time,
      location: event.location,
      image: event.image,
      website: event.website,
      date: event.date
    }));

    res.status(200).json(formattedEvents);
  } catch (error) {
    console.error('❌ Error getting events:', error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get event by ID
const getEventbyId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Connect to database
    const db = await connectDB();
    const eventsCollection = db.collection('events');
    
    const event = await eventsCollection.findOne({ id: id });

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Convert to backend-compatible format
    const formattedEvent = {
      _id: event.id,
      title: event.title,
      description: event.description,
      time: event.time,
      location: event.location,
      image: event.image,
      website: event.website,
      date: event.date
    };

    res.status(200).json(formattedEvent);
  } catch (error) {
    console.error('❌ Error getting event by ID:', error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Update an event by ID
const updateEvent = async (req, res) => {
  try {
    console.log('🔄 updateEvent called with ID:', req.params.id);
    
    const { id } = req.params;
    const { title, description, date, time, endTime, location, image, website } = req.body;

    if (!title || !description) {
      console.log('❌ Missing title or description');
      return res.status(400).json({ message: "Title and description are required." });
    }

    // Connect to database
    const db = await connectDB();
    const eventsCollection = db.collection('events');

    // Check if event exists
    const existingEvent = await eventsCollection.findOne({ id: id });
    if (!existingEvent) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Format date to DD-MM-YYYY
    const eventDate = new Date(date);
    const day = eventDate.getDate().toString().padStart(2, '0');
    const month = (eventDate.getMonth() + 1).toString().padStart(2, '0');
    const year = eventDate.getFullYear();
    const formattedDate = `${day}-${month}-${year}`;

    // Format time
    let timeDisplay = time || 'Time TBD';
    if (time && endTime) {
      timeDisplay = `${formatTimeForJson(time)} - ${formatTimeForJson(endTime)}`;
    } else if (time) {
      timeDisplay = formatTimeForJson(time);
    }

    // Update event
    const updatedEvent = {
      id: id, // Keep the same ID
      title: title,
      date: formattedDate,
      time: timeDisplay,
      location: location || 'Location TBD',
      description: description,
      image: image || existingEvent.image || 'https://via.placeholder.com/400x200?text=Event+Image',
      website: website || existingEvent.website || '#',
      updatedAt: new Date()
    };

    // Update in MongoDB
    const result = await eventsCollection.findOneAndUpdate(
      { id: id },
      { $set: updatedEvent },
      { returnDocument: 'after' }
    );

    console.log('✅ Event updated in MongoDB:', updatedEvent.title);
    
    res.status(200).json({ 
      message: "Event updated successfully.", 
      event: result.value,
      note: "Event updated in MongoDB database"
    });
  } catch (error) {
    console.error('❌ Error updating event:', error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export { addEvent, updateEvent, deleteEvent, getAllEvents, getEventbyId };