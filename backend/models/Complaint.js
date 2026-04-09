const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    category: {
        type: String,
        required: true,
        enum: ['Road', 'Drainage', 'Street Light', 'Garbage', 'Water'],
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
    },
    location: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
    },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved'],
        default: 'Pending',
    },
    resolutionNote: {
        type: String,
    },
    assignedTo: { // Could be a field worker in future, for now just a string or another user ref
        type: String,
    }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
