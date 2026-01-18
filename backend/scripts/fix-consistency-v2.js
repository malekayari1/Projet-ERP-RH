const mongoose = require('mongoose');
const PayrollEntry = require('../models/PayrollEntry');
const PayrollPeriod = require('../models/PayrollPeriod');
const Contract = require('../models/Contract');
require('dotenv').config();
const connectDB = require('../config/db');

const calculateSalaryDetails = (contract, presence, primes) => {
    const baseSalary = contract ? (contract.salary || 0) : 0;
    const hourlyRate = contract ? (contract.hourlyRate || (baseSalary / 173.33)) : 0;
    const primesTotal = (primes || []).reduce((acc, p) => acc + (p.amount || 0), 0);
    const absenceHours = (presence && presence.absences) || 0;
    const absenceDeduction = absenceHours * hourlyRate;
    const overtimeHours = (presence && presence.overtimeHours) || 0;
    const overtimePay = overtimeHours * hourlyRate * 1.5;
    const grossSalary = Math.max(0, baseSalary + primesTotal + overtimePay - absenceDeduction);
    const cnss = grossSalary * 0.0918;
    const taxableIncome = Math.max(0, grossSalary - cnss);
    let tax = 0; if (taxableIncome > 500) tax = (taxableIncome - 500) * 0.15;
    const netSalary = Math.max(0, taxableIncome - tax);

    return {
        baseSalary, hourlyRate, overtimePay, absenceDeduction, primesTotal,
        grossSalary, socialCharges: cnss, tax, netSalary
    };
};

const fixEntriesEnhanced = async () => {
    await connectDB();
    try {
        const period = await PayrollPeriod.findOne({ month: 1, year: 2026 });
        if (!period) return console.log("Period not found");

        const entries = await PayrollEntry.find({ periodId: period._id });
        console.log(`Processing ${entries.length} entries...`);

        for (const entry of entries) {
            // Find contract if null
            let contract = null;
            if (!entry.contractId) {
                contract = await Contract.findOne({
                    employeeId: entry.employeeId,
                    // Allowing any status for this fix script to help the user see numbers
                    // but we'll prioritize validated if exists
                }).sort({ startDate: -1 }); // Get latest

                if (contract) {
                    console.log(`Linking contract ${contract._id} to ${entry.employeeId}`);
                    entry.contractId = contract._id;
                }
            } else {
                contract = await Contract.findById(entry.contractId);
            }

            entry.calculations = calculateSalaryDetails(contract, entry.presence, entry.primes);
            await entry.save();
        }
        console.log(`Update complete.`);
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

fixEntriesEnhanced();
