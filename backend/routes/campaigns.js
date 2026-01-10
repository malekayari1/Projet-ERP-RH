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
router.post("/", protect, permit("rh"), createCampaign);
router.get("/", protect, getCampaigns);
router.get("/active", protect, getActiveCampaigns);
router.get("/:id", protect, getCampaignById);
router.get("/:id/stats", protect, permit("rh", "manager"), getCampaignStats);
router.put("/:id", protect, permit("rh"), updateCampaign);
router.patch("/:id/status", protect, permit("rh"), updateCampaignStatus);
router.post("/:id/launch", protect, permit("rh"), launchCampaign);
router.delete("/:id", protect, permit("rh"), deleteCampaign);

module.exports = router;
