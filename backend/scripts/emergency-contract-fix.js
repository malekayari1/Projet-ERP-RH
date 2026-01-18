const mongoose = require('mongoose');
const User = require('../models/User');
const Contract = require('../models/Contract');
require('dotenv').config();
const connectDB = require('../config/db');

const emergencyFix = async () => {
    await connectDB();
    try {
        const users = await User.find({ fullName: { $not: /Test/i } });
        console.log(`Found ${users.length} users needing contracts.`);

        let count = 0;
        for (const user of users) {
            // Check if already has a valid one
            const existing = await Contract.findOne({ employeeId: user._id });
            if (existing) {
                if (existing.status === 'validated' && existing.salary > 0) continue;
                // If exists but pending/invalid, update it
                existing.status = 'validated';
                existing.salary = 2500; // Default 2500 TND
                existing.startDate = new Date(2025, 0, 1);
                await existing.save();
                count++;
                continue;
            }

            // Create new
            await Contract.create({
                employeeId: user._id,
                type: 'CDI',
                status: 'validated',
                startDate: new Date(2025, 0, 1),
                salary: 2500, // Default for demo
                hoursPerWeek: 40
            });
            count++;
        }

        console.log(`Successfully created/updated ${count} contracts.`);
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

emergencyFix();
