const mongoose = require('mongoose');

const PayrollEntrySchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    periodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PayrollPeriod',
        required: true
    },
    contractId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contract',
        required: false // Changed from true to allow entries for employees without contracts
    },
    // Inputs (Saisis par employé ou RH)
    presence: {
        normalHours: { type: Number, default: 0 },
        overtimeHours: { type: Number, default: 0 },
        absences: { type: Number, default: 0 }, // Hours or Days depending on logic
        unpaidLeaves: { type: Number, default: 0 }
    },
    primes: [{
        type: { type: String, required: true }, // e.g., 'Performance', 'Transport'
        amount: { type: Number, required: true },
        description: String
    }],

    // Outputs (Calculés par Système)
    calculations: {
        baseSalary: { type: Number, default: 0 },
        hourlyRate: { type: Number, default: 0 }, // Taux Horaire
        overtimePay: { type: Number, default: 0 },
        absenceDeduction: { type: Number, default: 0 }, // Retenue absences
        primesTotal: { type: Number, default: 0 },
        grossSalary: { type: Number, default: 0 }, // Brut
        socialCharges: { type: Number, default: 0 }, // CNSS, etc
        tax: { type: Number, default: 0 }, // IRPP
        netSalary: { type: Number, default: 0 }
    },

    status: {
        type: String,
        enum: ['DRAFT', 'SUBMITTED', 'REJECTED', 'VALIDATED', 'PAID', 'DISPUTED'],
        default: 'DRAFT'
    },
    rhComment: { type: String },
    disputeReason: { type: String }, // Employee feedback if error signaled
    payslipUrl: { type: String } // Path to generated PDF
}, { timestamps: true });

// Unique entry per employee per period
PayrollEntrySchema.index({ employeeId: 1, periodId: 1 }, { unique: true });

module.exports = mongoose.model('PayrollEntry', PayrollEntrySchema);
