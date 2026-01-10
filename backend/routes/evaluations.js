const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const permit = require("../middleware/roles");
const {
  // Chef d'équipe
  getEvaluationsForChefEquipe,
  submitEvaluationByChefEquipe,
  // Manager
  getEvaluationsForManager,
  validateByManager,
  // RH
  getEvaluationsForRH,
  validateByRH,
  makeDecision,
  // Notifications
  notifyEmployee,
  notifyAllEmployees,
  // Employé
  getMyEvaluations,
  getMyEvaluation,
  submitSelfEvaluation,
  acknowledgeEvaluation,
  // Général
  getEvaluationsByCampaign,
  getEvaluation
} = require("../controllers/evaluationController");

// Routes pour Chef d'équipe
router.get("/chef-equipe", protect, permit("chef_equipe"), getEvaluationsForChefEquipe);
router.post("/:id/evaluate", protect, permit("chef_equipe"), submitEvaluationByChefEquipe);

// Routes pour Manager
router.get("/manager", protect, permit("manager"), getEvaluationsForManager);
router.post("/:id/validate-manager", protect, permit("manager"), validateByManager);

// Routes pour RH
router.get("/rh", protect, permit("rh"), getEvaluationsForRH);
router.post("/:id/validate-rh", protect, permit("rh"), validateByRH);
router.post("/:id/decision", protect, permit("rh"), makeDecision);
router.post("/:id/notify", protect, permit("rh"), notifyEmployee);
router.post("/campaign/:campaignId/notify-all", protect, permit("rh"), notifyAllEmployees);

// Routes pour Employé
router.get("/my-evaluations", protect, getMyEvaluations);
router.get("/my-evaluations/:id", protect, getMyEvaluation);
router.post("/:id/self-evaluate", protect, submitSelfEvaluation);
router.post("/:id/acknowledge", protect, acknowledgeEvaluation);

// Routes générales
router.get("/campaign/:campaignId", protect, getEvaluationsByCampaign);
router.get("/:id", protect, getEvaluation);

module.exports = router;
