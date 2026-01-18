const mongoose = require('mongoose');
const User = require('../models/User');
const Prime = require('../models/Prime');
const PayrollEntry = require('../models/PayrollEntry');
const PayrollPeriod = require('../models/PayrollPeriod');
const Contract = require('../models/Contract');
require('dotenv').config();
const connectDB = require('../config/db');

// Reuse calculation logic
const calculateSalaryDetails = (contract, presence, primes) => {
    const baseSalary = contract ? contract.salary : 0;
    const hourlyRate = contract ? (contract.hourlyRate || (contract.salary / 173.33)) : 0;
    const primesTotal = primes.reduce((acc, p) => acc + p.amount, 0);
    const absenceHours = (presence && presence.absences) || 0;
    const absenceDeduction = absenceHours * hourlyRate;
    const overtimeHours = (presence && presence.overtimeHours) || 0;
    const overtimePay = overtimeHours * hourlyRate * 1.5;
    const grossSalary = baseSalary + primesTotal + overtimePay - absenceDeduction;
    const cnss = grossSalary * 0.0918;
    const taxableIncome = grossSalary - cnss;
    let tax = 0; if (taxableIncome > 5000) tax = taxableIncome * 0.2;
    const netSalary = taxableIncome - tax;

    return {
        baseSalary, hourlyRate, overtimePay, absenceDeduction, primesTotal,
        grossSalary, socialCharges: cnss, tax, netSalary
    };
};

const syncPrimes = async () => {
    await connectDB();
    console.log("Syncing primes for Period 01/2026...");

    try {
        const period = await PayrollPeriod.findOne({ month: 1, year: 2026 });
        if (!period) return console.log("Period not found");

        const entries = await PayrollEntry.find({ periodId: period._id }).populate('contractId');
        console.log(`Checking ${entries.length} entries...`);

        const startOfMonth = new Date(2026, 0, 1);
        const endOfMonth = new Date(2026, 1, 0);

        let updatedCount = 0;

        for (const entry of entries) {
            const primesInDb = await Prime.find({
                employeeId: entry.employeeId,
                date: { $gte: startOfMonth, $lte: endOfMonth }
            });

            if (primesInDb.length > 0) {
                console.log(`Found ${primesInDb.length} primes for User ID ${entry.employeeId}`);

                const mappedPrimes = primesInDb.map(p => ({
                    type: 'Prime sur Objectif/Autres',
                    amount: p.amount,
                    description: `ID: ${p._id}`
                }));

                entry.primes = mappedPrimes;
                entry.calculations = calculateSalaryDetails(entry.contractId, entry.presence, mappedPrimes);

                await entry.save();
                updatedCount++;
            }
        }

        console.log(`Sync complete. Updated ${updatedCount} entries with primes.`);

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

syncPrimes();
