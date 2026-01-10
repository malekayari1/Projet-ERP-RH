const Campaign = require("../models/Campaign");
const Evaluation = require("../models/Evaluation");
const User = require("../models/User");
const path = require("path");
const generatePDF = require(path.join(__dirname, "../config/utils/pdfGenerator"));

// Générer un rapport PDF pour une campagne
exports.getCampaignReport = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: "Campagne non trouvée" });

    const evaluations = await Evaluation.find({ campaignId })
      .populate("employeeId", "fullName email department")
      .populate("chefEquipeId", "fullName")
      .populate("managerId", "fullName");
    
    const employeeIds = evaluations
      .map(e => e.employeeId?._id)
      .filter(id => id != null)
      .map(id => id.toString());
    const employees = employeeIds.length > 0 
      ? await User.find({ _id: { $in: employeeIds } }).select("fullName email department")
      : [];
    const employeesMap = {};
    employees.forEach(emp => employeesMap[emp._id.toString()] = emp);

    const pdfBuffer = await generatePDF(campaign, evaluations, employeesMap);

    const safeTitle = campaign.title ? campaign.title.replace(/\s+/g, "_") : "report";
    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
      "Content-Disposition": `attachment; filename="report_${safeTitle}.pdf"`
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ message: "Erreur lors de la génération du rapport PDF", error: error.message });
  }
};

// Obtenir les données de rapport pour une campagne (JSON)
exports.getCampaignReportData = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: "Campagne non trouvée" });

    const evaluations = await Evaluation.find({ campaignId })
      .populate("employeeId", "fullName email department")
      .populate("chefEquipeId", "fullName")
      .populate("managerId", "fullName")
      .populate("rhId", "fullName");

    // Calcul des statistiques
    const stats = {
      total: evaluations.length,
      byStatus: {},
      byResult: { excellent: 0, normal: 0, failed: 0 },
      byDecision: { prime: 0, formation: 0, sanction: 0, aucune: 0 },
      byDepartment: {},
      averageScore: 0,
      scoreDistribution: {
        '0-20': 0,
        '21-40': 0,
        '41-60': 0,
        '61-80': 0,
        '81-100': 0
      }
    };

    let totalScore = 0;
    let scoredCount = 0;

    evaluations.forEach(ev => {
      // Par statut
      stats.byStatus[ev.status] = (stats.byStatus[ev.status] || 0) + 1;
      
      // Par résultat
      if (ev.finalResult) {
        stats.byResult[ev.finalResult]++;
      }
      
      // Par décision
      if (ev.hrDecision) {
        stats.byDecision[ev.hrDecision]++;
      }
      
      // Par département
      const dept = ev.employeeId?.department || 'Non défini';
      if (!stats.byDepartment[dept]) {
        stats.byDepartment[dept] = { count: 0, avgScore: 0, totalScore: 0 };
      }
      stats.byDepartment[dept].count++;
      
      // Score
      if (ev.score != null) {
        totalScore += ev.score;
        scoredCount++;
        stats.byDepartment[dept].totalScore += ev.score;
        
        // Distribution des scores
        if (ev.score <= 20) stats.scoreDistribution['0-20']++;
        else if (ev.score <= 40) stats.scoreDistribution['21-40']++;
        else if (ev.score <= 60) stats.scoreDistribution['41-60']++;
        else if (ev.score <= 80) stats.scoreDistribution['61-80']++;
        else stats.scoreDistribution['81-100']++;
      }
    });

    stats.averageScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;
    
    // Calculer la moyenne par département
    Object.keys(stats.byDepartment).forEach(dept => {
      const deptStats = stats.byDepartment[dept];
      deptStats.avgScore = deptStats.count > 0 
        ? Math.round(deptStats.totalScore / deptStats.count) 
        : 0;
      delete deptStats.totalScore;
    });

    res.json({
      campaign,
      evaluations,
      stats
    });
  } catch (error) {
    console.error("Error generating report data:", error);
    res.status(500).json({ message: "Erreur lors de la génération des données de rapport", error: error.message });
  }
};

// Obtenir un rapport de performance global
exports.getPerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;
    
    const matchFilter = {};
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
    }

    // Filtrer par département si spécifié
    if (department) {
      const employeeIds = await User.find({ department, role: "employee" }).distinct("_id");
      matchFilter.employeeId = { $in: employeeIds };
    }

    const evaluations = await Evaluation.find(matchFilter)
      .populate("employeeId", "fullName email department")
      .populate("campaignId", "title");

    // Agrégations
    const performanceByEmployee = {};
    
    evaluations.forEach(ev => {
      const empId = ev.employeeId?._id?.toString();
      if (!empId) return;
      
      if (!performanceByEmployee[empId]) {
        performanceByEmployee[empId] = {
          employee: ev.employeeId,
          evaluations: [],
          averageScore: 0,
          totalScore: 0
        };
      }
      
      performanceByEmployee[empId].evaluations.push({
        campaignTitle: ev.campaignId?.title,
        score: ev.score,
        result: ev.finalResult,
        decision: ev.hrDecision,
        date: ev.notifiedAt || ev.createdAt
      });
      
      if (ev.score != null) {
        performanceByEmployee[empId].totalScore += ev.score;
      }
    });

    // Calculer les moyennes
    const performanceList = Object.values(performanceByEmployee).map(p => {
      p.averageScore = p.evaluations.length > 0 
        ? Math.round(p.totalScore / p.evaluations.length) 
        : 0;
      delete p.totalScore;
      return p;
    });

    // Trier par score moyen décroissant
    performanceList.sort((a, b) => b.averageScore - a.averageScore);

    res.json({
      totalEmployees: performanceList.length,
      totalEvaluations: evaluations.length,
      performanceList
    });
  } catch (error) {
    console.error("Error generating performance report:", error);
    res.status(500).json({ message: "Erreur lors de la génération du rapport de performance", error: error.message });
  }
};
