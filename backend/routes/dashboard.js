const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const permit = require("../middleware/roles");
const { 
  getDashboardStats, 
  getRecentActivities,
  getGlobalStats 
} = require("../controllers/dashboardController");

// Statistiques du dashboard selon le rôle
router.get("/stats", protect, getDashboardStats);

// Activités récentes
router.get("/activities", protect, getRecentActivities);

// Statistiques globales pour rapports (RH uniquement)
router.get("/global-stats", protect, permit("rh"), getGlobalStats);

module.exports = router;

