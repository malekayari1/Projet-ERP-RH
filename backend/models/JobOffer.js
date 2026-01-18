const mongoose = require("mongoose");

const JobOfferSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    department: { type: String, required: true },

    // Budget management
    budget: { type: Number, required: true },
    currency: { type: String, default: "TND" },

    // Recruitment workflow status
    status: {
        type: String,
        enum: [
            "analysis",   // Step 1: Need & Budget Analysis (default)
            "published",  // Step 2: Published / Receiving applications
            "closed"      // Final state
        ],
        default: "analysis"
    },

    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    createdAt: { type: Date, default: Date.now },
    publishedAt: { type: Date },
    closedAt: { type: Date }
});

module.exports = mongoose.model("JobOffer", JobOfferSchema);
