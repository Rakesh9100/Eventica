import jwt from "jsonwebtoken";
import fs from 'fs';
import path from 'path';

const secretKey = process.env.SECRET_KEY;
if (!secretKey) {
  console.error("JWT secret key not set. Exiting...");
  process.exit(1);
}

// Helper functions for events.json operations
const getEventsFilePath = () => {
  // In serverless environments like Vercel, use /tmp directory for writing
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join('/tmp', 'events.json');
  }
  // For local development, use the events.json file in the server directory
  return path.join(process.cwd(), 'events.json');
};

const getReadOnlyEventsFilePath = () => {
  // Always try to read from the original events.json file first
  return path.join(process.cwd(), 'events.json');
};

const readEventsFromFile = () => {
  try {
    // First try to read from the original events.json file
    const originalFilePath = getReadOnlyEventsFilePath();
    if (fs.existsSync(originalFilePath)) {
      const data = fs.readFileSync(originalFilePath, 'utf8');
      const events = JSON.parse(data);
      console.log('Reading events from original file, count:', events.length);
      return events;
    }
    
    // If original doesn't exist, try the writable location
    const writableFilePath = getEventsFilePath();
    if (fs.existsSync(writableFilePath)) {
      const data = fs.readFileSync(writableFilePath, 'utf8');
      const events = JSON.parse(data);
      console.log('Reading events from writable file, count:', events.length);
      return events;
    }
    
    console.log('Events file not found, returning empty array');
    return [];
  } catch (error) {
    console.error('Error reading events from file:', error);
    return [];
  }
};

const writeEventsToFile = (events) => {
  try {
    const filePath = getEventsFilePath();
    console.log('📁 Attempting to write to file path:', filePath);
    console.log('📁 Environment variables - VERCEL:', process.env.VERCEL, 'AWS_LAMBDA:', process.env.AWS_LAMBDA_FUNCTION_NAME);
    
    // Ensure the directory exists
    const dir = path.dirname(filePath);
    console.log('📁 Directory path:', dir);
    if (!fs.existsSync(dir)) {
      console.log('📁 Creating directory:', dir);
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(events, null, 4));
    console.log('✅ Updated events.json file with', events.length, 'events at:', filePath);
    return true;
  } catch (error) {
    console.error('❌ Error writing events file:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Attempted to write to:', getEventsFilePath());
    
    // In serverless environments, file writing might fail
    // Log the error but don't fail the entire operation
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      console.warn('⚠️ File writing failed in serverless environment - this is expected');
      console.warn('⚠️ Events are still processed but not persisted to file');
      return true; // Return true to not break the API response
    }
    
    console.error('❌ File writing failed in non-serverless environment');
    return false;
  }
};

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

    // Read existing events
    const events = readEventsFromFile();

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
    const maxId = events.length > 0 ? Math.max(...events.map(e => parseInt(e.id) || 0)) : 0;
    const newId = (maxId + 1).toString();

    // Create new event with core fields only
    const newEvent = {
      id: newId,
      title: title,
      date: formattedDate,
      time: timeDisplay,
      location: location || 'Location TBD',
      description: description,
      image: image || 'https://via.placeholder.com/400x200?text=Event+Image',
      website: website || '#'
    };

    // Add new event to array
    events.push(newEvent);

    // Sort events by date (newest first)
    const sortedEvents = sortEventsByDate(events);

    // TEMPORARY: Skip file writing entirely in serverless environments
    console.log('💾 Checking environment for file writing...');
    console.log('🌐 Environment - VERCEL:', !!process.env.VERCEL, 'AWS_LAMBDA:', !!process.env.AWS_LAMBDA_FUNCTION_NAME);
    
    let success = true;
    let note = "Event processed successfully";
    
    // Only attempt file writing in local development
    if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
      console.log('💾 Local environment detected - attempting file write...');
      success = writeEventsToFile(sortedEvents);
      note = success ? "Event saved to file" : "Failed to save to file";
      
      if (!success) {
        console.log('❌ File write failed in local environment');
        return res.status(500).json({ message: "Failed to save event to file." });
      }
    } else {
      console.log('☁️ Serverless environment detected - skipping file write');
      note = "Event processed (file writing skipped in serverless environment)";
    }

    res.status(201).json({ 
      message: "Event created successfully.", 
      event: newEvent,
      note: note
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete an event by ID
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Read existing events
    const events = readEventsFromFile();

    // Find event index
    const eventIndex = events.findIndex(event => event.id === id);

    if (eventIndex === -1) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Remove event from array
    const deletedEvent = events.splice(eventIndex, 1)[0];

    // TEMPORARY: Skip file writing entirely in serverless environments
    console.log('💾 Checking environment for file writing...');
    console.log('🌐 Environment - VERCEL:', !!process.env.VERCEL, 'AWS_LAMBDA:', !!process.env.AWS_LAMBDA_FUNCTION_NAME);
    
    let success = true;
    let note = "Event processed successfully";
    
    // Only attempt file writing in local development
    if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
      console.log('💾 Local environment detected - attempting file write...');
      success = writeEventsToFile(events);
      note = success ? "Event removed from file" : "Failed to remove from file";
      
      if (!success) {
        console.log('❌ File write failed in local environment');
        return res.status(500).json({ message: "Failed to delete event from file." });
      }
    } else {
      console.log('☁️ Serverless environment detected - skipping file write');
      note = "Event processed (file writing skipped in serverless environment)";
    }

    res.status(200).json({ 
      message: "Event deleted successfully.", 
      deletedEvent: deletedEvent,
      note: note
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get all events
const getAllEvents = async (req, res) => {
  try {
    const events = readEventsFromFile();
    console.log('Raw events from file:', events.length, 'events');
    
    // Convert to backend-compatible format for frontend
    const formattedEvents = events.map(event => ({
      _id: event.id,
      title: event.title,
      description: event.description,
      time: event.time,
      location: event.location,
      image: event.image,
      website: event.website,
      date: event.date
    }));

    console.log('Sending', formattedEvents.length, 'events');
    res.status(200).json(formattedEvents);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get event by ID
const getEventbyId = async (req, res) => {
  try {
    const { id } = req.params;
    const events = readEventsFromFile();
    
    const event = events.find(event => event.id === id);

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
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Update an event by ID
const updateEvent = async (req, res) => {
  try {
    console.log('🔄 updateEvent called with ID:', req.params.id);
    console.log('🔄 Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔄 Environment check - VERCEL:', !!process.env.VERCEL);
    
    const { id } = req.params;
    const { title, description, date, time, endTime, location, image, website } = req.body;

    if (!title || !description) {
      console.log('❌ Missing title or description');
      return res.status(400).json({ message: "Title and description are required." });
    }

    // Read existing events
    const events = readEventsFromFile();

    // Find event index
    const eventIndex = events.findIndex(event => event.id === id);

    if (eventIndex === -1) {
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

    // Update event with core fields only
    events[eventIndex] = {
      id: id, // Keep the same ID
      title: title,
      date: formattedDate,
      time: timeDisplay,
      location: location || 'Location TBD',
      description: description,
      image: image || events[eventIndex].image || 'https://via.placeholder.com/400x200?text=Event+Image',
      website: website || events[eventIndex].website || '#'
    };

    // Sort events by date after update (newest first)
    const sortedEvents = sortEventsByDate(events);

    // TEMPORARY: Skip file writing entirely in serverless environments
    console.log('💾 Checking environment for file writing...');
    console.log('🌐 Environment - VERCEL:', !!process.env.VERCEL, 'AWS_LAMBDA:', !!process.env.AWS_LAMBDA_FUNCTION_NAME);
    
    let success = true;
    let note = "Event processed successfully";
    
    // Only attempt file writing in local development
    if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
      console.log('💾 Local environment detected - attempting file write...');
      success = writeEventsToFile(sortedEvents);
      note = success ? "Event saved to file" : "Failed to save to file";
      
      if (!success) {
        console.log('❌ File write failed in local environment');
        return res.status(500).json({ message: "Failed to update event in file." });
      }
    } else {
      console.log('☁️ Serverless environment detected - skipping file write');
      note = "Event processed (file writing skipped in serverless environment)";
    }

    console.log('✅ Event update successful');
    res.status(200).json({ 
      message: "Event updated successfully.", 
      event: events[eventIndex],
      note: note
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export { addEvent, updateEvent, deleteEvent, getAllEvents, getEventbyId };
