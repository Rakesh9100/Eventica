import { Event } from "../model/event.model.js";
import { User } from "../model/user.model.js";
import jwt from "jsonwebtoken";

const secretKey = process.env.SECRET_KEY; // Ensure you have your secret key set in env
if (!secretKey) {
  console.error("JWT secret key not set. Exiting...");
  process.exit(1);
}
// Add a new event
const addEvent = async (req, res) => {
  try {
    const { title, description, date } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "No token provided." });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, secretKey);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    const organizerId = decoded.id;
    const organizer = await User.findById(organizerId);
    if (!organizer) {
      return res.status(404).json({ error: "Organizer not found." });
    }

    if (!title || !description || !date) {
      return res.status(400).json({ message: "All fields are required." });
    }
    console.log(date,description,title, organizerId)
    const event = new Event({ title:title, description:description, organizer: organizerId });
    await event.save();

    res.status(201).json({ message: "Event created successfully.", event });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Delete an event by ID
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "No token provided." });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, secretKey);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    const organizerId = decoded.userId;

    const event = await Event.findOneAndDelete({ _id: id, organizer: organizerId });
    if (!event) {
      return res.status(404).json({ message: "Event not found or unauthorized." });
    }

    res.status(200).json({ message: "Event deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get all events
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("organizer", "name email");
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get event by ID
const getEventbyId = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id).populate("organizer", "name email");

    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

export { addEvent, deleteEvent, getAllEvents, getEventbyId };
