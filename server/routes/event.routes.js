import express from 'express';
import { addEvent,deleteEvent,getAllEvents,getEventbyId } from '../controllers/event.controller.js';


const eventRouter = express.Router();

eventRouter.post('/add', addEvent);
eventRouter.delete('/delete/:id', deleteEvent);
eventRouter.get('/allevents', getAllEvents);
eventRouter.get('/:id', getEventbyId);

export { eventRouter };