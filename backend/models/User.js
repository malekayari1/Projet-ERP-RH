const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["employee", "chef_equipe", "manager", "rh"], 
    default: "employee" 
  },
  department: { type: String },
  // Chef d'équipe ou Manager qui supervise cet employé
  supervisorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  // Pour les chefs d'équipe: leur manager
  managerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function(entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model("User", UserSchema);
