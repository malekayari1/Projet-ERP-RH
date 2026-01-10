const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const permit = require("../middleware/roles");
const { 
  getEmployeesByDepartment,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deactivateUser,
  getMyTeam,
  getDepartments,
  getChefsEquipe,
  getManagers
} = require("../controllers/employeeController");

// Routes publiques pour les listes de référence
router.get("/departments", protect, getDepartments);
router.get("/chefs-equipe", protect, permit("rh", "manager"), getChefsEquipe);
router.get("/managers", protect, permit("rh"), getManagers);

// Route pour le chef d'équipe - voir son équipe
router.get("/my-team", protect, permit("chef_equipe"), getMyTeam);

// Routes pour les employés par département
router.get("/", protect, permit("manager", "rh", "chef_equipe"), getEmployeesByDepartment);

// Routes CRUD pour les utilisateurs (RH uniquement)
router.get("/users", protect, permit("rh"), getAllUsers);
router.get("/users/:id", protect, permit("rh", "manager"), getUserById);
router.post("/users", protect, permit("rh"), createUser);
router.put("/users/:id", protect, permit("rh"), updateUser);
router.patch("/users/:id/deactivate", protect, permit("rh"), deactivateUser);

module.exports = router;
