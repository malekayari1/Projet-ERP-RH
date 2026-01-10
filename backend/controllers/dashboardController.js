const User = require("../models/User");
const Campaign = require("../models/Campaign");
const Evaluation = require("../models/Evaluation");
const Notification = require("../models/Notification");

// Statistiques du dashboard selon le rôle
exports.getDashboardStats = async (req, res) => {
  const userRole = req.user.role;
  const userId = req.user._id;

  let stats = {};

  switch (userRole) {
    case "rh":
      stats = await getRHStats();
      break;
    case "manager":
      stats = await getManagerStats();
      break;
    case "chef_equipe":
      stats = await getChefEquipeStats(userId);
      break;
    case "employee":
      stats = await getEmployeeStats(userId);
      break;
    default:
      stats = {};
  }

  res.json(stats);
};

// Statistiques pour RH
async function getRHStats() {
  const totalEmployees = await User.countDocuments({ role: "employee", isActive: true });
  const totalChefsEquipe = await User.countDocuments({ role: "chef_equipe", isActive: true });
  const totalManagers = await User.countDocuments({ role: "manager", isActive: true });

  const activeCampaigns = await Campaign.countDocuments({
    status: { $in: ["active", "evaluation", "validation_manager", "validation_rh"] }
  });

  const pendingEvaluations = await Evaluation.countDocuments({ status: "validated_manager" });
  const completedEvaluations = await Evaluation.countDocuments({ status: "notified" });

  // Statistiques des résultats
  const results = await Evaluation.aggregate([
    { $match: { finalResult: { $ne: null } } },
    { $group: { _id: "$finalResult", count: { $sum: 1 } } }
  ]);

  const resultStats = {
    excellent: 0,
    normal: 0,
    failed: 0
  };
  results.forEach(r => {
    if (r._id) resultStats[r._id] = r.count;
  });

  // Score moyen
  const avgScoreResult = await Evaluation.aggregate([
    { $match: { score: { $ne: null } } },
    { $group: { _id: null, avgScore: { $avg: "$score" } } }
  ]);
  const averageScore = avgScoreResult[0]?.avgScore || 0;

  return {
    totalEmployees,
    totalChefsEquipe,
    totalManagers,
    activeCampaigns,
    pendingEvaluations,
    completedEvaluations,
    resultStats,
    averageScore: Math.round(averageScore)
  };
}

// Statistiques pour Manager
async function getManagerStats() {
  const pendingValidation = await Evaluation.countDocuments({ status: "evaluated" });
  const validated = await Evaluation.countDocuments({
    status: { $in: ["validated_manager", "validated_rh", "decision_made", "notified"] }
  });

  const activeCampaigns = await Campaign.countDocuments({
    status: { $in: ["active", "evaluation", "validation_manager"] }
  });

  // Score moyen des évaluations validées
  const avgScoreResult = await Evaluation.aggregate([
    { $match: { status: { $in: ["validated_manager", "validated_rh", "decision_made", "notified"] }, score: { $ne: null } } },
    { $group: { _id: null, avgScore: { $avg: "$score" } } }
  ]);
  const averageScore = avgScoreResult[0]?.avgScore || 0;

  return {
    pendingValidation,
    validated,
    activeCampaigns,
    averageScore: Math.round(averageScore)
  };
}

// Statistiques pour Chef d'équipe
async function getChefEquipeStats(userId) {
  // Employés supervisés
  const teamMembers = await User.countDocuments({
    supervisorId: userId,
    role: "employee",
    isActive: true
  });

  const employeeIds = await User.find({ supervisorId: userId }).distinct("_id");

  const pendingEvaluations = await Evaluation.countDocuments({
    employeeId: { $in: employeeIds },
    status: "pending"
  });

  const completedEvaluations = await Evaluation.countDocuments({
    employeeId: { $in: employeeIds },
    status: { $ne: "pending" }
  });

  // Score moyen de l'équipe
  const avgScoreResult = await Evaluation.aggregate([
    { $match: { employeeId: { $in: employeeIds }, score: { $ne: null } } },
    { $group: { _id: null, avgScore: { $avg: "$score" } } }
  ]);
  const averageScore = avgScoreResult[0]?.avgScore || 0;

  return {
    teamMembers,
    pendingEvaluations,
    completedEvaluations,
    averageScore: Math.round(averageScore)
  };
}

// Statistiques pour Employé
async function getEmployeeStats(userId) {
  const myEvaluations = await Evaluation.countDocuments({
    employeeId: userId,
    status: { $ne: "pending" }
  });

  // Dernière évaluation
  const lastEvaluation = await Evaluation.findOne({
    employeeId: userId,
    status: { $ne: "pending" }
  })
    .sort({ evaluatedAt: -1, notifiedAt: -1 })
    .populate("campaignId", "title");

  // Score moyen
  const avgScoreResult = await Evaluation.aggregate([
    { $match: { employeeId: userId, score: { $ne: null }, status: "notified" } },
    { $group: { _id: null, avgScore: { $avg: "$score" } } }
  ]);
  const averageScore = avgScoreResult[0]?.avgScore || 0;

  // Notifications non lues
  const unreadNotifications = await Notification.countDocuments({
    userId,
    read: false
  });

  return {
    totalEvaluations: myEvaluations,
    lastEvaluation: lastEvaluation ? {
      score: lastEvaluation.score,
      result: lastEvaluation.finalResult,
      campaign: lastEvaluation.campaignId?.title,
      date: lastEvaluation.notifiedAt
    } : null,
    averageScore: Math.round(averageScore),
    unreadNotifications
  };
}

// Activités récentes
exports.getRecentActivities = async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;

  let activities = [];

  // Notifications récentes
  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(5);

  activities = notifications.map(n => ({
    id: n._id,
    type: "notification",
    title: n.title,
    description: n.message,
    date: n.createdAt,
    read: n.read
  }));

  // Ajouter les évaluations récentes selon le rôle
  if (userRole === "chef_equipe") {
    const employeeIds = await User.find({ supervisorId: userId }).distinct("_id");
    const recentEvaluations = await Evaluation.find({
      employeeId: { $in: employeeIds }
    })
      .populate("employeeId", "fullName")
      .populate("campaignId", "title")
      .sort({ updatedAt: -1 })
      .limit(5);

    const evalActivities = recentEvaluations.map(e => ({
      id: e._id,
      type: "evaluation",
      title: `Évaluation - ${e.employeeId?.fullName}`,
      description: `Campagne: ${e.campaignId?.title} - Statut: ${e.status}`,
      date: e.updatedAt || e.createdAt,
      status: e.status
    }));

    activities = [...activities, ...evalActivities];
  }

  // Trier par date
  activities.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json(activities.slice(0, 10));
};

// Statistiques globales pour rapport
exports.getGlobalStats = async (req, res) => {
  const { campaignId, department, startDate, endDate } = req.query;

  const matchFilter = {};
  if (campaignId) matchFilter.campaignId = campaignId;

  // Filtrer par département si spécifié
  let employeeIds = null;
  if (department) {
    const employees = await User.find({ department, role: "employee" }).distinct("_id");
    employeeIds = employees;
    matchFilter.employeeId = { $in: employees };
  }

  // Statistiques générales
  const totalEvaluations = await Evaluation.countDocuments(matchFilter);

  const statusStats = await Evaluation.aggregate([
    { $match: matchFilter },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  const resultStats = await Evaluation.aggregate([
    { $match: { ...matchFilter, finalResult: { $ne: null } } },
    { $group: { _id: "$finalResult", count: { $sum: 1 } } }
  ]);

  const decisionStats = await Evaluation.aggregate([
    { $match: { ...matchFilter, hrDecision: { $ne: null } } },
    { $group: { _id: "$hrDecision", count: { $sum: 1 } } }
  ]);

  const avgScoreResult = await Evaluation.aggregate([
    { $match: { ...matchFilter, score: { $ne: null } } },
    { $group: { _id: null, avgScore: { $avg: "$score" }, minScore: { $min: "$score" }, maxScore: { $max: "$score" } } }
  ]);

  // Statistiques par département
  const departmentStats = await Evaluation.aggregate([
    { $match: matchFilter },
    {
      $lookup: {
        from: "users",
        localField: "employeeId",
        foreignField: "_id",
        as: "employee"
      }
    },
    { $unwind: "$employee" },
    {
      $group: {
        _id: "$employee.department",
        count: { $sum: 1 },
        avgScore: { $avg: "$score" },
        excellent: { $sum: { $cond: [{ $eq: ["$finalResult", "excellent"] }, 1, 0] } },
        normal: { $sum: { $cond: [{ $eq: ["$finalResult", "normal"] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ["$finalResult", "failed"] }, 1, 0] } }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.json({
    totalEvaluations,
    statusStats: statusStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
    resultStats: resultStats.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
    decisionStats: decisionStats.reduce((acc, d) => ({ ...acc, [d._id]: d.count }), {}),
    scoreStats: avgScoreResult[0] || { avgScore: 0, minScore: 0, maxScore: 0 },
    departmentStats
  });
};

