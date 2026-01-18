const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
    console.log("Testing connection to:", process.env.MONGO_URI?.split('@')[1]); // Log only host part for safety
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connection Successful!");
        await mongoose.disconnect();
    } catch (err) {
        console.error("❌ Connection Failed:", err.message);
        console.error("Full Error:", err);
    }
};

testConnection();
