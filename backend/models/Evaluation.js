const mongoose = require("mongoose");

const EvaluationSchema = new mongoose.Schema({
  // Références
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  chefEquipeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Chef d'équipe qui évalue
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Manager qui valide
  rhId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // RH qui approuve
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },

  // Critères d'évaluation (notes sur 20)
  punctuality: { type: Number, min: 0, max: 20, default: 0 },      // Ponctualité
  workQuality: { type: Number, min: 0, max: 20, default: 0 },      // Qualité du travail
  initiative: { type: Number, min: 0, max: 20, default: 0 },       // Initiative
  teamwork: { type: Number, min: 0, max: 20, default: 0 },         // Travail d'équipe
  communication: { type: Number, min: 0, max: 20, default: 0 },    // Communication

  // Critères supplémentaires personnalisés
  otherCriteria: { type: Map, of: Number },

  // Auto-évaluation de l'employé (notes sur 20)
  selfPunctuality: { type: Number, min: 0, max: 20 },
  selfWorkQuality: { type: Number, min: 0, max: 20 },
  selfInitiative: { type: Number, min: 0, max: 20 },
  selfTeamwork: { type: Number, min: 0, max: 20 },
  selfCommunication: { type: Number, min: 0, max: 20 },
  selfComment: { type: String },

  // Score calculé (sur 100)
  score: { type: Number, min: 0, max: 100 },
  selfScore: { type: Number, min: 0, max: 100 },

  // Commentaires à chaque étape
  commentChefEquipe: { type: String },
  commentManager: { type: String },
  commentRH: { type: String },

  // Plan d'action et objectifs
  objectives: [{
    title: { type: String },
    description: { type: String },
    deadline: { type: Date },
    status: { type: String, enum: ["pending", "in_progress", "completed"], default: "pending" }
  }],
  trainingNeeds: { type: String }, // Besoins en formation

  // Statut du workflow
  status: {
    type: String,
    enum: [
      "pending",              // En attente Initialisation
      "self_evaluating",      // Employé en train de se noter
      "evaluated",            // Évalué par le chef d'équipe
      "validated_manager",    // Validé par le manager
      "validated_rh",         // Validé par les RH
      "decision_made",        // Décision finale prise
      "notified",             // Employé notifié
      "acknowledged",         // Reconnu/Signé par l'employé
      "rejected"              // Rejeté
    ],
    default: "pending"
  },

  // Résultat final basé sur le score
  finalResult: {
    type: String,
    enum: ["failed", "normal", "excellent"] // < 40, 40-80, > 80
  },

  // Décision RH finale
  hrDecision: {
    type: String,
    enum: ["prime", "formation", "sanction", "aucune"],
    default: "aucune"
  },
  hrDecisionDetails: { type: String },

  // Signature/Reconnaissance
  employeeAcknowledged: { type: Boolean, default: false },
  employeeAcknowledgedAt: { type: Date },
  employeeFinalComment: { type: String },

  // Dates importantes
  createdAt: { type: Date, default: Date.now },
  selfEvaluatedAt: { type: Date },
  evaluatedAt: { type: Date },
  validatedByManagerAt: { type: Date },
  validatedByRHAt: { type: Date },
  decisionMadeAt: { type: Date },
  notifiedAt: { type: Date }
});

// Calculer le score et le résultat final
EvaluationSchema.methods.calculateScore = function () {
  const criteria = [
    this.punctuality,
    this.workQuality,
    this.initiative,
    this.teamwork,
    this.communication
  ];

  const selfCriteria = [
    this.selfPunctuality,
    this.selfWorkQuality,
    this.selfInitiative,
    this.selfTeamwork,
    this.selfCommunication
  ];

  // Moyenne des critères (sur 20) convertie en score sur 100
  const sum = criteria.reduce((acc, val) => acc + (val || 0), 0);
  this.score = Math.round((sum / criteria.length) * 5);

  const selfSum = selfCriteria.reduce((acc, val) => acc + (val || 0), 0);
  this.selfScore = Math.round((selfSum / selfCriteria.length) * 5);

  // Déterminer le résultat final
  if (this.score < 40) {
    this.finalResult = "failed";
  } else if (this.score >= 80) {
    this.finalResult = "excellent";
  } else {
    this.finalResult = "normal";
  }

  return {
    score: this.score,
    selfScore: this.selfScore,
    finalResult: this.finalResult
  };
};

// IMPORTANT: Empêcher l'erreur OverwriteModelError
module.exports =
  mongoose.models.Evaluation || mongoose.model("Evaluation", EvaluationSchema);
