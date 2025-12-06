const Campaign = require("../models/Campaign");
const User = require("../models/User");

exports.createCampaign = async (req, res) => {
  const { title, startDate, endDate } = req.body;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end <= start) return res.status(400).json({ message: "End must be after start" });

  const campaign = await Campaign.create({
    title, startDate: start, endDate: end, isActive: true, createdBy: req.user._id
  });

  // Optionally: notify managers (example: all users with role manager)
  const managers = await User.find({ role: "manager" }).select("email fullName");
  // send notifications/emails in production (omitted here for brevity)

  res.status(201).json(campaign);
};

exports.getActiveCampaigns = async (req, res) => {
  const campaigns = await Campaign.find({});
  res.json(campaigns);
};

exports.getCampaignById = async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) return res.status(404).json({ message: "Campaign not found" });
  res.json(campaign);
};
