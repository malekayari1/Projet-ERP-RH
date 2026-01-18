const mongoose = require("mongoose");

const SentEmailSchema = new mongoose.Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User" // Can be null if automated by system
    },
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EmailTemplate"
    },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    status: {
        type: String,
        enum: ["sent", "failed", "pending"],
        default: "sent"
    },
    error: { type: String },
    sentAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("SentEmail", SentEmailSchema);
