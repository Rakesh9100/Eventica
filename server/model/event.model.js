import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    eventDate: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        default: 'Time TBD'
    },
    endTime: {
        type: String,
        default: null
    },
    location: {
        type: String,
        default: 'Location TBD'
    },
    image: {
        type: String,
        default: 'https://via.placeholder.com/400x200?text=Event+Image'
    },
    website: {
        type: String,
        default: '#'
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true
    }
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);

export { Event };
