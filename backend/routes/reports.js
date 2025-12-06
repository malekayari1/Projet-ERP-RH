const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const permit = require("../middleware/roles");
const { getCampaignReport } = require("../controllers/reportController");

router.get("/campaign/:campaignId", protect, permit("rh"), getCampaignReport);

module.exports = router;
