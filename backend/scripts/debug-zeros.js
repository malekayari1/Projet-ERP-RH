const mongoose = require('mongoose');
const User = require('../models/User');
const Contract = require('../models/Contract');
const PayrollEntry = require('../models/PayrollEntry');
require('dotenv').config();
const connectDB = require('../config/db');

const fullDiagnostic = async () => {
    await connectDB();
    try {
        console.log("--- GLOBAL CONTRACT DIAGNOSTIC ---");
        const allContracts = await Contract.find();
        console.log(`Total contracts in DB: ${allContracts.length}`);

        const statusCounts = {};
        allContracts.forEach(c => {
            statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
        });
        console.log("Status Breakdown:", statusCounts);

        const usersWithEntries = await PayrollEntry.find({ periodId: '696bcc243d8580996b938092' }).populate('employeeId');
        console.log(`\nAnalyzing ${usersWithEntries.length} entries for current period...`);

        for (const entry of usersWithEntries) {
            const user = entry.employeeId;
            if (!user) continue;

            const userContract = allContracts.find(c => c.employeeId.toString() === user._id.toString());

            if (!userContract) {
                // console.log(`[ ] ${user.fullName}: NO CONTRACT FOUND`);
            } else {
                console.log(`[${userContract.status}] ${user.fullName}: Salary=${userContract.salary}, Start=${userContract.startDate.toISOString().split('T')[0]}`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

fullDiagnostic();
