const PayrollPeriod = require('../models/PayrollPeriod');
const PayrollEntry = require('../models/PayrollEntry');
const Contract = require('../models/Contract');
const User = require('../models/User');
const Prime = require('../models/Prime');
const Notification = require('../models/Notification');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// --- Helper Calculations (Mock Logic for MVP) ---
const calculateSalaryDetails = (contract, presence, primes) => {
    // Basic Mock Calculation Logic (To be enhanced)
    const baseSalary = contract ? (contract.salary || 0) : 0;
    const hourlyRate = contract ? (contract.hourlyRate || (baseSalary / 173.33)) : 0;

    // Primes
    const primesTotal = (primes || []).reduce((acc, p) => acc + (p.amount || 0), 0);

    // Absences (Deduction)
    const absenceHours = (presence && presence.absences) || 0;
    const absenceDeduction = absenceHours * hourlyRate;

    // Overtime
    const overtimeHours = (presence && presence.overtimeHours) || 0;
    const overtimePay = overtimeHours * hourlyRate * 1.5;

    const grossSalary = Math.max(0, baseSalary + primesTotal + overtimePay - absenceDeduction);

    // Taxes (Simplified TN)
    const cnss = grossSalary * 0.0918;
    const taxableIncome = Math.max(0, grossSalary - cnss);

    let tax = 0;
    if (taxableIncome > 500) {
        tax = (taxableIncome - 500) * 0.15;
    }

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




// --- RH Controllers ---

exports.createPeriod = async (req, res) => {
    try {
        const { month, year } = req.body;
        const existing = await PayrollPeriod.findOne({ month, year });
        if (existing) return res.status(400).json({ message: "Period already exists" });

        const period = await PayrollPeriod.create({ month, year });

        // Include ALL active users except specific test users
        const users = await User.find({
            isActive: true,
            fullName: { $not: /Test/i }
        });

        // Find active contracts for these users
        const activeContracts = await Contract.find({
            status: 'validated',
            $or: [
                { endDate: { $exists: false } },
                { endDate: null },
                { endDate: { $gte: new Date(year, month - 1, 1) } }
            ]
        });

        const entries = await Promise.all(users.map(async user => {
            const contract = activeContracts.find(c => c.employeeId.toString() === user._id.toString());

            // Fetch Primes for this month
            const startOfMonth = new Date(year, month - 1, 1);
            const endOfMonth = new Date(year, month, 0);
            const employeePrimes = await Prime.find({
                employeeId: user._id,
                date: { $gte: startOfMonth, $lte: endOfMonth }
            });

            const mappedPrimes = employeePrimes.map(p => ({
                type: 'Prime sur Objectif/Autres',
                amount: p.amount,
                description: `Prime ID: ${p._id}`
            }));

            return {
                employeeId: user._id,
                periodId: period._id,
                contractId: contract ? contract._id : undefined,
                status: 'DRAFT',
                primes: mappedPrimes,
                calculations: calculateSalaryDetails(contract, {}, mappedPrimes)
            };
        }));

        if (entries.length > 0) {
            await PayrollEntry.insertMany(entries);
        }

        res.status(201).json(period);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getPeriods = async (req, res) => {
    try {
        const periods = await PayrollPeriod.find().sort({ year: -1, month: -1 });
        res.json(periods);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getPeriodEntries = async (req, res) => {
    try {
        const { periodId } = req.params;
        const { department } = req.query;

        // 1. Get existing entries
        const entries = await PayrollEntry.find({ periodId })
            .populate('employeeId', 'fullName email department')
            .populate('contractId', 'salary hourlyRate');

        // 2. Get All Eligible Employees (for missing check)
        const userQuery = {
            // role: { $in: ['employee', 'chef_equipe', 'manager'] }, // Removed per user request "tous les users"
            fullName: { $not: /Test/i } // Exclude Test users
        };
        if (department && department !== 'Tous') {
            userQuery.department = department;
        }
        const allEmployees = await User.find(userQuery).select('fullName email department role');

        // 3. Merge Lists
        const fullList = allEmployees.map(emp => {
            const existingEntry = entries.find(e => e.employeeId._id.toString() === emp._id.toString());

            if (existingEntry) {
                return existingEntry; // Return existing Mongoose document
            } else {
                // Return "Missing" placeholder
                return {
                    _id: `missing-${emp._id}`, // Fake ID for key
                    status: 'MISSING_DATA',
                    employeeId: emp,
                    presence: { normalHours: 0, overtimeHours: 0, absences: 0 },
                    calculations: {
                        grossSalary: 0,
                        netSalary: 0,
                        primesTotal: 0
                    }
                };
            }
        });

        res.json(fullList);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.sendReminder = async (req, res) => {
    try {
        const { employeeId, message } = req.body;

        await Notification.create({
            userId: employeeId,
            title: "Rappel Paie",
            message: message || "Merci de saisir vos données de présence pour la paie du mois en cours."
        });

        res.json({ message: "Reminder sent" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.validateEntry = async (req, res) => {
    try {
        const { entryId } = req.params;
        const { status, rhComment } = req.body; // status: VALIDATED or REJECTED

        let entry = await PayrollEntry.findById(entryId).populate('contractId');
        if (!entry) return res.status(404).json({ message: "Entry not found" });

        // If no contractId linked to entry, try to find one now
        if (!entry.contractId) {
            const period = await PayrollPeriod.findById(entry.periodId);
            const contract = await Contract.findOne({
                employeeId: entry.employeeId,
                status: 'validated',
                $or: [
                    { endDate: { $exists: false } },
                    { endDate: null },
                    { endDate: { $gte: new Date(period.year, period.month - 1, 1) } }
                ]
            });
            if (contract) {
                entry.contractId = contract._id;
                entry = await entry.populate('contractId');
            }
        }

        entry.status = status;
        if (rhComment) entry.rhComment = rhComment;

        // Recalculate with potentially fresh contract
        entry.calculations = calculateSalaryDetails(entry.contractId, entry.presence, entry.primes);

        await entry.save();
        res.json(entry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.calculateAll = async (req, res) => {
    // Force Recalculate all drafts in period
    try {
        const { periodId } = req.params;
        const entries = await PayrollEntry.find({ periodId }).populate('contractId').populate('periodId');

        for (let entry of entries) {
            if (entry.status !== 'PAID') {
                // 1. Ensure we have a contract object for calculation
                let contractObj = entry.contractId;
                if (!contractObj) {
                    const foundContract = await Contract.findOne({
                        employeeId: entry.employeeId,
                        status: 'validated',
                        $or: [
                            { endDate: { $exists: false } },
                            { endDate: null },
                            { endDate: { $gte: new Date(entry.periodId.year, entry.periodId.month - 1, 1) } }
                        ]
                    });
                    if (foundContract) {
                        entry.contractId = foundContract._id;
                        contractObj = foundContract;
                    }
                }

                // 2. Refresh Primes from source
                const { month, year } = entry.periodId;
                const startOfMonth = new Date(year, month - 1, 1);
                const endOfMonth = new Date(year, month, 0);

                const employeePrimes = await Prime.find({
                    employeeId: entry.employeeId,
                    date: { $gte: startOfMonth, $lte: endOfMonth }
                });

                entry.primes = employeePrimes.map(p => ({
                    type: 'Prime sur Objectif/Autres',
                    amount: p.amount,
                    description: `ID: ${p._id}`
                }));

                // 3. Perform final calculation with the object
                entry.calculations = calculateSalaryDetails(contractObj, entry.presence, entry.primes);

                await entry.save();
            }
        }
        res.json({ message: "Recalculation complete" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.closePeriod = async (req, res) => {
    try {
        const { periodId } = req.params;
        const period = await PayrollPeriod.findById(periodId);
        if (!period) return res.status(404).json({ message: "Period not found" });

        // Check if all validated
        const notValidated = await PayrollEntry.countDocuments({ periodId, status: { $ne: 'VALIDATED' } });
        if (notValidated > 0) return res.status(400).json({ message: `Cannot close: ${notValidated} entries are not validated.` });

        period.status = 'CLOSED';
        period.isClosed = true;
        await period.save();
        res.json(period);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// --- Employee Controllers ---

exports.getMyEntries = async (req, res) => {
    try {
        // req.user is set by auth middleware
        const entries = await PayrollEntry.find({ employeeId: req.user._id })
            .populate('periodId')
            .sort({ 'createdAt': -1 });
        res.json(entries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateMyEntry = async (req, res) => {
    try {
        const { entryId } = req.params;
        const { presence, primes } = req.body; // Employee submits these

        const entry = await PayrollEntry.findOne({ _id: entryId, employeeId: req.user._id });
        if (!entry) return res.status(404).json({ message: "Entry not found" });

        if (entry.status === 'VALIDATED' || entry.status === 'PAID') {
            return res.status(400).json({ message: "Cannot modify validated entry" });
        }

        if (presence) entry.presence = presence;
        // Ideally employees shouldn't set their own primes without approval, but per prompt "Saisie des primes", allowing it.
        if (primes) entry.primes = primes; // Array of objects

        entry.status = 'SUBMITTED'; // Auto-submit
        await entry.save();
        res.json(entry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.disputeEntry = async (req, res) => {
    try {
        const { entryId } = req.params;
        const { reason } = req.body;

        const entry = await PayrollEntry.findOne({ _id: entryId, employeeId: req.user._id });
        if (!entry) return res.status(404).json({ message: "Entry not found" });

        if (entry.status !== 'VALIDATED' && entry.status !== 'PAID') {
            return res.status(400).json({ message: "Only validated entries can be disputed." });
        }

        entry.status = 'DISPUTED';
        entry.disputeReason = reason;
        await entry.save();
        res.json(entry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.generatePayslipPdf = async (req, res) => {
    try {
        const { entryId } = req.params;
        const entry = await PayrollEntry.findById(entryId)
            .populate('employeeId')
            .populate('periodId');

        if (!entry) return res.status(404).json({ message: "Entry not found" });

        // Simple PDF Generation
        const doc = new PDFDocument();
        const filename = `bulletin_${entry.employeeId.fullName}_${entry.periodId.month}_${entry.periodId.year}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        doc.pipe(res);

        // Professional Payslip Layout
        const calcs = entry.calculations || {};
        const presence = entry.presence || {};

        // Header
        doc.fontSize(18).text('BULLETIN DE PAIE', { align: 'center' }).moveDown();

        // Employee Info Box
        doc.rect(50, 100, 500, 70).stroke();
        doc.fontSize(10).text(`Employé: ${entry.employeeId.fullName}`, 60, 110);
        doc.text(`Matricule: ${entry.employeeId._id.toString().substring(0, 8)}`, 300, 110);
        doc.text(`Période: ${entry.periodId.month}/${entry.periodId.year}`, 60, 130);
        doc.text(`Département: ${entry.employeeId.department || 'N/A'}`, 300, 130);
        doc.text(`Fonction: ${entry.employeeId.role}`, 60, 150);

        // Table Header
        let y = 200;
        doc.font('Helvetica-Bold');
        doc.text('Rubrique', 50, y);
        doc.text('Base/Taux', 250, y);
        doc.text('Gains (+)', 350, y);
        doc.text('Retenues (-)', 450, y);
        doc.moveTo(50, y + 15).lineTo(550, y + 15).stroke();
        y += 25;
        doc.font('Helvetica');

        // Functions to add row
        const addRow = (label, base, gain, deduction) => {
            doc.text(label, 50, y);
            if (base) doc.text(base, 250, y);
            if (gain) doc.text(gain, 350, y);
            if (deduction) doc.text(deduction, 450, y);
            y += 20;
        };

        // Helper to format
        const f = (val) => (val || 0).toFixed(3);

        // 1. Salaire de Base
        addRow('Salaire de Base', '', `${f(calcs.baseSalary)}`, '');

        // 2. Absences
        if (calcs.absenceDeduction > 0) {
            addRow('Absences (Heures)', `${presence.absences || 0}h x ${f(calcs.hourlyRate)}`, '', `${f(calcs.absenceDeduction)}`);
        }

        // 3. Heures Sup
        if (calcs.overtimePay > 0) {
            addRow('Heures Supplémentaires', `${presence.overtimeHours || 0}h`, `${f(calcs.overtimePay)}`, '');
        }

        // 4. Primes
        if (entry.primes && entry.primes.length > 0) {
            entry.primes.forEach(p => {
                addRow(`Prime: ${p.type}`, '', `${f(p.amount)}`, '');
            });
        }

        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 10;

        // 5. Brut
        doc.font('Helvetica-Bold');
        addRow('TOTAL BRUT', '', `${f(calcs.grossSalary)}`, '');
        y += 10;

        // 6. Retenues
        doc.font('Helvetica');
        addRow('Retenues CNSS (Charges)', '9.18%', '', `${f(calcs.socialCharges)}`);
        addRow('Impôt sur le Revenu (IRPP)', '', '', `${f(calcs.tax)}`);

        doc.moveTo(50, y + 10).lineTo(550, y + 10).stroke();
        y += 30;

        // 7. Net à Payer
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text(`NET À PAYER: ${f(calcs.netSalary)} TND`, 350, y);

        doc.end();

    } catch (err) {
        // Can't send JSON if header already sent, but simplified here
        console.error(err);
        if (!res.headersSent) res.status(500).json({ message: err.message });
    }
};
