const mongoose = require('mongoose');

const PayrollPeriodSchema = new mongoose.Schema({
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['OPEN', 'CLOSED', 'ARCHIVED'],
        default: 'OPEN'
    },
    totalSalaries: {
        type: Number,
        default: 0
    },
    totalCharges: {
        type: Number,
        default: 0
    },
    isClosed: {
        type: Boolean,
        default: false
    },
    generatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ensure unique period per month/year
PayrollPeriodSchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('PayrollPeriod', PayrollPeriodSchema);
