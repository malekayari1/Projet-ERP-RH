const Notification = require("../models/Notification");

exports.getNotifications = async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(notifications);
};

exports.markRead = async (req, res) => {
  const n = await Notification.findById(req.params.id);
  if (!n) return res.status(404).json({ message: "Notification not found" });
  if (n.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Forbidden" });
  n.read = true;
  await n.save();
  res.json(n);
};
