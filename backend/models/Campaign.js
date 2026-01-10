const mongoose = require("mongoose");

const CampaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  
  // L'utilisateur qui a créé la campagne (RH)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Département concerné (optionnel - si vide, tous les départements)
  department: { type: String },

  // Date de début et fin de la période d'évaluation
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  // Statut de la campagne selon le workflow
  status: {
    type: String,
    enum: [
      "pending",           // En attente de lancement
      "active",            // Campagne lancée - en cours d'évaluation
      "evaluation",        // Phase d'évaluation par les chefs d'équipe
      "validation_manager", // Phase de validation par les managers
      "validation_rh",     // Phase de validation par les RH
      "completed",         // Campagne terminée
      "cancelled"          // Campagne annulée
    ],
    default: "pending"
  },

  // Statistiques de la campagne
  stats: {
    totalEmployees: { type: Number, default: 0 },
    evaluationsCompleted: { type: Number, default: 0 },
    validatedByManager: { type: Number, default: 0 },
    validatedByRH: { type: Number, default: 0 }
  },

  createdAt: { type: Date, default: Date.now },
  launchedAt: { type: Date },
  completedAt: { type: Date }
});

// Méthode pour vérifier si on est dans la période d'évaluation
CampaignSchema.methods.isInEvaluationPeriod = function() {
  const now = new Date();
  return now >= this.startDate && now <= this.endDate;
};

// IMPORTANT: Empêcher l'erreur OverwriteModelError
module.exports =
  mongoose.models.Campaign || mongoose.model("Campaign", CampaignSchema);