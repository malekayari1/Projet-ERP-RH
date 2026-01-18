const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();
const connectDB = require('../config/db');

const checkDepartments = async () => {
    await connectDB();
    console.log("Checking User Departments...");
    try {
        const users = await User.find({ role: { $in: ['employee', 'chef_equipe', 'manager'] } });
        console.log(`Found ${users.length} employees.`);

        users.forEach(u => {
            console.log(`- ${u.fullName} [Role: ${u.role}]: Department = '${u.department || "MISSING"}'`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

checkDepartments();
