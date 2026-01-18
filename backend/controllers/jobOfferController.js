const JobOffer = require("../models/JobOffer");
const Candidate = require("../models/Candidate");

// @desc    Get all job offers
// @route   GET /api/job-offers
// @access  Private (RH, Director)
exports.getJobOffers = async (req, res) => {
    try {
        const offers = await JobOffer.find().sort({ createdAt: -1 });
        res.status(200).json(offers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single job offer
// @route   GET /api/job-offers/:id
// @access  Private
exports.getJobOfferById = async (req, res) => {
    try {
        const offer = await JobOffer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ message: "Offre non trouvée" });
        }
        res.status(200).json(offer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new job offer (Step 1: Need & Budget)
// @route   POST /api/job-offers
// @access  Private (RH only)
exports.createJobOffer = async (req, res) => {
    try {
        const { title, description, department, budget } = req.body;



        const newOffer = await JobOffer.create({
            title,
            description,
            department,
            budget,
            createdBy: req.user._id,
            status: "analysis"
        });

        res.status(201).json(newOffer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update job offer (Step 2: Publish, etc.)
// @route   PUT /api/job-offers/:id
// @access  Private (RH only)
exports.updateJobOffer = async (req, res) => {
    try {
        const offer = await JobOffer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ message: "Offre non trouvée" });
        }

        const { title, description, budget, status } = req.body;

        if (title) offer.title = title;
        if (description) offer.description = description;
        if (budget) offer.budget = budget;

        // Status transition logic
        if (status && status !== offer.status) {
            offer.status = status;
            if (status === "published") {
                offer.publishedAt = Date.now();
            } else if (status === "closed") {
                offer.closedAt = Date.now();
            }
        }

        await offer.save();
        res.status(200).json(offer);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete job offer
// @route   DELETE /api/job-offers/:id
// @access  Private (RH only)
exports.deleteJobOffer = async (req, res) => {
    try {
        const offer = await JobOffer.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ message: "Offre non trouvée" });
        }

        // Optional: Check if candidates exist before deleting?
        // For now, simple delete
        await offer.deleteOne();
        res.status(200).json({ message: "Offre supprimée" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
