import mongodb from '../config/mongodb.js';

class EventService {
  constructor() {
    this.collectionName = 'events';
  }

  // Helper functions
  formatTimeForDisplay(timeString) {
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

  formatDateToDDMMYYYY(dateString) {
    const eventDate = new Date(dateString);
    const day = eventDate.getDate().toString().padStart(2, '0');
    const month = (eventDate.getMonth() + 1).toString().padStart(2, '0');
    const year = eventDate.getFullYear();
    return `${day}-${month}-${year}`;
  }

  formatTimeRange(time, endTime) {
    let timeDisplay = time || 'Time TBD';
    if (time && endTime) {
      timeDisplay = `${this.formatTimeForDisplay(time)} - ${this.formatTimeForDisplay(endTime)}`;
    } else if (time) {
      timeDisplay = this.formatTimeForDisplay(time);
    }
    return timeDisplay;
  }

  parseEventDate(dateString) {
    const [day, month, year] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  parseEventTime(timeString) {
    if (!timeString || timeString === 'Time TBD') return null;
    
    const startTime = timeString.split(' - ')[0].trim();
    return this.convertTimeToMinutes(startTime);
  }

  convertTimeToMinutes(timeStr) {
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
  }

  sortEventsByDate(events) {
    return events.sort((a, b) => {
      const dateA = this.parseEventDate(a.date);
      const dateB = this.parseEventDate(b.date);
      
      const dateDiff = dateB - dateA;
      if (dateDiff !== 0) {
        return dateDiff;
      }
      
      const timeA = this.parseEventTime(a.time);
      const timeB = this.parseEventTime(b.time);
      
      if (timeA === null && timeB === null) return 0;
      if (timeA === null) return 1;
      if (timeB === null) return -1;
      
      return timeA - timeB;
    });
  }

  async generateNextId() {
    try {
      const collection = await mongodb.getCollection(this.collectionName);
      const lastEvent = await collection.findOne({}, { sort: { id: -1 } });
      const maxId = lastEvent ? parseInt(lastEvent.id) || 0 : 0;
      return (maxId + 1).toString();
    } catch (error) {
      console.error('Error generating ID:', error);
      return Date.now().toString();
    }
  }

  async createEvent(eventData) {
    try {
      const { title, description, date, time, endTime, location, image, website } = eventData;

      if (!title || !description) {
        throw new Error('Title and description are required');
      }

      const collection = await mongodb.getCollection(this.collectionName);
      const newId = await this.generateNextId();

      const newEvent = {
        id: newId,
        title: title.trim(),
        date: this.formatDateToDDMMYYYY(date),
        time: this.formatTimeRange(time, endTime),
        location: location?.trim() || 'Location TBD',
        description: description.trim(),
        image: image?.trim() || 'https://via.placeholder.com/400x200?text=Event+Image',
        website: website?.trim() || '#',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await collection.insertOne(newEvent);
      
      if (!result.insertedId) {
        throw new Error('Failed to create event');
      }

      console.log('✅ Event created:', newEvent.title);
      return newEvent;
    } catch (error) {
      console.error('❌ Error creating event:', error);
      throw error;
    }
  }

  async getAllEvents() {
    try {
      const collection = await mongodb.getCollection(this.collectionName);
      const events = await collection.find({}).toArray();
      
      console.log(`📖 Retrieved ${events.length} events from database`);
      
      const sortedEvents = this.sortEventsByDate(events);
      
      return sortedEvents.map(event => ({
        _id: event.id,
        title: event.title,
        description: event.description,
        time: event.time,
        location: event.location,
        image: event.image,
        website: event.website,
        date: event.date
      }));
    } catch (error) {
      console.error('❌ Error getting events:', error);
      throw error;
    }
  }

  async getEventById(id) {
    try {
      const collection = await mongodb.getCollection(this.collectionName);
      const event = await collection.findOne({ id: id });

      if (!event) {
        throw new Error('Event not found');
      }

      return {
        _id: event.id,
        title: event.title,
        description: event.description,
        time: event.time,
        location: event.location,
        image: event.image,
        website: event.website,
        date: event.date
      };
    } catch (error) {
      console.error('❌ Error getting event by ID:', error);
      throw error;
    }
  }

  async updateEvent(id, eventData) {
    try {
      const { title, description, date, time, endTime, location, image, website } = eventData;

      if (!title || !description) {
        throw new Error('Title and description are required');
      }

      const collection = await mongodb.getCollection(this.collectionName);
      
      const existingEvent = await collection.findOne({ id: id });
      if (!existingEvent) {
        throw new Error('Event not found');
      }

      const updatedEvent = {
        id: id,
        title: title.trim(),
        date: this.formatDateToDDMMYYYY(date),
        time: this.formatTimeRange(time, endTime),
        location: location?.trim() || 'Location TBD',
        description: description.trim(),
        image: image?.trim() || existingEvent.image || 'https://via.placeholder.com/400x200?text=Event+Image',
        website: website?.trim() || existingEvent.website || '#',
        updatedAt: new Date()
      };

      const result = await collection.findOneAndUpdate(
        { id: id },
        { $set: updatedEvent },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        throw new Error('Failed to update event');
      }

      console.log('✅ Event updated:', updatedEvent.title);
      return result.value;
    } catch (error) {
      console.error('❌ Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(id) {
    try {
      const collection = await mongodb.getCollection(this.collectionName);
      
      const result = await collection.findOneAndDelete({ id: id });

      if (!result.value) {
        throw new Error('Event not found');
      }

      console.log('✅ Event deleted:', result.value.title);
      return result.value;
    } catch (error) {
      console.error('❌ Error deleting event:', error);
      throw error;
    }
  }

  async getEventCount() {
    try {
      const collection = await mongodb.getCollection(this.collectionName);
      return await collection.countDocuments();
    } catch (error) {
      console.error('❌ Error getting event count:', error);
      return 0;
    }
  }
}

export default new EventService();