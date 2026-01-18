require("dotenv").config({ path: "./.env" });
const mongoose = require("mongoose");
const Candidate = require("../models/Candidate");
const sendEmail = require("../services/emailService");

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DB Connected");

        // Get a candidate (Mohamed Ben Ali or similar)
        const candidate = await Candidate.findOne({ firstName: /Mohamed/i });
        if (!candidate) {
            console.error("❌ Candidate not found");
            return;
        }

        console.log(`Testing with candidate: ${candidate.email} (Status: ${candidate.status})`);

        // SIMULATE UPDATE LOGIC from controller
        const status = 'hired';
        const finalDecision = 'accepted';

        console.log("--- Simulating Logic ---");

        if (status === 'hired' || (finalDecision === 'accepted' && candidate.status !== 'hired')) {
            console.log("👉 Condition Met!");

            if (status !== 'hired') candidate.status = 'hired';
            candidate.notificationSentAt = Date.now();

            const subject = "Félicitations ! Vous êtes recruté(e) - ERP Recrutement";
            const message = `Bonjour ${candidate.firstName},\n... test ...`;

            console.log("Attempting to send email to:", candidate.email);

            try {
                await sendEmail({
                    to: candidate.email,
                    subject,
                    text: message
                });
                console.log(`✅ Acceptance email sent to ${candidate.email}`);
            } catch (emailErr) {
                console.error("❌ Failed to send acceptance email", emailErr);
            }
        } else {
            console.log("❌ Condition NOT Met. Status:", candidate.status);
        }

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await mongoose.connection.close();
    }
}

run();
