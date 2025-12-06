const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const permit = require("../middleware/roles");
const { createCampaign, getActiveCampaigns, getCampaignById } = require("../controllers/campaignController");

router.post("/", protect, permit("rh"), createCampaign);
router.get("/", protect, getActiveCampaigns);
router.get("/:id", protect, getCampaignById);

module.exports = router;
