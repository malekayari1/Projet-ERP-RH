const mongoose = require("mongoose");
const JobOffer = require("../models/JobOffer");
const Candidate = require("../models/Candidate");
require("dotenv").config({ path: "./.env" });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("=== JOB OFFERS ===");
        const offers = await JobOffer.find();
        if (offers.length === 0) console.log("No Job Offers found.");
        else offers.forEach(o => console.log(`- [${o._id}] ${o.title} (${o.status})`));

        console.log("\n=== CANDIDATES ===");
        const candidates = await Candidate.find();
        if (candidates.length === 0) console.log("No Candidates found.");
        else {
            candidates.forEach(c => {
                console.log(`- [${c._id}] ${c.firstName} ${c.lastName} -> Offer: ${c.jobOfferId}`);
                // Check if link is valid
                const linked = offers.find(o => o._id.toString() === c.jobOfferId.toString());
                if (!linked) console.log("  ⚠️ Linked Job Offer NOT FOUND!");
            });
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

run();
