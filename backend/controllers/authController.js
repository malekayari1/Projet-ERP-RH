const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

exports.register = async (req, res) => {
  const { fullName, email, password, role, department } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "User already exists" });
  const user = await User.create({ fullName, email, password, role, department });
  res.status(201).json({
    _id: user._id, fullName: user.fullName, email: user.email, role: user.role,
    token: generateToken(user._id)
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const match = await user.matchPassword(password);
  if (!match) return res.status(401).json({ message: "Invalid credentials" });
  res.json({
    _id: user._id, fullName: user.fullName, email: user.email, role: user.role,
    token: generateToken(user._id)
  });
};
