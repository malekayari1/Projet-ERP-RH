const Candidate = require("../models/Candidate");
const sendEmail = require("../services/emailService");
const JobOffer = require("../models/JobOffer");
const User = require("../models/User");

// @desc    Get candidates for a specific job offer
// @route   GET /api/job-offers/:offerId/candidates
// @access  Private
exports.getCandidatesByOffer = async (req, res) => {
    try {
        const candidates = await Candidate.find({ jobOfferId: req.params.offerId }).sort({ submittedAt: -1 });
        res.status(200).json(candidates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get ALL candidates (Global View)
// @route   GET /api/candidates
// @access  Private
exports.getAllCandidates = async (req, res) => {
    try {
        const candidates = await Candidate.find()
            .populate('jobOfferId', 'title') // Populate job title
            .sort({ submittedAt: -1 });
        res.status(200).json(candidates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single candidate by ID
// @route   GET /api/candidates/:id
// @access  Private
exports.getCandidateById = async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) {
            return res.status(404).json({ message: "Candidat non trouvé" });
        }
        res.status(200).json(candidate);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add a new candidate (Step 3: Reception)
// @route   POST /api/candidates
// @access  Private
exports.addCandidate = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, jobOfferId, cvUrl, linkedinUrl } = req.body;

        const offer = await JobOffer.findById(jobOfferId);
        if (!offer) {
            return res.status(404).json({ message: "Offre invalide" });
        }

        const newCandidate = await Candidate.create({
            firstName,
            lastName,
            email,
            phone,
            jobOfferId,
            jobOfferId,
            cvUrl,
            linkedinUrl,
            status: "new"
        });

        res.status(201).json(newCandidate);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update candidate status & details (Steps 3, 4, 5, 6)
// @route   PUT /api/candidates/:id
// @access  Private (RH only)
exports.updateCandidate = async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) {
            return res.status(404).json({ message: "Candidat non trouvé" });
        }

        const {
            status,
            analysisNote,
            interviewDate,
            interviewRating,
            interviewComment,
            finalDecision,
            salaryProposal,
            salaryAgreed
        } = req.body;

        console.log("DEBUG: Update Candidate", req.params.id);
        console.log("DEBUG: Payload:", req.body);

        // Update Status
        if (status) {
            console.log(`DEBUG: Changing status from ${candidate.status} to ${status}`);
            candidate.status = status;
        }

        // Step 3: Analysis
        if (analysisNote) candidate.analysisNote = analysisNote;

        // Step 4: Interview RH
        if (interviewDate) candidate.interviewDate = interviewDate;
        if (interviewRating) candidate.interviewRating = interviewRating;
        if (interviewComment) candidate.interviewComment = interviewComment;

        // Step 5: Final Decision logic
        if (finalDecision) {
            candidate.finalDecision = finalDecision;
            // If decision is 'rejected' at this stage, update status too
            if (finalDecision === 'rejected') {
                candidate.status = 'rejected';
            } else if (finalDecision === 'accepted' && candidate.status === 'decision_pending') {
                // If accepted, we might wait for salary negotiation before marking 'hired'
                // For simplicity, let's keep it in decision_pending until negotiation is done or move to hired manually?
                // User request says: "If positive: trigger negotiation".
                // So we stay in decision_pending or a negotiation state?
                // Let's assume we handle negotiation in the same screen.
            }
        }

        if (salaryProposal) candidate.salaryProposal = salaryProposal;
        if (salaryAgreed !== undefined) candidate.salaryAgreed = salaryAgreed;

        // --- LOGIC: EMAILS (Step 6) ---
        const forceResend = req.body.resendEmail === true;
        console.log(`DEBUG: Checking email triggers. Status: ${status}, Decision: ${finalDecision}, Current: ${candidate.status}, ForceResend: ${forceResend}`);

        // 1. ACCEPTANCE / HIRED
        if (status === 'hired' || (finalDecision === 'accepted' && candidate.status !== 'hired') || (forceResend && candidate.status === 'hired')) {
            console.log("DEBUG: HIT -> Acceptance Logic");

            // Ensure status update
            candidate.status = 'hired';
            candidate.finalDecision = 'accepted';
            candidate.notificationSentAt = Date.now();

            // Send Acceptance Email
            const subject = "Félicitations ! Vous êtes recruté(e) - ERP Recrutement";
            const message = `Bonjour ${candidate.firstName},\n\nNous avons le plaisir de vous informer que votre candidature a été retenue.\n\nL'équipe RH prendra contact avec vous très prochainement pour les formalités d'embauche.\n\nVotre compte employé a été créé.\nIdentifiant : ${candidate.email}\nMot de passe temporaire : password123\n\nBienvenue parmi nous !\n\nCordialement,\nL'équipe RH.`;

            console.log(`DEBUG: Sending Acceptance Email to ${candidate.email}`);
            try {
                await sendEmail({ to: candidate.email, subject, text: message });
                console.log("DEBUG: ✅ Acceptance Email SENT");
            } catch (err) {
                console.error("DEBUG: ❌ Acceptance Email FAILED", err);
            }

            // --- AUTO CREATE USER ACCOUNT ---
            try {
                const existingUser = await User.findOne({ email: candidate.email });
                if (!existingUser) {
                    console.log(`DEBUG: Creating User account for ${candidate.email}`);

                    // Fetch department from job offer
                    const jobOffer = await JobOffer.findById(candidate.jobOfferId);

                    const newUser = new User({
                        fullName: `${candidate.firstName} ${candidate.lastName}`,
                        email: candidate.email,
                        password: "password123", // Default password
                        role: "employee",
                        department: jobOffer ? jobOffer.department : "Development",
                        onboardingStatus: "in_progress"
                    });

                    await newUser.save();
                    console.log(`DEBUG: ✅ User account created (ID: ${newUser._id})`);
                } else {
                    console.log(`DEBUG: User account already exists for ${candidate.email}`);
                }
            } catch (userErr) {
                console.error("DEBUG: ❌ Failed to create User account", userErr);
            }
        }

        // 2. REJECTION
        if (status === 'rejected' || (finalDecision === 'rejected' && candidate.status !== 'rejected') || (forceResend && candidate.status === 'rejected')) {
            console.log("DEBUG: HIT -> Rejection Logic");

            // Ensure status update
            candidate.status = 'rejected';
            candidate.finalDecision = 'rejected';
            candidate.notificationSentAt = Date.now();

            const subject = "Mise à jour de votre candidature - ERP Recrutement";
            const message = `Bonjour ${candidate.firstName},\n\nNous vous remercions de l'intérêt que vous portez à notre entreprise.\n\nAprès étude de votre dossier, nous sommes au regret de vous informer que nous ne donnerons pas suite à votre candidature pour le moment.\n\nNous conservons toutefois votre profil pour de futures opportunités.\n\nCordialement,\nL'équipe RH.`;

            console.log(`DEBUG: Sending Rejection Email to ${candidate.email}`);
            try {
                await sendEmail({ to: candidate.email, subject, text: message });
                console.log("DEBUG: ✅ Rejection Email SENT");
            } catch (err) {
                console.error("DEBUG: ❌ Rejection Email FAILED", err);
            }
        }

        // Helper to formatting date
        const formatDate = (date) => {
            return new Date(date).toLocaleString('fr-FR', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        };

        // Notify Candidate if requested (Interview Scheduling context)
        if (req.body.notifyCandidate && interviewDate) {
            candidate.status = "interview_rh"; // Ensure status update

            const subject = "Convocation à un entretien - ERP Recrutement";
            const message = `Bonjour ${candidate.firstName},\n\nNous avons le plaisir de vous inviter à un entretien le ${formatDate(interviewDate)}.\n\nMerci de nous confirmer votre présence.\n\nCordialement,\nL'équipe RH.`;

            try {
                await sendEmail({
                    to: candidate.email,
                    subject,
                    text: message
                });
                console.log(`Email sent to ${candidate.email}`);
            } catch (emailErr) {
                console.error("Failed to send email", emailErr);
                // Don't block the updates, just log error
            }
        }

        await candidate.save();
        res.status(200).json(candidate);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete candidate
// @route   DELETE /api/candidates/:id
// @access  Private
exports.deleteCandidate = async (req, res) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) {
            return res.status(404).json({ message: "Candidat non trouvé" });
        }
        await candidate.deleteOne();
        res.status(200).json({ message: "Candidat supprimé" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
