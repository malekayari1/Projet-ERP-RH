const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config({ path: "./.env" });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Check Thomas Bernard
        const thomas = await User.findOne({ fullName: "Thomas Bernard" });
        if (thomas) {
            console.log(`\n=== DETAILS: THOMAS BERNARD ===`);
            console.log(`Role: ${thomas.role}`);
            console.log(`Department: ${thomas.department}`);
        }

        // Find potential leads in Development
        console.log(`\n=== USERS IN 'Développement' ===`);
        const devUsers = await User.find({ department: { $regex: "Développement|Dev", $options: "i" } });

        if (devUsers.length === 0) {
            console.log("No users found in Development department.");
        } else {
            devUsers.forEach(u => {
                console.log(`- ${u.fullName} (${u.role})`);
            });
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

run();
