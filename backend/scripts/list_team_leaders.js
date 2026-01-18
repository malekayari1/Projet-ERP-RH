const mongoose = require("mongoose");
const User = require("../models/User");
require("dotenv").config({ path: "./.env" });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const chefs = await User.find({ role: "chef_equipe" });

        console.log("=== CHEFS D'ÉQUIPE ===");
        if (chefs.length === 0) {
            console.log("Aucun chef d'équipe trouvé.");
        } else {
            chefs.forEach(c => console.log(`- ${c.fullName} (ID: ${c._id})`));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

run();
