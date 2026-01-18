const mongoose = require("mongoose");
const Candidate = require("../models/Candidate");
const JobOffer = require("../models/JobOffer");
require("dotenv").config({ path: "./.env" });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const offers = await JobOffer.find({}, 'title _id');
        const candidates = await Candidate.find({}, 'firstName lastName jobOfferId status');

        console.log(`Found ${offers.length} offers and ${candidates.length} candidates.`);

        console.log("\n--- Offers ---");
        offers.forEach(o => console.log(`ID: ${o._id} | Title: ${o.title}`));

        console.log("\n--- Candidates ---");
        candidates.forEach(c => {
            const linkedOffer = offers.find(o => o._id.toString() === c.jobOfferId?.toString());
            console.log(`ID: ${c._id} | Name: ${c.firstName} ${c.lastName} | Status: ${c.status}`);
            console.log(`   -> Linked Offer ID: ${c.jobOfferId} | Found: ${linkedOffer ? "YES (" + linkedOffer.title + ")" : "NO"}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

run();
