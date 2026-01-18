const express = require("express");
const router = express.Router();
const candidateController = require("../controllers/candidateController");
const protect = require("../middleware/auth");

// Base route: /api/candidates

router.route("/")
    .get(protect, candidateController.getAllCandidates)
    .post(protect, candidateController.addCandidate);

router.route("/:id")
    .get(protect, candidateController.getCandidateById)
    .put(protect, candidateController.updateCandidate)
    .delete(protect, candidateController.deleteCandidate);

// Sub-resource routing helper
router.route("/job-offer/:offerId")
    .get(protect, candidateController.getCandidatesByOffer);

module.exports = router;
