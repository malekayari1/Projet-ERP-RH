const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name: {
        type: String,
        required: true,
        enum: ["RIB", "CNI", "Passport", "Justificatif Domicile", "Diplôme", "Contrat Signé", "Photo"]
    },
    status: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending"
    },
    fileUrl: {
        type: String,
        required: false // Would be mandatory in real production with storage
    },
    rejectionReason: {
        type: String
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    verifiedAt: {
        type: Date
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
});

module.exports = mongoose.model("Document", DocumentSchema);
