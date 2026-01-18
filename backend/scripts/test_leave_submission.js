
const fs = require('fs');
const path = require('path');
// Node 22 has native FormData globally.

require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function run() {
    try {
        console.log("Preparing test request...");

        // Create a dummy file
        const dummyFilePath = path.join(__dirname, 'test_doc.txt');
        fs.writeFileSync(dummyFilePath, 'This is a test document content.');
        const fileBlob = new Blob([fs.readFileSync(dummyFilePath)], { type: 'text/plain' });

        const formData = new FormData();
        formData.append('type', 'Maladie');
        formData.append('startDate', '2026-03-01');
        formData.append('endDate', '2026-03-05');
        formData.append('isHalfDay', 'false');
        formData.append('reason', 'Debug Script Submission Maladie');
        formData.append('file', fileBlob, 'test_doc.txt');

        console.log("Connecting to DB to get user...");
        await mongoose.connect(process.env.MONGO_URI);

        const user = await User.findOne({ role: 'employee' });
        if (!user) {
            console.log("No employee found.");
            return;
        }

        // Generate Token Manually
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
            expiresIn: "30d",
        });

        console.log(`Generated token for user: ${user.fullName}`);
        await mongoose.disconnect();

        console.log("Sending Leave Request...");
        const res = await fetch('http://localhost:5001/api/leaves', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        console.log(`Response Status: ${res.status} ${res.statusText}`);
        const text = await res.text();
        console.log("Response Body:");
        console.log(text);

        // Cleanup
        fs.unlinkSync(dummyFilePath);

    } catch (err) {
        console.error("Script Error:", err);
    }
}

run();
