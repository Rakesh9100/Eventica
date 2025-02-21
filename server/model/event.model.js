import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    desc: {
        type: String,
        required: true
    },
    eventDate: {
        type: Date,
        required: true
    },
    organiser: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"User",
        required: true
    }
});

const Event = mongoose.model('Event', eventSchema);

export { Event };
