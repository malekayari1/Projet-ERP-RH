const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const permit = require("../middleware/roles");
const {
  createEvaluation,
  updateEvaluation,
  getEvaluationsByCampaign,
  getEvaluation,
  validateByRH
} = require("../controllers/evaluationController");

router.post("/", protect, permit("manager"), createEvaluation);
router.get("/campaign/:campaignId", protect, getEvaluationsByCampaign);
router.get("/:id", protect, getEvaluation);
router.put("/:id", protect, permit("manager", "rh"), updateEvaluation);
router.post("/:id/validate", protect, permit("rh"), validateByRH);

module.exports = router;
