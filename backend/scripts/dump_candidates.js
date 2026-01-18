const mongoose = require("mongoose");
const Candidate = require("../models/Candidate");
require("dotenv").config({ path: "./.env" });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const candidates = await Candidate.find();
        console.log(JSON.stringify(candidates, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

run();
