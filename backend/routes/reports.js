const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const permit = require("../middleware/roles");
const { 
  getCampaignReport, 
  getCampaignReportData,
  getPerformanceReport 
} = require("../controllers/reportController");

// Rapport PDF d'une campagne
router.get("/campaign/:campaignId/pdf", protect, permit("rh"), getCampaignReport);

// Données de rapport d'une campagne (JSON)
router.get("/campaign/:campaignId", protect, permit("rh", "manager"), getCampaignReportData);

// Rapport de performance global
router.get("/performance", protect, permit("rh"), getPerformanceReport);

module.exports = router;
