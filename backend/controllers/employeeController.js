const User = require("../models/User");

exports.getEmployeesByDepartment = async (req, res) => {
  const { department } = req.query;
  const filter = {};
  if (department) filter.department = department;
  filter.role = "employee";
  const employees = await User.find(filter).select("-password");
  if (!employees.length) return res.status(404).json({ message: "No employees found" });
  res.json(employees);
};
