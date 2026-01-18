const express = require("express");
const router = express.Router();
const jobOfferController = require("../controllers/jobOfferController");
const protect = require("../middleware/auth");

// Base route: /api/job-offers

router.route("/")
    .get(protect, jobOfferController.getJobOffers)
    .post(protect, jobOfferController.createJobOffer);

router.route("/:id")
    .get(protect, jobOfferController.getJobOfferById)
    .put(protect, jobOfferController.updateJobOffer)
    .delete(protect, jobOfferController.deleteJobOffer);

module.exports = router;
