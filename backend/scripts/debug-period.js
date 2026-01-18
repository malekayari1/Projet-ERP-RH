const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/db');
const PayrollPeriod = require('../models/PayrollPeriod');
const PayrollEntry = require('../models/PayrollEntry');
const Contract = require('../models/Contract');
const User = require('../models/User');

const debugCreate = async () => {
    await connectDB();
    console.log("DB Connected");

    try {
        const month = 5;
        const year = 2025;

        // Cleanup
        await PayrollPeriod.deleteMany({ month, year });

        console.log(`Attempting to create period ${month}/${year}...`);

        // Create Orphan Contract FIRST
        await Contract.create({
            employeeId: new mongoose.Types.ObjectId(), // Non-existent User
            type: 'CDI',
            status: 'validated',
            startDate: new Date(),
            salary: 3000
        });
        console.log("Created Orphaned Contract");

        // Logic from Controller
        const activeContracts = await Contract.find({ status: 'validated', endDate: { $exists: false } }).populate('employeeId');

        // Match the fix: Filter orphans
        const validContracts = activeContracts.filter(c => c.employeeId);

        console.log(`Found ${validContracts.length} valid active contracts (out of ${activeContracts.length} total).`);

        if (validContracts.length === 0) {
            console.log("WARNING: No active contracts found. Period will be empty but should succeed.");
        }

        // Create a Contract with NO valid user (Broken Reference)
        // We'll simulate this by creating a contract with a random ObjectId that doesn't exist in User collection
        await Contract.create({
            employeeId: new mongoose.Types.ObjectId(), // Non-existent User
            type: 'CDI',
            status: 'validated',
            startDate: new Date(),
            salary: 3000
        });
        console.log("Created Orphaned Contract (Simulating Data Corruption)");

        const period = await PayrollPeriod.create({ month, year });
        console.log("Period created:", period._id);

        const entries = validContracts.map(contract => ({
            employeeId: contract.employeeId._id,
            periodId: period._id,
            contractId: contract._id,
            status: 'DRAFT',
            calculations: { // Mock initial calc
                baseSalary: contract.salary,
                grossSalary: contract.salary,
                netSalary: contract.salary * 0.8 // Rough mock
            }
        }));

        if (entries.length > 0) {
            console.log(`Inserting ${entries.length} entries...`);
            await PayrollEntry.insertMany(entries);
            console.log("Entries inserted.");
        }

        console.log("SUCCESS: Period creation simulated successfully.");

    } catch (err) {
        console.error("ERROR:", err);
    } finally {
        mongoose.disconnect();
    }
};

debugCreate();
