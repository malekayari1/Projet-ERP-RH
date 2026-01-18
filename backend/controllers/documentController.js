const Document = require("../models/Document");
const User = require("../models/User");

// --- Employee: Upload (Real File) ---
exports.uploadDocument = async (req, res) => {
    try {
        const { name } = req.body;
        const employeeId = req.user._id;

        if (!req.file) {
            return res.status(400).json({ message: "Aucun fichier n'a été fourni" });
        }

        // The path where the file is stored locally
        const fileUrl = `/uploads/${req.file.filename}`;

        // Check if a document with this name already exists for this user
        let doc = await Document.findOne({ employeeId, name });

        if (doc) {
            // Update existing (e.g., if re-uploading after rejection)
            doc.status = "pending";
            doc.fileUrl = fileUrl;
            doc.uploadedAt = Date.now();
            doc.rejectionReason = null; // Clear rejection reason
            await doc.save();
        } else {
            // Create new
            doc = await Document.create({
                employeeId,
                name,
                fileUrl,
                status: "pending"
            });
        }

        res.status(201).json({ message: "Document mis en ligne avec succès !", document: doc });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de l'upload", error: err.message });
    }
};

// --- RH: Get Pending Documents ---
exports.getPendingDocuments = async (req, res) => {
    try {
        const docs = await Document.find({ status: "pending" })
            .populate("employeeId", "fullName email")
            .sort({ uploadedAt: -1 });
        res.json(docs);
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la récupération des documents", error: err.message });
    }
};

// --- RH: Verify/Reject Document ---
exports.verifyDocument = async (req, res) => {
    try {
        const { docId, status, rejectionReason } = req.body; // status: 'verified' or 'rejected'

        const doc = await Document.findById(docId);
        if (!doc) return res.status(404).json({ message: "Document non trouvé" });

        doc.status = status;
        if (status === "rejected") {
            doc.rejectionReason = rejectionReason;
        } else {
            doc.verifiedAt = Date.now();
            doc.verifiedBy = req.user._id;
        }

        await doc.save();

        res.json({ message: `Document ${status === 'verified' ? 'vérifié' : 'rejeté'} avec succès`, document: doc });
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la vérification", error: err.message });
    }
};
