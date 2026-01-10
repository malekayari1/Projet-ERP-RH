const Evaluation = require("../models/Evaluation");
const User = require("../models/User");
const Campaign = require("../models/Campaign");
const Notification = require("../models/Notification");

// ==================== CHEF D'ÉQUIPE ====================

// Obtenir les évaluations à faire pour un chef d'équipe
exports.getEvaluationsForChefEquipe = async (req, res) => {
  const { campaignId } = req.query;
  const filter = { status: "pending" };

  if (campaignId) filter.campaignId = campaignId;

  // Récupérer les employés supervisés par ce chef d'équipe
  const employees = await User.find({
    supervisorId: req.user._id,
    role: "employee",
    isActive: true
  });

  const employeeIds = employees.map(e => e._id);
  filter.employeeId = { $in: employeeIds };

  const evaluations = await Evaluation.find(filter)
    .populate("employeeId", "fullName email department")
    .populate("campaignId", "title startDate endDate")
    .sort({ createdAt: -1 });

  res.json(evaluations);
};

// Chef d'équipe soumet une évaluation
exports.submitEvaluationByChefEquipe = async (req, res) => {
  const { id } = req.params;
  const {
    punctuality,
    workQuality,
    initiative,
    teamwork,
    communication,
    commentChefEquipe
  } = req.body;

  const evaluation = await Evaluation.findById(id);

  if (!evaluation) {
    return res.status(404).json({ message: "Évaluation non trouvée" });
  }

  if (evaluation.status !== "pending") {
    return res.status(400).json({ message: "Cette évaluation a déjà été soumise" });
  }

  // Vérifier que l'employé est bien supervisé par ce chef d'équipe
  const employee = await User.findById(evaluation.employeeId);
  if (!employee || employee.supervisorId?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Vous n'êtes pas autorisé à évaluer cet employé" });
  }

  // Mettre à jour l'évaluation
  evaluation.chefEquipeId = req.user._id;
  evaluation.punctuality = punctuality;
  evaluation.workQuality = workQuality;
  evaluation.initiative = initiative;
  evaluation.teamwork = teamwork;
  evaluation.communication = communication;
  evaluation.commentChefEquipe = commentChefEquipe;

  // Nouveaux champs professionnels
  if (req.body.objectives) evaluation.objectives = req.body.objectives;
  if (req.body.trainingNeeds) evaluation.trainingNeeds = req.body.trainingNeeds;

  // Calculer le score
  evaluation.calculateScore();

  evaluation.status = "evaluated";
  evaluation.evaluatedAt = new Date();

  await evaluation.save();

  // Notifier le manager
  const manager = await User.findOne({ role: "manager" });
  if (manager) {
    await Notification.create({
      userId: manager._id,
      title: "Nouvelle évaluation à valider",
      message: `L'évaluation de ${employee.fullName} est prête pour validation.`
    });
  }

  // Notifier l'employé
  await Notification.create({
    userId: employee._id,
    title: "Votre évaluation a été soumise",
    message: `Votre chef d'équipe a terminé votre évaluation pour la campagne "${evaluation.campaignId.title || 'en cours'}". Vous pouvez dès à présent consulter les détails.`
  });

  res.json(evaluation);
};

// ==================== MANAGER ====================

// Obtenir les évaluations à valider pour un manager
exports.getEvaluationsForManager = async (req, res) => {
  const { campaignId, status } = req.query;
  const filter = { status: status || "evaluated" };

  if (campaignId) filter.campaignId = campaignId;

  const evaluations = await Evaluation.find(filter)
    .populate("employeeId", "fullName email department")
    .populate("chefEquipeId", "fullName")
    .populate("campaignId", "title startDate endDate")
    .sort({ evaluatedAt: -1 });

  res.json(evaluations);
};

// Manager valide une évaluation
exports.validateByManager = async (req, res) => {
  const { id } = req.params;
  const { commentManager, approved } = req.body;

  const evaluation = await Evaluation.findById(id);

  if (!evaluation) {
    return res.status(404).json({ message: "Évaluation non trouvée" });
  }

  if (evaluation.status !== "evaluated") {
    return res.status(400).json({ message: "Cette évaluation n'est pas en attente de validation manager" });
  }

  evaluation.managerId = req.user._id;
  evaluation.commentManager = commentManager;
  evaluation.validatedByManagerAt = new Date();

  if (approved === false) {
    // Renvoyer au chef d'équipe pour modification
    evaluation.status = "pending";
    await evaluation.save();

    // Notifier le chef d'équipe
    if (evaluation.chefEquipeId) {
      await Notification.create({
        userId: evaluation.chefEquipeId,
        title: "Évaluation à réviser",
        message: `L'évaluation nécessite des modifications. Commentaire: ${commentManager}`
      });
    }

    return res.json({ message: "Évaluation renvoyée pour révision", evaluation });
  }

  evaluation.status = "validated_manager";
  await evaluation.save();

  // Notifier les RH
  const rhUsers = await User.find({ role: "rh" });
  for (const rh of rhUsers) {
    await Notification.create({
      userId: rh._id,
      title: "Évaluation à approuver",
      message: `Une évaluation validée par le manager est prête pour approbation RH.`
    });
  }

  res.json(evaluation);
};

// ==================== RH ====================

// Obtenir les évaluations à approuver pour les RH
exports.getEvaluationsForRH = async (req, res) => {
  const { campaignId, status } = req.query;
  const filter = {};

  if (status) {
    filter.status = status;
  } else {
    filter.status = { $in: ["validated_manager", "validated_rh", "decision_made"] };
  }

  if (campaignId) filter.campaignId = campaignId;

  const evaluations = await Evaluation.find(filter)
    .populate("employeeId", "fullName email department")
    .populate("chefEquipeId", "fullName")
    .populate("managerId", "fullName")
    .populate("campaignId", "title startDate endDate")
    .sort({ validatedByManagerAt: -1 });

  res.json(evaluations);
};

// RH approuve une évaluation
exports.validateByRH = async (req, res) => {
  const { id } = req.params;
  const { commentRH, approved } = req.body;

  const evaluation = await Evaluation.findById(id);

  if (!evaluation) {
    return res.status(404).json({ message: "Évaluation non trouvée" });
  }

  if (evaluation.status !== "validated_manager") {
    return res.status(400).json({ message: "Cette évaluation n'est pas en attente d'approbation RH" });
  }

  evaluation.rhId = req.user._id;
  evaluation.commentRH = commentRH;
  evaluation.validatedByRHAt = new Date();

  if (approved === false) {
    // Renvoyer au manager
    evaluation.status = "evaluated";
    await evaluation.save();

    // Notifier le manager
    if (evaluation.managerId) {
      await Notification.create({
        userId: evaluation.managerId,
        title: "Évaluation à réviser",
        message: `L'évaluation nécessite des modifications. Commentaire RH: ${commentRH}`
      });
    }

    return res.json({ message: "Évaluation renvoyée au manager", evaluation });
  }

  evaluation.status = "validated_rh";
  await evaluation.save();

  res.json(evaluation);
};

// RH prend une décision finale (prime/formation/sanction)
exports.makeDecision = async (req, res) => {
  const { id } = req.params;
  const { hrDecision, hrDecisionDetails } = req.body;

  const evaluation = await Evaluation.findById(id);

  if (!evaluation) {
    return res.status(404).json({ message: "Évaluation non trouvée" });
  }

  if (evaluation.status !== "validated_rh") {
    return res.status(400).json({ message: "L'évaluation doit être approuvée avant de prendre une décision" });
  }

  if (!["prime", "formation", "sanction", "aucune"].includes(hrDecision)) {
    return res.status(400).json({ message: "Décision invalide" });
  }

  evaluation.hrDecision = hrDecision;
  evaluation.hrDecisionDetails = hrDecisionDetails;
  evaluation.status = "decision_made";
  evaluation.decisionMadeAt = new Date();

  await evaluation.save();

  res.json(evaluation);
};

// ==================== NOTIFICATION EMPLOYÉ ====================

// Notifier l'employé de son résultat
exports.notifyEmployee = async (req, res) => {
  const { id } = req.params;

  const evaluation = await Evaluation.findById(id)
    .populate("employeeId", "fullName email")
    .populate("campaignId", "title");

  if (!evaluation) {
    return res.status(404).json({ message: "Évaluation non trouvée" });
  }

  if (evaluation.status !== "decision_made") {
    return res.status(400).json({ message: "La décision doit être prise avant de notifier l'employé" });
  }

  // Créer la notification pour l'employé
  const resultLabels = {
    excellent: "Excellent (Score ≥ 80%)",
    normal: "Satisfaisant (Score 40-80%)",
    failed: "Insuffisant (Score < 40%)"
  };

  const decisionLabels = {
    prime: "Prime",
    formation: "Formation",
    sanction: "Sanction",
    aucune: "Aucune action"
  };

  await Notification.create({
    userId: evaluation.employeeId._id,
    title: "Résultat de votre évaluation",
    message: `Votre évaluation pour "${evaluation.campaignId.title}" est terminée.\n` +
      `Score: ${evaluation.score}/100\n` +
      `Résultat: ${resultLabels[evaluation.finalResult]}\n` +
      `Décision: ${decisionLabels[evaluation.hrDecision]}` +
      (evaluation.hrDecisionDetails ? `\nDétails: ${evaluation.hrDecisionDetails}` : "")
  });

  evaluation.status = "notified";
  evaluation.notifiedAt = new Date();
  await evaluation.save();

  res.json({ message: "Employé notifié avec succès", evaluation });
};

// Notifier tous les employés d'une campagne
exports.notifyAllEmployees = async (req, res) => {
  const { campaignId } = req.params;

  const evaluations = await Evaluation.find({
    campaignId,
    status: "decision_made"
  }).populate("employeeId", "fullName email")
    .populate("campaignId", "title");

  if (evaluations.length === 0) {
    return res.status(400).json({ message: "Aucune évaluation prête à notifier" });
  }

  const resultLabels = {
    excellent: "Excellent (Score ≥ 80%)",
    normal: "Satisfaisant (Score 40-80%)",
    failed: "Insuffisant (Score < 40%)"
  };

  const decisionLabels = {
    prime: "Prime",
    formation: "Formation",
    sanction: "Sanction",
    aucune: "Aucune action"
  };

  let notifiedCount = 0;

  for (const evaluation of evaluations) {
    await Notification.create({
      userId: evaluation.employeeId._id,
      title: "Résultat de votre évaluation",
      message: `Votre évaluation pour "${evaluation.campaignId.title}" est terminée.\n` +
        `Score: ${evaluation.score}/100\n` +
        `Résultat: ${resultLabels[evaluation.finalResult]}\n` +
        `Décision: ${decisionLabels[evaluation.hrDecision]}` +
        (evaluation.hrDecisionDetails ? `\nDétails: ${evaluation.hrDecisionDetails}` : "")
    });

    evaluation.status = "notified";
    evaluation.notifiedAt = new Date();
    await evaluation.save();
    notifiedCount++;
  }

  // Mettre à jour le statut de la campagne si toutes les évaluations sont notifiées
  const remainingEvaluations = await Evaluation.countDocuments({
    campaignId,
    status: { $ne: "notified" }
  });

  if (remainingEvaluations === 0) {
    await Campaign.findByIdAndUpdate(campaignId, {
      status: "completed",
      completedAt: new Date()
    });
  }

  res.json({ message: `${notifiedCount} employé(s) notifié(s)` });
};

// ==================== EMPLOYÉ ====================

// Obtenir les évaluations d'un employé (ses propres résultats)
exports.getMyEvaluations = async (req, res) => {
  const evaluations = await Evaluation.find({
    employeeId: req.user._id,
    status: { $ne: "pending" } // Toutes sauf celles en attente initiale
  })
    .populate("campaignId", "title startDate endDate")
    .populate("chefEquipeId", "fullName")
    .populate("managerId", "fullName")
    .sort({ notifiedAt: -1 });

  res.json(evaluations);
};

// Obtenir une évaluation spécifique (pour l'employé)
exports.getMyEvaluation = async (req, res) => {
  const evaluation = await Evaluation.findOne({
    _id: req.params.id,
    employeeId: req.user._id,
    status: { $ne: "pending" }
  })
    .populate("campaignId", "title startDate endDate")
    .populate("chefEquipeId", "fullName")
    .populate("managerId", "fullName");

  if (!evaluation) {
    return res.status(404).json({ message: "Évaluation non trouvée ou non accessible" });
  }

  res.json(evaluation);
};

// ==================== GÉNÉRAL ====================

// Obtenir toutes les évaluations d'une campagne
exports.getEvaluationsByCampaign = async (req, res) => {
  const { campaignId } = req.params;
  const { status } = req.query;

  const filter = { campaignId };
  if (status) filter.status = status;

  const evaluations = await Evaluation.find(filter)
    .populate("employeeId", "fullName email department")
    .populate("chefEquipeId", "fullName")
    .populate("managerId", "fullName")
    .populate("rhId", "fullName")
    .sort({ createdAt: -1 });

  res.json(evaluations);
};

// Obtenir une évaluation par ID
exports.getEvaluation = async (req, res) => {
  const evaluation = await Evaluation.findById(req.params.id)
    .populate("employeeId", "fullName email department")
    .populate("chefEquipeId", "fullName")
    .populate("managerId", "fullName")
    .populate("rhId", "fullName")
    .populate("campaignId", "title startDate endDate");

  if (!evaluation) {
    return res.status(404).json({ message: "Évaluation non trouvée" });
  }

  // Vérifier les permissions selon le rôle
  const userRole = req.user.role;
  const userId = req.user._id.toString();

  if (userRole === "employee" && evaluation.employeeId._id.toString() !== userId) {
    return res.status(403).json({ message: "Accès non autorisé" });
  }

  res.json(evaluation);
};

// L'employé soumet son auto-évaluation
exports.submitSelfEvaluation = async (req, res) => {
  const { id } = req.params;
  const {
    selfPunctuality,
    selfWorkQuality,
    selfInitiative,
    selfTeamwork,
    selfCommunication,
    selfComment
  } = req.body;

  const evaluation = await Evaluation.findOne({
    _id: id,
    employeeId: req.user._id
  });

  if (!evaluation) {
    return res.status(404).json({ message: "Évaluation non trouvée" });
  }

  if (!["pending", "self_evaluating"].includes(evaluation.status)) {
    return res.status(400).json({ message: "Vous ne pouvez plus modifier votre auto-évaluation" });
  }

  evaluation.selfPunctuality = selfPunctuality;
  evaluation.selfWorkQuality = selfWorkQuality;
  evaluation.selfInitiative = selfInitiative;
  evaluation.selfTeamwork = selfTeamwork;
  evaluation.selfCommunication = selfCommunication;
  evaluation.selfComment = selfComment;
  evaluation.selfEvaluatedAt = new Date();
  evaluation.status = "self_evaluating";

  evaluation.calculateScore();
  await evaluation.save();

  res.json(evaluation);
};

// L'employé reconnaît avoir pris connaissance de l'évaluation finale
exports.acknowledgeEvaluation = async (req, res) => {
  const { id } = req.params;
  const { employeeFinalComment } = req.body;

  const evaluation = await Evaluation.findOne({
    _id: id,
    employeeId: req.user._id
  });

  if (!evaluation) {
    return res.status(404).json({ message: "Évaluation non trouvée" });
  }

  if (evaluation.status !== "notified") {
    return res.status(400).json({ message: "L'évaluation n'est pas encore prête pour signature" });
  }

  evaluation.employeeAcknowledged = true;
  evaluation.employeeAcknowledgedAt = new Date();
  evaluation.employeeFinalComment = employeeFinalComment;
  evaluation.status = "acknowledged";

  await evaluation.save();

  // Notifier le chef d'équipe que l'employé a signé
  if (evaluation.chefEquipeId) {
    await Notification.create({
      userId: evaluation.chefEquipeId,
      title: "Évaluation signée",
      message: `${req.user.fullName} a pris connaissance de son évaluation.`
    });
  }

  res.json(evaluation);
};
