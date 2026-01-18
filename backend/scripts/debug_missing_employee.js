const mongoose = require("mongoose");
const User = require("../models/User");
const Evaluation = require("../models/Evaluation");
const Campaign = require("../models/Campaign");
// Assuming script is run from 'backend' root: node scripts/debug...
require("dotenv").config({ path: "./.env" });

const debugParams = {
    employeeName: "Amine Ben Smida"
};

async function run() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing from .env");
        }
        console.log("Connecting to DB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        // 1. Find the employee
        const employee = await User.findOne({ fullName: { $regex: debugParams.employeeName, $options: "i" } });

        if (!employee) {
            console.log(`❌ Employee '${debugParams.employeeName}' NOT FOUND in Users collection.`);
            return;
        }

        console.log("\n=== EMPLOYEE DETAILS ===");
        console.log(`ID: ${employee._id}`);
        console.log(`Name: ${employee.fullName}`);
        console.log(`Role: ${employee.role}`);
        console.log(`Department: ${employee.department}`);
        console.log(`IsActive: ${employee.isActive}`);
        console.log(`Supervisor ID: ${employee.supervisorId}`);

        // 2. Check Supervisor
        if (employee.supervisorId) {
            const supervisor = await User.findById(employee.supervisorId);
            if (supervisor) {
                console.log(`✅ Assigned Supervisor: ${supervisor.fullName} (${supervisor.role})`);
            } else {
                console.log("❌ Supervisor ID exists but Supervisor User NOT FOUND.");
            }
        } else {
            console.log("❌ NO SUPERVISOR ASSIGNED (supervisorId is missing/null).");
        }

        // 3. Check Active Campaigns
        console.log("\n=== ACTIVE CAMPAIGNS ===");
        const campaigns = await Campaign.find({ status: { $in: ["active", "evaluation"] } });
        if (campaigns.length === 0) {
            console.log("⚠️ No active campaigns found. Evaluations are only visible for active campaigns.");
        } else {
            campaigns.forEach(c => console.log(`- Campaign: ${c.title} (ID: ${c._id})`));
        }

        // 4. Check Evaluations for this employee
        console.log("\n=== EVALUATIONS FOR EMPLOYEE ===");
        const evaluations = await Evaluation.find({ employeeId: employee._id }).populate("campaignId");

        if (evaluations.length === 0) {
            console.log("⚠️ No evaluations found for this employee.");
            console.log("   Evaluations are usually created when a campaign is LAUNCHED.");
            console.log("   If the employee was added AFTER launch, they might count as missing.");
        } else {
            evaluations.forEach(e => {
                console.log(`- Campaign: ${e.campaignId?.title || "Unknown"}`);
                console.log(`  Status: ${e.status}`);
                console.log(`  ChefEquipeId on Eval: ${e.chefEquipeId}`);
            });
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.connection.close();
    }
}

run();
