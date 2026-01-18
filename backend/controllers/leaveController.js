const LeaveRequest = require("../models/LeaveRequest");
const User = require("../models/User");
const sendEmail = require("../services/emailService");

// --- Employee: Create Request ---
exports.createRequest = async (req, res) => {
    try {
        const { type, startDate, endDate, reason, isHalfDay } = req.body;
        const employeeId = req.user._id;

        if (!type || !startDate || !endDate || !reason) {
            return res.status(400).json({ message: "Veuillez remplir tous les champs obligatoires." });
        }

        // Calculate duration (simple diff for now)
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        let duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive

        if (isHalfDay === 'true' || isHalfDay === true) {
            duration = 0.5;
        }

        // Check attachment for Maladie
        let attachmentUrl = null;
        if (req.file) {
            attachmentUrl = `/uploads/${req.file.filename}`;
        }

        if (type === 'Maladie' && !attachmentUrl) {
            return res.status(400).json({ message: "Un justificatif médical est obligatoire pour un congé maladie." });
        }

        const leave = await LeaveRequest.create({
            employeeId,
            type,
            startDate,
            endDate,
            duration,
            isHalfDay: isHalfDay === 'true' || isHalfDay === true,
            reason,
            attachmentUrl,
            status: 'pending_manager',
            history: [{
                status: 'pending_manager',
                updatedBy: employeeId,
                comment: "Demande créée"
            }]
        });

        // Notify Manager - DISABLED AS PER REQUEST
        /*
        const employee = await User.findById(employeeId).populate('managerId');
        if (employee && employee.managerId) {
            await sendEmail({
                to: employee.managerId.email,
                subject: "Nouvelle demande de congé",
                text: `L'employé ${employee.fullName} a soumis une demande de congé (${type}) du ${new Date(startDate).toLocaleDateString()} au ${new Date(endDate).toLocaleDateString()}. Veuillez la valider dans l'ERP.`
            });
        }
        */

        res.status(201).json(leave);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur lors de la création de la demande", error: err.message });
    }
};

// --- Employee: Get My Requests ---
exports.getMyLeaves = async (req, res) => {
    try {
        const leaves = await LeaveRequest.find({ employeeId: req.user._id }).sort({ createdAt: -1 });
        res.json(leaves);
    } catch (err) {
        res.status(500).json({ message: "Erreur récupération demandes", error: err.message });
    }
};

// --- Manager: Get Pending Requests ---
exports.getManagerLeaves = async (req, res) => {
    try {
        // Find employees managed by current user
        const employees = await User.find({ managerId: req.user._id }).select('_id');
        const employeeIds = employees.map(e => e._id);

        const leaves = await LeaveRequest.find({
            employeeId: { $in: employeeIds },
            status: 'pending_manager'
        })
            .populate('employeeId', 'fullName email department')
            .sort({ createdAt: 1 });

        res.json(leaves);
    } catch (err) {
        res.status(500).json({ message: "Erreur récupération demandes manager", error: err.message });
    }
};

// --- Manager: Validate/Reject ---
exports.validateManager = async (req, res) => {
    try {
        const { leaveId, action, comment } = req.body; // action: 'approve' or 'reject'
        const leave = await LeaveRequest.findById(leaveId).populate('employeeId');

        if (!leave) return res.status(404).json({ message: "Demande non trouvée" });

        if (action === 'approve') {
            leave.status = 'pending_rh';
            leave.managerComment = comment;
            leave.history.push({
                status: 'pending_rh',
                updatedBy: req.user._id,
                comment: comment || "Validé par Manager"
            });

            // Notify RH - DISABLED AS PER REQUEST
            /*
            const rhUsers = await User.find({ role: 'rh' });
            rhUsers.forEach(rh => {
                sendEmail({
                    to: rh.email,
                    subject: "Validation Congé requise (RH)",
                    text: `La demande de congé de ${leave.employeeId.fullName} a été validée par le manager. En attente de validation finale RH.`
                });
            });
            */

        } else {
            leave.status = 'rejected';
            leave.managerComment = comment;
            leave.history.push({
                status: 'rejected',
                updatedBy: req.user._id,
                comment: comment || "Rejeté par Manager"
            });

            // Notify Employee of Rejection
            sendEmail({
                to: leave.employeeId.email,
                subject: "Demande de congé refusée",
                text: `Votre demande de congé a été refusée par votre manager. Motif : ${comment}`
            });
        }

        await leave.save();
        res.json(leave);
    } catch (err) {
        res.status(500).json({ message: "Erreur validation manager", error: err.message });
    }
};

// --- RH: Get Pending Requests ---
exports.getRHLeaves = async (req, res) => {
    try {
        const leaves = await LeaveRequest.find({ status: 'pending_rh' })
            .populate('employeeId', 'fullName email department')
            .sort({ createdAt: 1 });

        res.json(leaves);
    } catch (err) {
        res.status(500).json({ message: "Erreur récupération demandes RH", error: err.message });
    }
};

// --- RH: Final Decision ---
exports.validateRH = async (req, res) => {
    try {
        const { leaveId, action, comment } = req.body;
        const leave = await LeaveRequest.findById(leaveId).populate('employeeId');

        if (!leave) return res.status(404).json({ message: "Demande non trouvée" });

        if (action === 'approve') {
            leave.status = 'approved';
            leave.rhComment = comment;
            leave.history.push({
                status: 'approved',
                updatedBy: req.user._id,
                comment: comment || "Validé par RH"
            });

            sendEmail({
                to: leave.employeeId.email,
                subject: "Demande de congé approuvée",
                text: `Votre demande de congé a été validée définitivement par les RH. Bonnes vacances !`
            });

        } else {
            leave.status = 'rejected';
            leave.rhComment = comment;
            leave.history.push({
                status: 'rejected',
                updatedBy: req.user._id,
                comment: comment || "Rejeté par RH"
            });

            sendEmail({
                to: leave.employeeId.email,
                subject: "Demande de congé refusée (RH)",
                text: `Votre demande de congé a été refusée par les RH. Motif : ${comment}`
            });
        }

        await leave.save();
        res.json(leave);
    } catch (err) {
        res.status(500).json({ message: "Erreur validation RH", error: err.message });
    }
};
