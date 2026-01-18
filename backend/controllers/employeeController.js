const User = require("../models/User");

// Obtenir les employés par département
exports.getEmployeesByDepartment = async (req, res) => {
  const { department, isActive } = req.query;
  const filter = { role: "employee" };
  
  if (department) filter.department = department;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  
  const employees = await User.find(filter)
    .select("-password")
    .populate("supervisorId", "fullName email")
    .sort({ fullName: 1 });
  
  res.json(employees);
};

// Obtenir tous les utilisateurs (pour l'admin RH)
exports.getAllUsers = async (req, res) => {
  const { role, department, isActive } = req.query;
  const filter = {};
  
  if (role) filter.role = role;
  if (department) filter.department = department;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  
  const users = await User.find(filter)
    .select("-password")
    .populate("supervisorId", "fullName email")
    .populate("managerId", "fullName email")
    .sort({ role: 1, fullName: 1 });
  
  res.json(users);
};

// Obtenir un utilisateur par ID
exports.getUserById = async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("supervisorId", "fullName email")
    .populate("managerId", "fullName email");
  
  if (!user) {
    return res.status(404).json({ message: "Utilisateur non trouvé" });
  }
  
  res.json(user);
};

// Créer un nouvel utilisateur (RH uniquement)
exports.createUser = async (req, res) => {
  const { fullName, email, password, role, department, supervisorId, managerId } = req.body;
  
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "Un utilisateur avec cet email existe déjà" });
  }
  
  const user = await User.create({
    fullName,
    email,
    password,
    role,
    department,
    supervisorId,
    managerId,
    isActive: true
  });
  
  const userResponse = user.toObject();
  delete userResponse.password;
  
  res.status(201).json(userResponse);
};

// Mettre à jour un utilisateur
exports.updateUser = async (req, res) => {
  const { fullName, email, role, department, supervisorId, managerId, isActive } = req.body;
  
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "Utilisateur non trouvé" });
  }
  
  // Vérifier si l'email est déjà utilisé par un autre utilisateur
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Un utilisateur avec cet email existe déjà" });
    }
  }
  
  if (fullName) user.fullName = fullName;
  if (email) user.email = email;
  if (role) user.role = role;
  if (department !== undefined) user.department = department;
  if (supervisorId !== undefined) user.supervisorId = supervisorId || null;
  if (managerId !== undefined) user.managerId = managerId || null;
  if (isActive !== undefined) user.isActive = isActive;
  
  await user.save();
  
  const userResponse = user.toObject();
  delete userResponse.password;
  
  res.json(userResponse);
};

// Désactiver un utilisateur
exports.deactivateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "Utilisateur non trouvé" });
  }
  
  user.isActive = false;
  await user.save();
  
  res.json({ message: "Utilisateur désactivé avec succès" });
};

// Obtenir les employés supervisés par un chef d'équipe
exports.getMyTeam = async (req, res) => {
  const employees = await User.find({ 
    supervisorId: req.user._id,
    isActive: true 
  })
    .select("-password")
    .sort({ fullName: 1 });
  
  res.json(employees);
};

// Obtenir les départements uniques
exports.getDepartments = async (req, res) => {
  const departments = await User.distinct("department", { 
    department: { $ne: null, $ne: "" } 
  });
  
  res.json(departments.sort());
};

// Obtenir les chefs d'équipe
exports.getChefsEquipe = async (req, res) => {
  const { department } = req.query;
  const filter = { role: "chef_equipe", isActive: true };
  
  if (department) filter.department = department;
  
  const chefsEquipe = await User.find(filter)
    .select("-password")
    .sort({ fullName: 1 });
  
  res.json(chefsEquipe);
};

// Obtenir les managers
exports.getManagers = async (req, res) => {
  const managers = await User.find({ role: "manager", isActive: true })
    .select("-password")
    .sort({ fullName: 1 });
  
  res.json(managers);
};
