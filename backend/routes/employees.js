const express = require("express");
const router = express.Router();
const protect = require("../middleware/auth");
const permit = require("../middleware/roles");
const { getEmployeesByDepartment } = require("../controllers/employeeController");

router.get("/", protect, permit("manager","rh"), getEmployeesByDepartment);

module.exports = router;
