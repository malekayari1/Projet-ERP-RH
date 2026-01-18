const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance'],
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'rh_pending', 'employee_pending', 'manager_pending', 'validated', 'rejected'],
        default: 'draft'
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date // Optional for CDI
    },
    unsignedFileUrl: String,
    signedFileUrl: String,
    rhComment: String,
    managerComment: String,
    history: [{
        status: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now },
        comment: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Contract', contractSchema);
