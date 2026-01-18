const mongoose = require("mongoose");
const User = require("../models/User");
const Contract = require("../models/Contract");
const Campaign = require("../models/Campaign");
const Evaluation = require("../models/Evaluation");
const EmailTemplate = require("../models/EmailTemplate");
const SentEmail = require("../models/SentEmail");
const Notification = require("../models/Notification");
const evaluationController = require("../controllers/evaluationController");
const emailController = require("../controllers/emailController");
const contractController = require("../controllers/contractController");
require("dotenv").config({ path: "./.env" });

// Mock Express req/res
const mockReq = (body = {}, user = {}, params = {}, query = {}) => ({
    body,
    user,
    params,
    query
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ DB Connected");

        // 1. Get Users
        const rh = await User.findOne({ role: "rh" });
        const chef = await User.findOne({ role: "chef_equipe", email: "ayarimalek13@gmail.com" });
        const employee = await User.findOne({ email: "aminebensmida46@gmail.com" });

        if (!rh || !chef || !employee) throw new Error("Missing key users (RH, Chef, Employee)");

        console.log("--- TEST 1: CONTRACTS ---");
        const reqContract = mockReq(
            { type: "CDI", startDate: "2026-02-01", employeeId: employee._id },
            rh // RH creates it
        );
        const resContract = mockRes();

        // Call controller function directly (need to adapt if it's not exported exactly as needed or if use middleware)
        // contractController.createContract expects req.user
        await contractController.createContract(reqContract, resContract);

        if (resContract.statusCode === 201) {
            console.log("✅ Contract created successfully:", resContract.data._id);
        } else {
            console.error("❌ Contract creation failed:", resContract.data);
        }

        console.log("\n--- TEST 2: CAMPAIGN & EVALUATION ---");
        // Create Campaign
        const reqCamp = mockReq(
            { title: "Test Auto Campaign", description: "Test", startDate: "2026-01-01", endDate: "2026-12-31", department: "Développement" },
            rh
        );
        const resCamp = mockRes();
        // Assuming createCampaign is exported
        const campaignController = require("../controllers/campaignController");
        await campaignController.createCampaign(reqCamp, resCamp);
        const campaign = resCamp.data;
        console.log(`✅ Campaign created: ${campaign.title} (${campaign._id})`);

        // Launch Campaign (to create empty evaluations)
        const reqLaunch = mockReq({}, rh, { id: campaign._id });
        const resLaunch = mockRes();
        await campaignController.launchCampaign(reqLaunch, resLaunch);
        console.log(`✅ Campaign launched: ${resLaunch.data.message}`);

        // Find the evaluation for Amine
        const evaluation = await Evaluation.findOne({ campaignId: campaign._id, employeeId: employee._id });
        if (!evaluation) throw new Error("Evaluation not created for Amine!");
        console.log(`✅ Evaluation found for Amine: ${evaluation._id}`);

        // Submit Evaluation by Chef
        const reqEval = mockReq(
            {
                punctuality: 15, workQuality: 16, initiative: 14, teamwork: 18, communication: 15,
                commentChefEquipe: "Bon travail global.",
                primeAmount: "", // Score < 80? (15+16+14+18+15)/5 = 15.6 -> 78/100. No prime needed.
            },
            chef,
            { id: evaluation._id }
        );
        const resEval = mockRes();
        await evaluationController.submitEvaluationByChefEquipe(reqEval, resEval);

        if (resEval.statusCode && resEval.statusCode !== 200) {
            console.error("❌ Evaluation submission failed:", resEval.data);
        } else {
            console.log("✅ Evaluation submitted. Score:", resEval.data.score);
        }

        console.log("\n--- TEST 3: AUTO EMAILS ---");
        // Run automation trigger
        const reqAuto = mockReq({}, rh);
        const resAuto = mockRes();
        await emailController.checkAutomationTriggers(reqAuto, resAuto);
        console.log("✅ Automation executed.");
        console.log("   Results:", resAuto.data.results);

        // Check sent emails mock or logs
        const sentEmails = await SentEmail.find().sort({ sentAt: -1 }).limit(5);
        console.log("   Latest 5 Sent Emails logs:");
        sentEmails.forEach(e => console.log(`   - To: ${e.recipientId} | Subject: ${e.subject} | Status: ${e.status}`));

    } catch (err) {
        console.error("❌ Test Failed:", err);
    } finally {
        await mongoose.connection.close();
    }
}

runTest();
