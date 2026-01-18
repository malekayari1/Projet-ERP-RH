const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("../models/User");
const Evaluation = require("../models/Evaluation");
const Campaign = require("../models/Campaign");
const Prime = require("../models/Prime");
const JobOffer = require("../models/JobOffer");
const Candidate = require("../models/Candidate");
const Notification = require("../models/Notification");

// Load env vars
dotenv.config({ path: "./.env" });

const tunisianFirstNames = [
    "Mohamed", "Ali", "Ahmed", "Youssef", "Bilal", "Walid", "Sami", "Karim", "Omar", "Hichem",
    "Anis", "Mourad", "Nabil", "Skander", "Haythem", "Nizar", "Fares", "Wassim", "Iyed", "Yassine",
    "Mariem", "Sarra", "Fatma", "Ines", "Sonia", "Amel", "Rania", "Nour", "Yasmine", "Chaima",
    "Salma", "Hela", "Mouna", "Imen", "Rim"
];

const tunisianLastNames = [
    "Trabelsi", "Gharbi", "Hammami", "Jaziri", "Ben Ali", "Ben Ahmed", "Tounsi", "Mzoughi", "Ayari",
    "Jlassi", "Mejri", "Saidi", "Oueslati", "Rejaibi", "Driss", "Chaieb", "Mabrouk", "Amri",
    "Bouazizi", "Ferjani", "Khelifi", "Louhichi", "Mathlouthi", "Naouar", "Zarrouk"
];

const departments = ["IT", "Développement", "Marketing", "Finance", "Ressources Humaines", "Commercial"];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateTunisianUser = (i, supervisorId) => {
    const firstName = getRandomElement(tunisianFirstNames);
    const lastName = getRandomElement(tunisianLastNames);
    return {
        fullName: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@company.tn`,
        password: "password123", // Will be hashed by pre-save hook? No, we might need to hash manually if using insertMany or rely on create.
        // For bulk speed, insertMany is better but skips hooks. For 30 users, simple loop with save() is fine.
        role: "employee",
        department: getRandomElement(departments),
        isActive: true,
        supervisorId: supervisorId
    };
};

const seedDatabase = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI not found");
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");

        // 1. Clear Database
        console.log("🧹 Clearing database...");
        await User.deleteMany({});
        await Evaluation.deleteMany({});
        await Campaign.deleteMany({});
        await Prime.deleteMany({});
        await JobOffer.deleteMany({});
        await Candidate.deleteMany({});
        await Notification.deleteMany({});
        console.log("✅ Database cleared");

        // 2. Create Key Users
        console.log("🌱 Seeding Key Users...");

        // Directeur
        const directeur = new User({
            fullName: "Mohamed Barkaoui",
            email: "mohamedbarkaoui33@gmail.com",
            password: "password123",
            role: "directeur",
            department: "Direction",
            isActive: true
        });
        await directeur.save();
        console.log(`User created: ${directeur.email} (Directeur)`);

        // RH
        const rh = new User({
            fullName: "Molka Boujmil",
            email: "boujmilmolka@gmail.com",
            password: "password123",
            role: "rh",
            department: "Ressources Humaines",
            isActive: true
        });
        await rh.save();
        console.log(`User created: ${rh.email} (RH)`);

        // Chef d'équipe (Malek Ayari)
        const chef = new User({
            fullName: "Malek Ayari",
            email: "ayarimalek13@gmail.com",
            password: "password123",
            role: "chef_equipe",
            department: "Développement",
            isActive: true,
            managerId: directeur._id
        });
        await chef.save();
        console.log(`User created: ${chef.email} (Chef d'équipe)`);

        // Employee (Amine Ben Smida) - Supervisé par Malek
        const employeeAmine = new User({
            fullName: "Amine Ben Smida",
            email: "aminebensmida46@gmail.com",
            password: "password123",
            role: "employee",
            department: "Développement",
            isActive: true,
            supervisorId: chef._id
        });
        await employeeAmine.save();
        console.log(`User created: ${employeeAmine.email} (Employé)`);

        // 3. Create 30 Random Tunisian Employees
        console.log("🌱 Seeding 30 Random Employees...");

        // Create a few more chefs to distribute employees?
        // Let's keep it simple: assign 15 to Malek, and maybe create another chef for the rest?
        // Or just assign all to Malek or leave some without.
        // Let's create one more dummy chef for variety.

        const chef2 = new User({
            fullName: "Sami Trabelsi",
            email: "sami.trabelsi@tech.tn",
            password: "password123",
            role: "chef_equipe",
            department: "Marketing",
            isActive: true,
            managerId: directeur._id
        });
        await chef2.save();
        console.log(`User created: ${chef2.email} (Chef d'équipe Marketing)`);

        for (let i = 1; i <= 30; i++) {
            // Distribute supervisors
            // First 15 -> Malek (Dev)
            // Next 10 -> Sami (Marketing)
            // Last 5 -> No supervisor (for testing edge cases)
            let supervisor = null;
            let dept = "IT";

            if (i <= 15) {
                supervisor = chef._id;
                dept = "Développement";
            } else if (i <= 25) {
                supervisor = chef2._id;
                dept = "Marketing";
            } else {
                dept = "Finance"; // No supervisor assigned yet
            }

            const firstName = getRandomElement(tunisianFirstNames);
            const lastName = getRandomElement(tunisianLastNames);

            const user = new User({
                fullName: `${firstName} ${lastName}`,
                email: `${firstName.substring(0, 3).toLowerCase()}.${lastName.toLowerCase()}${i}@company.tn`,
                password: "password123",
                role: "employee",
                department: dept,
                isActive: true,
                supervisorId: supervisor
            });

            await user.save();
        }
        console.log("✅ 30 Employees created");

        console.log("✨ Seeding completed successfully!");
        process.exit(0);

    } catch (err) {
        console.error("❌ Seeding failed:", err);
        process.exit(1);
    }
};

seedDatabase();
