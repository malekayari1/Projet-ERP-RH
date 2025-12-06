const mongoose = require("mongoose");

const CampaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  
  // L'utilisateur qui a créé la campagne
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Date de début et fin
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  // Statut de la campagne
  status: {
    type: String,
    enum: ["active", "completed", "pending"],
    default: "pending"
  },

  createdAt: { type: Date, default: Date.now }
});

// IMPORTANT: Empêcher l'erreur OverwriteModelError
module.exports =
  mongoose.models.Campaign || mongoose.model("Campaign", CampaignSchema);