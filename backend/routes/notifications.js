const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const { getNotifications, markRead } = require("../controllers/notificationController");

router.get("/", protect, getNotifications);
router.put("/read/:id", protect, markRead);

module.exports = router;
