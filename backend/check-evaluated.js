const mongoose = require("mongoose");
const fs = require("fs");
require("dotenv").config();
const Evaluation = require("./models/Evaluation");
const User = require("./models/User");

async function check() {
    await mongoose.connect(process.env.MONGO_URI);
    const evals = await Evaluation.find({ status: "evaluated" }).populate("employeeId");
    let out = `Evaluated count: ${evals.length}\n`;
    evals.forEach(e => {
        out += `ID: ${e._id} | Name: ${e.employeeId ? e.employeeId.fullName : "N/A"} | Dept: ${e.employeeId ? e.employeeId.department : "N/A"}\n`;
    });
    fs.writeFileSync("last-eval-check.txt", out);
    await mongoose.disconnect();
}
check();
