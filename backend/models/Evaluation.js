const mongoose = require("mongoose");

const EvaluationSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
  punctuality: { type: Number, default: 0 },
  initiative: { type: Number, default: 0 },
  workQuality: { type: Number, default: 0 },
  otherCriteria: { type: Map, of: Number },
  score: { type: Number }, // computed
  commentManager: { type: String },
  commentRH: { type: String },
  status: { type: String, enum: ["pending","validated_manager","validated_rh"], default: "pending" },
  finalResult: { type: String, enum: ["failed","normal","excellent"] },
  createdAt: { type: Date, default: Date.now }
});

// IMPORTANT: Empêcher l'erreur OverwriteModelError
module.exports =
  mongoose.models.Evaluation || mongoose.model("Evaluation", EvaluationSchema);
