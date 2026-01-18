const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/db');
const Contract = require('../models/Contract');
const User = require('../models/User');
const PayrollEntry = require('../models/PayrollEntry');
const PayrollPeriod = require('../models/PayrollPeriod');

const debugMissingEntry = async () => {
    await connectDB();
    console.log("DB Connected");

    try {
        // 1. Find a sample employee (or the one logged in, let's list all employees)
        const employees = await User.find({ role: 'employee' });
        console.log(`Found ${employees.length} employees.`);

        for (const emp of employees) {
            console.log(`\nChecking Employee: ${emp.fullName} (${emp.email})`);

            // 2. Check Contract
            const contract = await Contract.findOne({ employeeId: emp._id });
            if (!contract) {
                console.log("  -> NO CONTRACT found.");
                continue;
            }
            console.log(`  -> Contract Found: ID=${contract._id}, Status=${contract.status}, Type=${contract.type}`);
            console.log(`  -> Start: ${contract.startDate}, End: ${contract.endDate}`);

            // 3. Test the Controller Query
            const isValidated = contract.status === 'validated';
            const hasNoEnd = !contract.endDate;
            // The problematic query was: { status: 'validated', endDate: { $exists: false } }

            if (isValidated) {
                if (hasNoEnd) {
                    console.log("  -> MATCHES current query (Validated + No End Date).");
                } else {
                    console.log("  -> FAILS current query (Has End Date). Query requires endDate to NOT exist.");
                }
            } else {
                console.log("  -> FAILS query (Not Validated).");
            }

            // 4. Check for existing entries
            const entries = await PayrollEntry.find({ employeeId: emp._id });
            console.log(`  -> Entries found: ${entries.length}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

debugMissingEntry();
