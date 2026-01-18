const mongoose = require('mongoose');
const User = require('../models/User');
const Contract = require('../models/Contract');
const PayrollEntry = require('../models/PayrollEntry');
const PayrollPeriod = require('../models/PayrollPeriod');
require('dotenv').config();
const connectDB = require('../config/db');

const backfillEntries = async () => {
    await connectDB();
    console.log("Backfilling missing entries...");

    try {
        // Find the period 1/2026
        const period = await PayrollPeriod.findOne({ month: 1, year: 2026 });
        if (!period) {
            console.log("Period 1/2026 not found.");
            return;
        }
        console.log(`Found Period: ${period._id}`);

        // Get all users (excluding Test)
        const users = await User.find({ fullName: { $not: /Test/i } });

        // Get active contracts
        const activeContracts = await Contract.find({ status: 'validated' });

        let createdCount = 0;

        for (const user of users) {
            // Check if entry exists
            const exists = await PayrollEntry.findOne({ periodId: period._id, employeeId: user._id });
            if (exists) {
                console.log(`Entry exists for ${user.fullName}`);
                continue;
            }

            // Create Entry
            const contract = activeContracts.find(c => c.employeeId.toString() === user._id.toString());

            await PayrollEntry.create({
                employeeId: user._id,
                periodId: period._id,
                contractId: contract ? contract._id : undefined, // Optional now
                status: 'DRAFT',
                presence: { normalHours: 0, overtimeHours: 0, absences: 0 },
                calculations: {
                    baseSalary: contract ? contract.salary : 0,
                    netSalary: contract ? contract.salary * 0.8 : 0
                }
            });
            console.log(`Created entry for ${user.fullName}`);
            createdCount++;
        }

        console.log(`Backfill complete. Created ${createdCount} entries.`);

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

backfillEntries();
