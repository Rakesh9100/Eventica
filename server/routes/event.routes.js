import express from 'express';
import { addEvent,deleteEvent,getAllEvents,getEventbyId } from '../controllers/event.controller.js';
import { Event } from '../model/event.model.js';
import { User } from '../model/user.model.js';

const eventRouter = express.Router();

// Test endpoint without authentication
eventRouter.post('/test-add', async (req, res) => {
    try {
        const { title, description, date, time, location, image, website } = req.body;
        
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
            eventDate: date ? new Date(date) : new Date()
        });
        
        await event.save();

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

eventRouter.post('/add', addEvent);
eventRouter.delete('/delete/:id', deleteEvent);
eventRouter.get('/allevents', getAllEvents);
eventRouter.get('/:id', getEventbyId);

export { eventRouter };