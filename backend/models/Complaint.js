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
    department: {
        type: String,
        required: true,
        enum: ['Water', 'Electricity', 'Roads', 'Sanitation'],
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
        enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
        default: 'Pending',
    },
    remark: {
        type: String,
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
