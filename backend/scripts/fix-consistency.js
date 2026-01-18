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
        baseSalary: parseFloat(baseSalary.toFixed(2)),
        hourlyRate: parseFloat(hourlyRate.toFixed(3)),
        overtimePay: parseFloat(overtimePay.toFixed(2)),
        absenceDeduction: parseFloat(absenceDeduction.toFixed(2)),
        primesTotal: parseFloat(primesTotal.toFixed(2)),
        grossSalary: parseFloat(grossSalary.toFixed(2)),
        socialCharges: parseFloat(cnss.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        netSalary: parseFloat(netSalary.toFixed(2))
    };
};

const fixEntries = async () => {
    await connectDB();
    try {
        const period = await PayrollPeriod.findOne({ month: 1, year: 2026 });
        if (!period) return console.log("Period not found");

        const entries = await PayrollEntry.find({ periodId: period._id }).populate('contractId');
        for (const entry of entries) {
            entry.calculations = calculateSalaryDetails(entry.contractId, entry.presence, entry.primes);
            await entry.save();
        }
        console.log(`Recalculated ${entries.length} entries.`);
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
};

fixEntries();
