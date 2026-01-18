const Contract = require('../models/Contract');
const User = require('../models/User');

// --- ERP Swimlane: Automatic/Initial Creation ---
const createContract = async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        let { type, employeeId } = req.body;

        // Si c'est un employé qui demande, on force son ID
        if (req.user.role === 'employee') {
            employeeId = req.user._id;
        }

        if (!employeeId || !type || !startDate) {
            return res.status(400).json({ message: "Données manquantes pour la vérification Système ERP." });
        }
        if (endDate && new Date(endDate) <= new Date(startDate)) {
            return res.status(400).json({ message: "Erreur Système : La date de fin doit être après la date de début." });
        }

        const isEmployeeRequest = req.user.role === 'employee';
        const initialHistoryComment = isEmployeeRequest
            ? "Demande de renouvellement initiée par l'employé. En attente de validation RH."
            : "Contrat généré par le système ERP. En attente de validation RH.";

        const contract = await Contract.create({
            employeeId,
            type,
            startDate,
            endDate,
            status: 'rh_pending',
            unsignedFileUrl: `/uploads/contracts/template_${type.toLowerCase()}.pdf`,
            history: [{
                status: 'rh_pending',
                updatedBy: req.user._id,
                comment: initialHistoryComment
            }]
        });

        res.status(201).json(contract);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la création du contrat", error: err.message });
    }
};

// --- RH Swimlane: Content Verification & Validation ---
const rhValidate = async (req, res) => {
    try {
        const { contractId, action, comment } = req.body;
        const contract = await Contract.findById(contractId);
        if (!contract) return res.status(404).json({ message: "Contrat introuvable." });

        if (action === 'approve') {
            contract.status = 'employee_pending';
            contract.rhComment = comment;
            contract.history.push({
                status: 'employee_pending',
                updatedBy: req.user._id,
                comment: comment || "Validé par le Responsable RH. Envoyé pour signature."
            });
        } else {
            contract.status = 'rejected';
            contract.rhComment = comment;
            contract.history.push({
                status: 'rejected',
                updatedBy: req.user._id,
                comment: comment || "Refusé par le Responsable RH."
            });
        }

        await contract.save();
        res.json(contract);
    } catch (err) {
        res.status(500).json({ message: "Erreur validation RH", error: err.message });
    }
};

// --- Employee Swimlane: Digital Signature ---
const employeeSign = async (req, res) => {
    try {
        const { contractId } = req.body;
        const contract = await Contract.findById(contractId);
        if (!contract) return res.status(404).json({ message: "Contrat introuvable." });
        if (contract.status !== 'employee_pending') {
            return res.status(400).json({ message: "Ce contrat n'est pas en attente de signature." });
        }

        contract.status = 'manager_pending';
        contract.signedFileUrl = contract.unsignedFileUrl.replace('template_', 'signed_');
        contract.history.push({
            status: 'manager_pending',
            updatedBy: req.user._id,
            comment: "Signé électroniquement par l'employé. Transmis au manager pour validation finale."
        });

        await contract.save();
        res.json(contract);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la signature", error: err.message });
    }
};

// --- Manager Swimlane: Hierarchical Validation ---
const managerValidate = async (req, res) => {
    try {
        const { contractId, action, comment } = req.body;
        const contract = await Contract.findById(contractId);
        if (!contract) return res.status(404).json({ message: "Contrat introuvable." });

        if (action === 'approve') {
            contract.status = 'validated';
            contract.managerComment = comment;
            contract.history.push({
                status: 'validated',
                updatedBy: req.user._id,
                comment: comment || "Validation hiérarchique effectuée. Contrat archivé."
            });
        } else {
            contract.status = 'rh_pending';
            contract.managerComment = comment;
            contract.history.push({
                status: 'rh_pending',
                updatedBy: req.user._id,
                comment: `Refus Manager : ${comment || 'Revision demandée'}. Retour au RH.`
            });
        }

        await contract.save();
        res.json(contract);
    } catch (err) {
        res.status(500).json({ message: "Erreur validation Manager", error: err.message });
    }
};

// Generic getter filtered by role
const getContracts = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'employee') {
            query.employeeId = req.user._id;
        } else if (req.user.role === 'manager') {
            query.status = { $in: ['manager_pending', 'validated'] };
        }

        const contracts = await Contract.find(query)
            .populate('employeeId', 'fullName email')
            .sort({ createdAt: -1 });

        res.json(contracts);
    } catch (err) {
        res.status(500).json({ message: "Erreur récupération contrats", error: err.message });
    }
};

module.exports = {
    createContract,
    rhValidate,
    employeeSign,
    managerValidate,
    getContracts
};
