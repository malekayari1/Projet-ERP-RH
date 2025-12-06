const Campaign = require("../models/Campaign");
const Evaluation = require("../models/Evaluation");
const User = require("../models/User");
const path = require("path");
const generatePDF = require(path.join(__dirname, "../config/utils/pdfGenerator"));

exports.getCampaignReport = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    const evaluations = await Evaluation.find({ campaignId });
    const employeeIds = evaluations
      .map(e => e.employeeId)
      .filter(id => id != null)
      .map(id => id.toString());
    const employees = employeeIds.length > 0 
      ? await User.find({ _id: { $in: employeeIds } }).select("fullName email")
      : [];
    const employeesMap = {};
    employees.forEach(emp => employeesMap[emp._id.toString()] = emp);

    const pdfBuffer = await generatePDF(campaign, evaluations, employeesMap);

    const safeTitle = campaign.title ? campaign.title.replace(/\s+/g, "_") : "report";
    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
      "Content-Disposition": `attachment; filename="report_${safeTitle}.pdf"`
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ message: "Error generating PDF report", error: error.message });
  }
};
