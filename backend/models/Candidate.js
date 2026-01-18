const mongoose = require("mongoose");

const CandidateSchema = new mongoose.Schema({
    // Personal Info
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },

    // Application Data
    jobOfferId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "JobOffer",
        required: true
    },
    cvUrl: { type: String }, // Link to stored CV file
    linkedinUrl: { type: String }, // LinkedIn Profile URL
    submittedAt: { type: Date, default: Date.now },

    // Application Workflow Status
    status: {
        type: String,
        enum: [
            "new",              // Step 3: Received
            "interview_rh",     // Step 4: Selected for RH Interview
            "interview_tech",   // Post-RH, Pre-Final (Optional step viewable but not managed by RH logic in this task scope)
            "rejected",         // Rejected at any stage
            "decision_pending", // Step 5: Final Decision Phase
            "hired"             // Step 6: Accepted
        ],
        default: "new"
    },

    // Step 3: Analysis
    analysisNote: { type: String }, // RH notes on CV

    // Step 4: RH Interview
    interviewDate: { type: Date },
    interviewRating: { type: Number, min: 1, max: 10 },
    interviewComment: { type: String },

    // Step 5: Decision & Negotiation
    finalDecision: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    },
    salaryProposal: { type: Number },
    salaryAgreed: { type: Boolean, default: false },

    // Step 6: Notification
    notificationSentAt: { type: Date }
});

module.exports = mongoose.model("Candidate", CandidateSchema);
