const mongoose = require("mongoose");
const dotenv = require("dotenv");
const JobOffer = require("./models/JobOffer");
const Candidate = require("./models/Candidate");
const User = require("./models/User");

dotenv.config();

const seedRecruitment = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected for Seeding");

        // Find RH User
        const rhUser = await User.findOne({ role: "rh" });
        if (!rhUser) {
            console.log("No RH user found. Please ensure users exist/seed main data first.");
            process.exit(1);
        }

        // Clean existing recruitment data to avoid duplicates/mess
        await JobOffer.deleteMany({});
        await Candidate.deleteMany({});
        console.log("Cleared existing Recruitment data.");

        // --- 1. Job Offer: Senior React Dev (Published) ---
        const offerDev = await JobOffer.create({
            title: "Développeur Fullstack Senior (React/Node)",
            description: "Recherche expert technique pour lead l'équipe Front. Expérience 5 ans min.\n- Maîtrise de React, Redux, Node.js\n- Architecture Micro-services\n- Mentoring junior",
            department: "IT",
            budget: 55000, // TND
            currency: "TND",
            status: "published",
            createdBy: rhUser._id,
            publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
        });

        // Candidates for Dev
        await Candidate.create([
            {
                firstName: "Mohamed", lastName: "Ben Ali", email: "mohamed.ali@email.com", phone: "20123456",
                jobOfferId: offerDev._id,
                status: "interview_rh",
                cvUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                interviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
                submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
            },
            {
                firstName: "Sarra", lastName: "Khammassi", email: "sarra.k@email.com", phone: "98765432",
                jobOfferId: offerDev._id,
                status: "new",
                cvUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
            },
            {
                firstName: "Ahmed", lastName: "Tounsi", email: "ahmed.t@email.com", phone: "50505050",
                jobOfferId: offerDev._id,
                status: "rejected",
                analysisNote: "Manque d'expérience sur Node.js",
                cvUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                submittedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
            }
        ]);

        // --- 2. Job Offer: Commercial B2B (Analysis) ---
        const offerSales = await JobOffer.create({
            title: "Commercial B2B Junior",
            description: "Poste itinérant sur le Grand Tunis.\n- Prospection téléphonique et terrain\n- Gestion portefeuille client\n- Permis B obligatoire",
            department: "Commercial",
            budget: 25000,
            currency: "TND",
            status: "analysis",
            createdBy: rhUser._id,
            createdAt: new Date()
        });
        // No candidates yet (Analysis phase)

        // --- 3. Job Offer: RH Assistant (Closed/Hired) ---
        const offerRH = await JobOffer.create({
            title: "Assistant(e) RH",
            description: "Gestion administrative du personnel, suivi des congés et pointages.",
            department: "Ressources Humaines",
            budget: 30000,
            currency: "TND",
            status: "closed",
            createdBy: rhUser._id,
            publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            closedAt: new Date()
        });

        await Candidate.create({
            firstName: "Amel", lastName: "Mansour", email: "amel.m@email.com", phone: "22334455",
            jobOfferId: offerRH._id,
            status: "hired",
            cvUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            interviewDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            interviewRating: 9,
            interviewComment: "Excellent profil, très organisée.",
            finalDecision: "accepted",
            salaryProposal: 28000,
            salaryAgreed: true,
            notificationSentAt: new Date()
        });

        console.log("Database seeded successfully with Requirements & Applications!");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedRecruitment();
