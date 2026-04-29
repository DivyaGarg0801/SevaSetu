const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, superAdmin } = require('../middleware/authMiddleware');

const VALID_DEPARTMENTS = ['Water', 'Electricity', 'Roads', 'Sanitation'];

// @route   GET /api/admins
// @desc    Get all department admins
// @access  Private/SuperAdmin
router.get('/', protect, superAdmin, async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('-password');
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/admins
// @desc    Create a new department admin
// @access  Private/SuperAdmin
router.post('/', protect, superAdmin, async (req, res) => {
    const { name, email, password, department } = req.body;

    if (!name || !email || !password || !department) {
        return res.status(400).json({ message: 'Name, email, password, and department are required' });
    }

    if (!VALID_DEPARTMENTS.includes(department)) {
        return res.status(400).json({ message: 'Invalid department' });
    }

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        const adminUser = await User.create({
            name,
            email,
            password,
            role: 'admin',
            department,
        });

        res.status(201).json({
            _id: adminUser._id,
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role,
            department: adminUser.department,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/admins/:id
// @desc    Delete a department admin
// @access  Private/SuperAdmin
router.delete('/:id', protect, superAdmin, async (req, res) => {
    try {
        const adminUser = await User.findById(req.params.id);

        if (!adminUser || adminUser.role !== 'admin') {
            return res.status(404).json({ message: 'Admin not found' });
        }

        await adminUser.remove();
        res.json({ message: 'Admin removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
