const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const { register, login } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);

// Route pour obtenir l'utilisateur connecté
router.get("/me", protect, (req, res) => {
  res.json({
    _id: req.user._id,
    fullName: req.user.fullName,
    email: req.user.email,
    role: req.user.role,
    department: req.user.department
  });
});

module.exports = router;
