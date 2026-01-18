const mongoose = require("mongoose");
const Candidate = require("../models/Candidate");
const JobOffer = require("../models/JobOffer");
require("dotenv").config({ path: "./.env" });

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DB Connected");

        const targetOffer = await JobOffer.findOne({ title: /Développeur/i });

        if (!targetOffer) {
            console.error("❌ No target Job Offer found!");
            process.exit(1);
        }
        console.log(`🎯 Target Offer: ${targetOffer.title} (${targetOffer._id})`);

        const result = await Candidate.updateMany(
            {},
            {
                $set: {
                    jobOfferId: targetOffer._id,
                    status: "new"
                }
            }
        );

        console.log(`✅ Successfully updated ${result.modifiedCount} candidates.`);
        console.log(`   (Matched: ${result.matchedCount})`);

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await mongoose.connection.close();
    }
}

run();
