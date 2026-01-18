const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config({ path: "./.env" });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // 1. Find Amine
        const amine = await User.findOne({ fullName: { $regex: "Amine Ben Smida", $options: "i" } });
        if (!amine) {
            console.log("❌ Amine NOT FOUND");
            return;
        }

        // 2. Find Marie Lefebvre
        const marie = await User.findOne({ fullName: { $regex: "Marie Lefebvre", $options: "i" } });
        if (!marie) {
            console.log("❌ Marie Lefebvre NOT FOUND");
            return;
        }

        if (marie.role !== "chef_equipe") {
            console.log(`⚠️ Warning: Marie is '${marie.role}', not 'chef_equipe'. Proceeding anyway...`);
        }

        // 3. Update Supervisor
        amine.supervisorId = marie._id;
        await amine.save();

        console.log(`✅ SUCCESS: Assigned ${marie.fullName} (ID: ${marie._id}) as supervisor for ${amine.fullName}.`);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

run();
