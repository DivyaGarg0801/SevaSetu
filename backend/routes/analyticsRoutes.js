const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { protect, superAdmin } = require('../middleware/authMiddleware');

// @route   GET /api/analytics
// @desc    Get complaint analytics for superadmin
// @access  Private/SuperAdmin
router.get('/', protect, superAdmin, async (req, res) => {
    try {
        const totalComplaints = await Complaint.countDocuments();
        const statusCounts = await Complaint.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        const departmentCounts = await Complaint.aggregate([
            { $group: { _id: '$department', count: { $sum: 1 } } },
        ]);

        const assignedCounts = await Complaint.aggregate([
            { $match: { assignedTo: { $ne: null } } },
            { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'admin',
                },
            },
            { $unwind: '$admin' },
            {
                $project: {
                    _id: 0,
                    adminName: '$admin.name',
                    email: '$admin.email',
                    department: '$admin.department',
                    count: 1,
                },
            },
            { $sort: { count: -1 } },
        ]);

        res.json({
            totalComplaints,
            statusCounts: statusCounts.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
            departmentCounts: departmentCounts.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
            assignedCounts,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
