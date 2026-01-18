const Campaign = require("../models/Campaign");
const User = require("../models/User");
const Evaluation = require("../models/Evaluation");
const Notification = require("../models/Notification");

// Créer une nouvelle campagne (RH uniquement)
exports.createCampaign = async (req, res) => {
  const { title, description, startDate, endDate, department, customCriteria } = req.body;
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end <= start) {
    return res.status(400).json({ message: "La date de fin doit être après la date de début" });
  }

  const campaign = await Campaign.create({
    title,
    description,
    startDate: start,
    endDate: end,
    department,
    createdBy: req.user._id,
    status: "pending",
    customCriteria
  });

  res.status(201).json(campaign);
};

// Lancer une campagne d'évaluation (RH uniquement)
exports.launchCampaign = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) {
    return res.status(404).json({ message: "Campagne non trouvée" });
  }

  // Vérifier si on est dans la période d'évaluation
  const now = new Date();
  if (now < campaign.startDate) {
    return res.status(400).json({
      message: "La campagne ne peut pas être lancée avant sa date de début"
    });
  }

  if (now > campaign.endDate) {
    return res.status(400).json({
      message: "La période d'évaluation est terminée"
    });
  }

  // Récupérer les employés actifs du département
  const filter = { isActive: true, role: "employee" };
  if (campaign.department) {
    filter.department = campaign.department;
  }

  const employees = await User.find(filter);

  if (employees.length === 0) {
    return res.status(400).json({
      message: "Aucun employé actif trouvé pour ce département"
    });
  }

  // Créer les évaluations pour chaque employé
  const evaluations = [];
  for (const employee of employees) {
    const existingEval = await Evaluation.findOne({
      employeeId: employee._id,
      campaignId: campaign._id
    });

    if (!existingEval) {
      const evaluation = await Evaluation.create({
        employeeId: employee._id,
        campaignId: campaign._id,
        status: "pending"
      });
      evaluations.push(evaluation);
    }
  }

  // Mettre à jour le statut de la campagne
  campaign.status = "active";
  campaign.launchedAt = new Date();
  campaign.stats.totalEmployees = employees.length;
  await campaign.save();

  // Notifier les chefs d'équipe
  const chefsEquipe = await User.find({ role: "chef_equipe" });
  for (const chef of chefsEquipe) {
    await Notification.create({
      userId: chef._id,
      title: "Nouvelle campagne d'évaluation",
      message: `La campagne "${campaign.title}" a été lancée. Vous pouvez commencer les évaluations.`
    });
  }

  res.json({
    message: "Campagne lancée avec succès",
    campaign,
    evaluationsCreated: evaluations.length
  });
};

// Obtenir toutes les campagnes
exports.getCampaigns = async (req, res) => {
  const { status, department } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (department) filter.department = department;

  const campaigns = await Campaign.find(filter)
    .populate("createdBy", "fullName email")
    .sort({ createdAt: -1 });

  res.json(campaigns);
};

// Obtenir les campagnes actives
exports.getActiveCampaigns = async (req, res) => {
  const campaigns = await Campaign.find({
    status: { $in: ["active", "evaluation", "validation_manager", "validation_rh"] }
  })
    .populate("createdBy", "fullName email")
    .sort({ createdAt: -1 });

  res.json(campaigns);
};

// Obtenir une campagne par ID
exports.getCampaignById = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id)
    .populate("createdBy", "fullName email");

  if (!campaign) {
    return res.status(404).json({ message: "Campagne non trouvée" });
  }

  res.json(campaign);
};

// Mettre à jour une campagne
exports.updateCampaign = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    return res.status(404).json({ message: "Campagne non trouvée" });
  }

  // Ne pas permettre la modification si la campagne est déjà lancée
  if (campaign.status !== "pending") {
    return res.status(400).json({
      message: "Impossible de modifier une campagne déjà lancée"
    });
  }

  const { title, description, startDate, endDate, department } = req.body;

  if (title) campaign.title = title;
  if (description !== undefined) campaign.description = description;
  if (startDate) campaign.startDate = new Date(startDate);
  if (endDate) campaign.endDate = new Date(endDate);
  if (department !== undefined) campaign.department = department;
  if (req.body.customCriteria) campaign.customCriteria = req.body.customCriteria;

  await campaign.save();
  res.json(campaign);
};

// Mettre à jour le statut d'une campagne
exports.updateCampaignStatus = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    return res.status(404).json({ message: "Campagne non trouvée" });
  }

  const { status } = req.body;

  // Valider la transition de statut
  const validTransitions = {
    "pending": ["active", "cancelled"],
    "active": ["evaluation", "cancelled"],
    "evaluation": ["validation_manager"],
    "validation_manager": ["validation_rh"],
    "validation_rh": ["completed"],
    "completed": [],
    "cancelled": []
  };

  if (!validTransitions[campaign.status]?.includes(status)) {
    return res.status(400).json({
      message: `Transition de statut invalide: ${campaign.status} -> ${status}`
    });
  }

  campaign.status = status;
  if (status === "completed") {
    campaign.completedAt = new Date();
  }

  await campaign.save();
  res.json(campaign);
};

// Obtenir les statistiques d'une campagne
exports.getCampaignStats = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    return res.status(404).json({ message: "Campagne non trouvée" });
  }

  const evaluations = await Evaluation.find({ campaignId: campaign._id });

  const stats = {
    total: evaluations.length,
    pending: evaluations.filter(e => e.status === "pending").length,
    evaluated: evaluations.filter(e => e.status === "evaluated").length,
    validatedManager: evaluations.filter(e => e.status === "validated_manager").length,
    validatedRH: evaluations.filter(e => e.status === "validated_rh").length,
    decisionMade: evaluations.filter(e => e.status === "decision_made").length,
    notified: evaluations.filter(e => e.status === "notified").length,
    results: {
      excellent: evaluations.filter(e => e.finalResult === "excellent").length,
      normal: evaluations.filter(e => e.finalResult === "normal").length,
      failed: evaluations.filter(e => e.finalResult === "failed").length
    },
    averageScore: evaluations.length > 0
      ? Math.round(evaluations.reduce((acc, e) => acc + (e.score || 0), 0) / evaluations.length)
      : 0
  };

  res.json({ campaign, stats });
};

// Supprimer une campagne (uniquement si pending)
exports.deleteCampaign = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);

  if (!campaign) {
    return res.status(404).json({ message: "Campagne non trouvée" });
  }

  if (campaign.status !== "pending") {
    return res.status(400).json({
      message: "Impossible de supprimer une campagne déjà lancée"
    });
  }

  await Campaign.findByIdAndDelete(req.params.id);
  res.json({ message: "Campagne supprimée avec succès" });
};
