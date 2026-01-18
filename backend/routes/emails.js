const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const permit = require("../middleware/roles");
const {
    getTemplates,
    createTemplate,
    updateTemplate,
    getSentEmails,
    sendReminder,
    checkAutomationTriggers,
    getWorkflowTasks,
    validateTrialPeriod,
    getMyTasks
} = require("../controllers/emailController");

// Employee Workflow (Own status)
router.get("/my-tasks", protect, getMyTasks);

// Templates management (RH, Director)
router.get("/templates", protect, permit("rh", "directeur"), getTemplates);
router.get("/tasks", protect, permit("rh", "directeur", "manager"), getWorkflowTasks);
router.post("/templates", protect, permit("rh", "directeur"), createTemplate);
router.put("/templates/:id", protect, permit("rh", "directeur"), updateTemplate);

// Logs (RH, Director, Manager)
router.get("/logs", protect, permit("rh", "directeur", "manager"), getSentEmails);

// Manual Trigger
router.post("/send-reminder", protect, permit("rh", "directeur"), sendReminder);

// Manager Trigger
router.post("/validate-trial", protect, permit("rh", "directeur", "manager"), validateTrialPeriod);

// System Trigger
router.post("/run-automation", protect, permit("rh", "directeur"), checkAutomationTriggers);

module.exports = router;
