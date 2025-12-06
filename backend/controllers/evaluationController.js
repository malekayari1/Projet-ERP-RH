const Evaluation = require("../models/Evaluation");
const User = require("../models/User");
const calculate = require("../utils/calculateResult");
const Notification = require("../models/Notification");
const sendMail = require("../utils/mailer");

exports.createEvaluation = async (req, res) => {
  const { employeeId, campaignId, punctuality, initiative, workQuality, otherCriteria, commentManager } = req.body;
  const managerId = req.user._id;

  // ensure campaign active / manager authorized -> simplified
  const ev = await Evaluation.create({
    employeeId, managerId, campaignId, punctuality, initiative, workQuality, otherCriteria, commentManager, status: "validated_manager"
  });

  // compute score
  const { score, finalResult } = calculate({ punctuality, initiative, workQuality, otherCriteria });
  ev.score = score;
  ev.finalResult = finalResult;
  await ev.save();

  // create notification for RH for validation (or the system)
  const not = await Notification.create({
    userId: req.user._id, // could be RH id(s)
    title: "Nouvelle évaluation",
    message: `Évaluation créée pour l'employé ${employeeId}`
  });

  res.status(201).json(ev);
};

exports.updateEvaluation = async (req, res) => {
  const ev = await Evaluation.findById(req.params.id);
  if (!ev) return res.status(404).json({ message: "Evaluation not found" });

  // only manager or RH allowed
  if (req.user.role === "manager" && ev.managerId.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "Not allowed" });

  Object.assign(ev, req.body);
  // recalc if criteria changed
  const { score, finalResult } = calculate({
    punctuality: ev.punctuality, initiative: ev.initiative, workQuality: ev.workQuality, otherCriteria: ev.otherCriteria
  });
  ev.score = score;
  ev.finalResult = finalResult;

  // if manager saved, set status validated_manager
  if (req.user.role === "manager") ev.status = "validated_manager";
  if (req.user.role === "rh") ev.status = "validated_rh";

  await ev.save();
  res.json(ev);
};

exports.getEvaluationsByCampaign = async (req, res) => {
  const { campaignId } = req.params;
  const evaluations = await Evaluation.find({ campaignId }).populate("employeeId", "fullName email department");
  res.json(evaluations);
};

exports.getEvaluation = async (req, res) => {
  const ev = await Evaluation.findById(req.params.id).populate("employeeId managerId campaignId");
  if (!ev) return res.status(404).json({ message: "Evaluation not found" });
  res.json(ev);
};

exports.validateByRH = async (req, res) => {
  const ev = await Evaluation.findById(req.params.id);
  if (!ev) return res.status(404).json({ message: "Evaluation not found" });

  ev.status = "validated_rh";
  if (req.body.commentRH) ev.commentRH = req.body.commentRH;
  await ev.save();

  // send notification/email to employee
  const employee = await User.findById(ev.employeeId);
  await Notification.create({ userId: employee._id, title: "Evaluation approuvée", message: `Votre évaluation a été validée. Résultat: ${ev.finalResult}` });
  try {
    await sendMail({
      to: employee.email,
      subject: "Votre évaluation",
      text: `Bonjour ${employee.fullName}, votre évaluation est validée. Résultat: ${ev.finalResult}`
    });
  } catch (e) {
    console.warn("Mail send failed:", e.message);
  }

  res.json(ev);
};
