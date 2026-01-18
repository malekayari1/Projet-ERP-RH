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
router.get("/chef-equipe", protect, permit("chef_equipe", "rh", "directeur"), getEvaluationsForChefEquipe);
router.post("/:id/evaluate", protect, permit("chef_equipe", "rh", "directeur"), submitEvaluationByChefEquipe);

// Routes pour Manager
router.get("/manager", protect, permit("manager", "rh", "directeur"), getEvaluationsForManager);
router.post("/:id/validate-manager", protect, permit("manager", "rh", "directeur"), validateByManager);

// Routes pour RH
router.get("/rh", protect, permit("rh", "directeur"), getEvaluationsForRH);
router.post("/:id/validate-rh", protect, permit("rh", "directeur"), validateByRH);
router.post("/:id/decision", protect, permit("rh", "directeur"), makeDecision);
router.post("/:id/notify", protect, permit("rh", "directeur"), notifyEmployee);
router.post("/campaign/:campaignId/notify-all", protect, permit("rh", "directeur"), notifyAllEmployees);

// Routes pour Employé
router.get("/my-evaluations", protect, getMyEvaluations);
router.get("/my-evaluations/:id", protect, getMyEvaluation);
router.post("/:id/self-evaluate", protect, submitSelfEvaluation);
router.post("/:id/acknowledge", protect, acknowledgeEvaluation);

// Routes générales
router.get("/campaign/:campaignId", protect, getEvaluationsByCampaign);
router.get("/:id", protect, getEvaluation);

module.exports = router;
