const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { protect, admin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

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

    try {
        const complaint = new Complaint({
            user: req.user._id,
            category,
            description,
            image,
            location: {
                latitude,
                longitude,
            },
        });

        const createdComplaint = await complaint.save();
        res.status(201).json(createdComplaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/complaints
// @desc    Get all complaints (Admin) or User's complaints (Citizen)
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        if (req.user.role === 'admin') {
            const complaints = await Complaint.find({}).populate('user', 'name email');
            res.json(complaints);
        } else {
            const complaints = await Complaint.find({ user: req.user._id });
            res.json(complaints);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/complaints/:id/status
// @desc    Update complaint status
// @access  Private/Admin
router.put('/:id/status', protect, admin, async (req, res) => {
    const { status, resolutionNote } = req.body;

    try {
        const complaint = await Complaint.findById(req.params.id);

        if (complaint) {
            complaint.status = status || complaint.status;
            complaint.resolutionNote = resolutionNote || complaint.resolutionNote;

            const updatedComplaint = await complaint.save();
            res.json(updatedComplaint);
        } else {
            res.status(404).json({ message: 'Complaint not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
