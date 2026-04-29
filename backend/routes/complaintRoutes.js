const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { protect, admin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const categoryToDepartment = {
    Road: 'Roads',
    Drainage: 'Sanitation',
    'Street Light': 'Electricity',
    Garbage: 'Sanitation',
    Water: 'Water',
};

// Multer Config
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Images only!');
    }
}

// @route   POST /api/complaints
// @desc    Create a complaint
// @access  Private
router.post('/', protect, upload.single('image'), async (req, res) => {
    const { category, description, latitude, longitude } = req.body;
    const image = req.file ? req.file.path : null;
    const department = categoryToDepartment[category];

    if (!department) {
        return res.status(400).json({ message: 'Invalid category selected' });
    }

    try {
        const departmentAdmin = await User.findOne({ role: 'admin', department }).sort({ createdAt: 1 });

        const complaint = new Complaint({
            user: req.user._id,
            category,
            department,
            description,
            image,
            assignedTo: departmentAdmin ? departmentAdmin._id : undefined,
            location: {
                latitude,
                longitude,
            },
        });

        const createdComplaint = await complaint.save();
        const populatedComplaint = await Complaint.findById(createdComplaint._id)
            .populate('assignedTo', 'name email department')
            .populate('user', 'name email');

        res.status(201).json(populatedComplaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/complaints
// @desc    Get complaints based on role and filters
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { status, department } = req.query;
        const filter = {};

        if (req.user.role === 'superadmin') {
            if (department) {
                filter.department = department;
            }
        } else if (req.user.role === 'admin') {
            filter.department = req.user.department;
        } else {
            filter.user = req.user._id;
        }

        if (status) {
            filter.status = status;
        }

        const complaints = await Complaint.find(filter)
            .populate('user', 'name email')
            .populate('assignedTo', 'name email department');

        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/complaints/:id/status
// @desc    Update complaint status
// @access  Private/Admin
router.put('/:id/status', protect, admin, async (req, res) => {
    const { status, remark } = req.body;

    try {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        if (complaint.department !== req.user.department) {
            return res.status(403).json({ message: 'Not authorized to update this complaint' });
        }

        if (status === 'Rejected' && !remark) {
            return res.status(400).json({ message: 'Remark is required when rejecting a complaint' });
        }

        complaint.status = status || complaint.status;
        complaint.remark = remark || complaint.remark;

        const updatedComplaint = await complaint.save();
        res.json(updatedComplaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
