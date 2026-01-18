const mongoose = require("mongoose");

const EmailTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g., "WELCOME_MAIL", "DOC_REMINDER", "TRIAL_END"
    subject: { type: String, required: true },
    body: { type: String, required: true }, // Supports placeholders like {{fullName}}, {{missingDocs}}
    description: { type: String },
    roleSpecific: {
        type: String,
        enum: ["all", "rh", "manager", "employee"],
        default: "all"
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("EmailTemplate", EmailTemplateSchema);
