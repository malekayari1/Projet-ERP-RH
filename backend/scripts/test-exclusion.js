const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();
const connectDB = require('../config/db');

const testExclusion = async () => {
    await connectDB();
    console.log("DB Connected");
    try {
        // 1. Check if user exists
        const testUser = await User.findOne({ fullName: /Test/i });
        if (testUser) {
            console.log(`Found Test User: ${testUser.fullName} (ID: ${testUser._id})`);
        } else {
            console.log("Test User NOT found with simple regex.");
        }

        // 2. Run the exclusion query
        const userQuery = {
            role: { $in: ['employee', 'chef_equipe', 'manager'] },
            fullName: { $not: /Test/i }
        };
        const users = await User.find(userQuery).select('fullName');

        console.log(`\nQuery Results (${users.length} users):`);
        users.forEach(u => console.log(` - ${u.fullName}`));

        const stillHasTest = users.some(u => u.fullName.toLowerCase().includes('test'));
        if (stillHasTest) {
            console.log("\n❌ FAILED: Test user still present in exclusion query.");
        } else {
            console.log("\n✅ SUCCESS: Test user successfully excluded.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

testExclusion();
