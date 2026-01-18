const User = require("../models/User");
const EmailTemplate = require("../models/EmailTemplate");
const SentEmail = require("../models/SentEmail");
const Document = require("../models/Document");
const sendEmail = require("../services/emailService");

const REQUIRED_DOCS = ["RIB", "CNI", "Photo"];

// --- Users Needing Attention (For RH/Manager Dashboard) ---
exports.getWorkflowTasks = async (req, res) => {
    try {
        // Find users who have either:
        // 1. Rejected documents in the 'Document' collection
        // 2. Missing documents (based on the REQUIRED_DOCS list not being verified in 'Document')

        const activeUsers = await User.find({ isActive: true, role: 'employee' });
        const missingDocsList = [];

        for (const user of activeUsers) {
            const userDocs = await Document.find({ employeeId: user._id });

            // Check for rejected
            const rejected = userDocs.filter(d => d.status === 'rejected').map(d => d.name);

            // Check for missing from REQUIRED_DOCS
            const missing = REQUIRED_DOCS.filter(name =>
                !userDocs.some(d => d.name === name && d.status === 'verified')
            );

            if (rejected.length > 0 || missing.length > 0) {
                missingDocsList.push({
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    missingDocuments: [...new Set([...rejected, ...missing])]
                });
            }
        }

        const tasks = {
            missingDocs: missingDocsList,
            trialPending: await User.find({ trialValidationStatus: 'pending' }).select('fullName email trialPeriodEnd')
        };
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: "Error fetching tasks", error: err.message });
    }
};

// --- Employee Specific Workflow Status ---
exports.getMyTasks = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        const userDocs = await Document.find({ employeeId: userId });

        const rejected = userDocs.filter(d => d.status === 'rejected').map(d => ({ name: d.name, reason: d.rejectionReason }));
        const verified = userDocs.filter(d => d.status === 'verified').map(d => d.name);
        const missing = REQUIRED_DOCS.filter(name => !verified.includes(name) && !userDocs.some(d => d.name === name));

        res.json({
            fullName: user.fullName,
            missingDocuments: missing,
            rejectedDocuments: rejected,
            verifiedDocuments: verified,
            trialStatus: user.trialValidationStatus,
            trialEnd: user.trialPeriodEnd
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching personal tasks", error: err.message });
    }
};

// --- Templates ---
exports.getTemplates = async (req, res) => {
    const templates = await EmailTemplate.find();
    res.json(templates);
};

exports.createTemplate = async (req, res) => {
    const template = await EmailTemplate.create(req.body);
    res.status(201).json(template);
};

exports.updateTemplate = async (req, res) => {
    const template = await EmailTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(template);
};

// --- Logs (Deduplicated: Showing only the latest status per recipient/subject) ---
exports.getSentEmails = async (req, res) => {
    try {
        const logs = await SentEmail.aggregate([
            // Sort by date descending first
            { $sort: { sentAt: -1 } },
            // Group by recipient and subject
            {
                $group: {
                    _id: { recipientId: "$recipientId", subject: "$subject" },
                    latestLog: { $first: "$$ROOT" }
                }
            },
            // Replace root with the latest log document
            { $replaceRoot: { newRoot: "$latestLog" } },
            // Populate recipient and sender
            {
                $lookup: {
                    from: "users",
                    localField: "recipientId",
                    foreignField: "_id",
                    as: "recipientId"
                }
            },
            { $unwind: "$recipientId" },
            {
                $lookup: {
                    from: "users",
                    localField: "senderId",
                    foreignField: "_id",
                    as: "senderId"
                }
            },
            { $unwind: { path: "$senderId", preserveNullAndEmptyArrays: true } },
            // Final sort after aggregation
            { $sort: { sentAt: -1 } },
            { $limit: 50 }
        ]);

        res.json(logs);
    } catch (err) {
        res.status(500).json({ message: "Error fetching logs", error: err.message });
    }
};

// --- Automation Logic ---

// Trigger Manual Reminder (RH)
exports.sendReminder = async (req, res) => {
    const { userId, templateName, additionalInfo } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const template = await EmailTemplate.findOne({ name: templateName });
    if (!template) return res.status(404).json({ message: "Template not found" });

    // Simple placeholder replacement
    let body = template.body
        .replace("{{fullName}}", user.fullName)
        .replace("{{missingDocs}}", additionalInfo || "documents obligatoires");

    // --- REAL SMTP SEND ---
    let mailSent = false;
    let errorMsg = null;
    try {
        await sendEmail({
            to: user.email,
            subject: template.subject,
            text: body
        });
        mailSent = true;
    } catch (err) {
        console.error("SMTP Error:", err);
        errorMsg = err.message;
    }

    const sentEmail = await SentEmail.create({
        recipientId: userId,
        senderId: req.user._id,
        templateId: template._id,
        subject: template.subject,
        body: body,
        status: mailSent ? "sent" : "failed",
        error: errorMsg
    });

    res.json({ message: mailSent ? "Email envoyé avec succès" : "Erreur lors de l'envoi SMTP", log: sentEmail });
};

// Trigger Automation Check (ERP System Logic)
exports.checkAutomationTriggers = async (req, res) => {
    try {
        console.log("🚀 Lancement de l'analyse d'automatisation...");
        const results = {
            remindersSent: 0,
            trialPeriodsNotified: 0,
            logs: []
        };

        // 1. ERP Flow: Vérifier documents via la collection 'Document'
        const activeUsers = await User.find({ isActive: true, role: 'employee' });
        const reminderTemplate = await EmailTemplate.findOne({ name: 'DOC_REMINDER' });

        if (!reminderTemplate) {
            console.warn("⚠️ Template 'DOC_REMINDER' non trouvé !");
        } else {
            for (const user of activeUsers) {
                const userDocs = await Document.find({ employeeId: user._id });

                const rejected = userDocs.filter(d => d.status === 'rejected').map(d => d.name);
                const missing = REQUIRED_DOCS.filter(name =>
                    !userDocs.some(d => d.name === name && d.status === 'verified')
                );

                const totalMissing = [...new Set([...rejected, ...missing])];

                if (totalMissing.length > 0) {
                    const body = reminderTemplate.body
                        .replace("{{fullName}}", user.fullName)
                        .replace("{{missingDocs}}", totalMissing.join(", "));

                    // --- REAL SMTP SEND ---
                    let mailSent = false;
                    let errorMsg = null;
                    try {
                        await sendEmail({
                            to: user.email,
                            subject: reminderTemplate.subject,
                            text: body
                        });
                        mailSent = true;
                    } catch (err) {
                        errorMsg = err.message;
                    }

                    const log = await SentEmail.create({
                        recipientId: user._id,
                        templateId: reminderTemplate._id,
                        subject: reminderTemplate.subject,
                        body: body,
                        status: mailSent ? "sent" : "failed",
                        error: errorMsg
                    });
                    results.remindersSent++;
                    results.logs.push(log);
                }
            }
        }
        console.log(`📂 Document Check: ${results.remindersSent} relances envoyées.`);

        // 2. ERP Flow: Vérifier fin de période d'essai (Trigger -> Manager)
        const fifteenDaysFromNow = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        const usersTrialEnding = await User.find({
            trialPeriodEnd: { $lte: fifteenDaysFromNow },
            trialValidationStatus: 'not_applicable', // Statut initial avant analyse RH
            isActive: true
        });
        console.log(`⏳ Trial Check: ${usersTrialEnding.length} utilisateurs à pousser vers validation Manager.`);

        const trialTemplate = await EmailTemplate.findOne({ name: 'TRIAL_END' });
        if (!trialTemplate) {
            console.warn("⚠️ Template 'TRIAL_END' non trouvé !");
        } else {
            for (const user of usersTrialEnding) {
                // On passe le statut à 'pending' pour qu'il apparaisse chez le manager
                user.trialValidationStatus = 'pending';
                await user.save();

                // --- REAL SMTP SEND ---
                let mailSent = false;
                let errorMsg = null;
                try {
                    await sendEmail({
                        to: user.email,
                        subject: trialTemplate.subject,
                        text: trialTemplate.body.replace("{{fullName}}", user.fullName)
                    });
                    mailSent = true;
                } catch (err) {
                    errorMsg = err.message;
                }

                const log = await SentEmail.create({
                    recipientId: user._id,
                    templateId: trialTemplate._id,
                    subject: trialTemplate.subject,
                    body: trialTemplate.body.replace("{{fullName}}", user.fullName),
                    status: mailSent ? "sent" : "failed",
                    error: errorMsg
                });
                results.trialPeriodsNotified++;
                results.logs.push(log);
            }
        }

        console.log("✅ Analyse terminée avec succès.");
        res.json({ message: "Analyse d'automatisation terminée avec succès", results });
    } catch (err) {
        console.error("❌ Erreur lors de l'automatisation:", err);
        res.status(500).json({ message: "Erreur lors de l'automatisation", error: err.message });
    }
};

// Manager Flow: Valider période d'essai
exports.validateTrialPeriod = async (req, res) => {
    const { userId, status } = req.body; // status: 'validated' or 'rejected'

    // Sécurité : Seul un Manager peut valider selon le swimlane BPMN
    if (req.user.role !== 'manager' && req.user.role !== 'directeur') {
        return res.status(403).json({ message: "Seul le manager responsable peut valider cette étape du workflow." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.trialValidationStatus = status;
    await user.save();

    // If validated, send congrats (as per Manager swimlane in BPMN)
    if (status === 'validated') {
        const congratsTemplate = await EmailTemplate.findOne({ name: 'CONGRATS_MAIL' })
            || await EmailTemplate.findOne({ name: 'WELCOME_MAIL' }); // Fallback

        const body = `Bonjour ${user.fullName},\n\nNous avons le plaisir de vous confirmer la validation de votre période d'essai.\n\nCordialement,\nVotre Manager`;

        // --- REAL SMTP SEND ---
        let mailSent = false;
        try {
            await sendEmail({
                to: user.email,
                subject: "Félicitations pour votre titularisation",
                text: body
            });
            mailSent = true;
        } catch (err) {
            console.error("Validate Trial SMTP failure");
        }

        await SentEmail.create({
            recipientId: user._id,
            senderId: req.user._id,
            subject: "Félicitations pour votre titularisation",
            body: body,
            status: mailSent ? "sent" : "failed"
        });
    }

    res.json({ message: `Période d'essai ${status === 'validated' ? 'validée' : 'refusée'}`, user });
};
