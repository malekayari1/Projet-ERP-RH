const mongoose = require('mongoose');
const User = require('../models/User');
const Contract = require('../models/Contract');
const PayrollEntry = require('../models/PayrollEntry');
require('dotenv').config();
const connectDB = require('../config/db');

const auditPayroll = async () => {
    await connectDB();
    console.log("DB Connected");

    try {
        // 1. Get all employees
        // Assuming role 'employee' or similar. Let's fetch all and filter by typical roles if needed, or just fetch all.
        // Based on User model viewer earlier: enum: ["employee", "chef_equipe", "manager", "rh", "directeur"]
        // We probably want 'employee', 'chef_equipe', 'manager'.
        const employees = await User.find({
            role: { $in: ['employee', 'chef_equipe', 'manager'] }
        });
        console.log(`Total Employees in DB: ${employees.length}`);
        employees.forEach(e => console.log(` - ${e.fullName} (${e.role}) [ID: ${e._id}]`));

        // 2. Get Contracts
        const contracts = await Contract.find({});
        console.log(`\nTotal Contracts in DB: ${contracts.length}`);
        contracts.forEach(c => console.log(` - For ${c.employeeId}: Status '${c.status}'`));

        // 3. Get Entries for specific period (let's pick the one from screenshot: 6/2026 or 4/2026? User screens show different things.
        // Let's just create a period if needed or check all.
        // Actually, let's just count entries per employee.
        const entries = await PayrollEntry.find({}).populate('periodId');
        console.log(`\nTotal Payroll Entries in DB: ${entries.length}`);

        // Check finding for a sample month e.g. 6/2026 (from user screenshot)
        // I need to find the period ID for 6/2026 first if it exists, or just list distinct periods.

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

auditPayroll();
