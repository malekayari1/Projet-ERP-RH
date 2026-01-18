const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/db');
const Contract = require('../models/Contract');
const User = require('../models/User');
const PayrollPeriod = require('../models/PayrollPeriod');
const PayrollEntry = require('../models/PayrollEntry');
// Mock calculation logic from controller to avoid importing the whole controller which might have auth dependencies not suitable for script
const calculateSalaryDetails = (contract, presence, primes) => {
    const baseSalary = contract.salary || 0;
    return {
        baseSalary: baseSalary,
        overtimePay: 0,
        primesTotal: 0,
        grossSalary: baseSalary, // simplified
        socialCharges: baseSalary * 0.1,
        tax: 0,
        netSalary: baseSalary * 0.9
    };
};

const fixAmine = async () => {
    await connectDB();
    console.log("DB Connected");

    try {
        // 1. Find Amine
        const amine = await User.findOne({ email: { $regex: 'amine', $options: 'i' } });
        if (!amine) {
            console.log("Amine not found.");
            return;
        }
        console.log(`Found User: ${amine.fullName}`);

        // 2. Find and Validate Contract
        let contract = await Contract.findOne({ employeeId: amine._id });
        if (!contract) {
            console.log("No contract found. Creating one...");
            contract = await Contract.create({
                employeeId: amine._id,
                type: 'CDI',
                status: 'validated',
                startDate: new Date(),
                salary: 2500,
                hourlyRate: 15
            });
        } else {
            console.log(`Contract found (Status: ${contract.status}). Updating to 'validated'.`);
            contract.status = 'validated';
            contract.endDate = undefined;
            // Fix missing salary for old data
            if (!contract.salary) contract.salary = 2000;
            if (!contract.hourlyRate) contract.hourlyRate = 12;

            await contract.save();
        }
        console.log("Contract Validated.");

        // 3. Find Open Period (3/2026 based on screenshot)
        // Or just find ANY open period
        const period = await PayrollPeriod.findOne({ status: 'OPEN' });
        if (!period) {
            console.log("No OPEN payroll period found.");
            return;
        }
        console.log(`Found Open Period: ${period.month}/${period.year}`);

        // 4. Create Entry if not exists
        const existingEntry = await PayrollEntry.findOne({ periodId: period._id, employeeId: amine._id });
        if (existingEntry) {
            console.log("Entry already exists for this period.");
        } else {
            console.log("Creating missing payroll entry...");
            await PayrollEntry.create({
                employeeId: amine._id,
                periodId: period._id,
                contractId: contract._id,
                status: 'DRAFT',
                calculations: calculateSalaryDetails(contract, {}, [])
            });
            console.log("Entry Created!");
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

fixAmine();
