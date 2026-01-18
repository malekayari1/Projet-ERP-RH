const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const permit = require("../middleware/roles");
const {
  createCampaign,
  getCampaigns,
  getActiveCampaigns,
  getCampaignById,
  updateCampaign,
  updateCampaignStatus,
  launchCampaign,
  getCampaignStats,
  deleteCampaign
} = require("../controllers/campaignController");

// Routes pour les campagnes
router.post("/", protect, permit("rh", "directeur"), createCampaign);
router.get("/", protect, getCampaigns);
router.get("/active", protect, getActiveCampaigns);
router.get("/:id", protect, getCampaignById);
router.get("/:id/stats", protect, permit("rh", "manager", "directeur"), getCampaignStats);
router.put("/:id", protect, permit("rh", "directeur"), updateCampaign);
router.patch("/:id/status", protect, permit("rh", "directeur"), updateCampaignStatus);
router.post("/:id/launch", protect, permit("rh", "directeur"), launchCampaign);
router.delete("/:id", protect, permit("rh", "directeur"), deleteCampaign);

module.exports = router;
