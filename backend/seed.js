const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Complaint = require('./models/Complaint');

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        // Clear existing data
        await User.deleteMany({});
        await Complaint.deleteMany({});
        console.log('Data Cleared...');

        // Create Users
        // Note: The User model pre-save hook handles password hashing
        const users = await User.create([
            {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123',
                role: 'citizen',
            },
            {
                name: 'Jane Smith',
                email: 'jane@example.com',
                password: 'password123',
                role: 'citizen',
            },
            {
                name: 'Roads Admin',
                email: 'roads-admin@example.com',
                password: 'admin123',
                role: 'admin',
                department: 'Roads',
            },
            {
                name: 'Water Admin',
                email: 'water-admin@example.com',
                password: 'admin123',
                role: 'admin',
                department: 'Water',
            },
            {
                name: 'Super Admin',
                email: 'superadmin@example.com',
                password: 'superadmin123',
                role: 'superadmin',
            },
        ]);

        console.log('Users Created...');

        const citizen1 = users[0];
        const citizen2 = users[1];

        // Create Complaints
        const roadsAdmin = users.find((u) => u.email === 'roads-admin@example.com');
        const waterAdmin = users.find((u) => u.email === 'water-admin@example.com');

        const complaints = await Complaint.create([
            {
                user: citizen1._id,
                category: 'Road',
                department: 'Roads',
                description: 'Big pothole on Main Street near the grocery store.',
                assignedTo: roadsAdmin?._id,
                location: {
                    latitude: 40.7128,
                    longitude: -74.0060,
                },
                status: 'Pending',
                image: '',
            },
            {
                user: citizen1._id,
                category: 'Garbage',
                department: 'Sanitation',
                description: 'Garbage not collected for 3 days in my area.',
                location: {
                    latitude: 40.7138,
                    longitude: -74.0070,
                },
                status: 'In Progress',
            },
            {
                user: citizen2._id,
                category: 'Street Light',
                department: 'Electricity',
                description: 'Street light flickering constantly in front of house #45.',
                assignedTo: waterAdmin?._id,
                location: {
                    latitude: 40.7148,
                    longitude: -74.0080,
                },
                status: 'Resolved',
                remark: 'Bulb replaced.',
            },
        ]);

        console.log('Complaints Created...');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
