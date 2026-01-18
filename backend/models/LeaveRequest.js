const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['Annuel', 'Maladie', 'Sans solde', 'Exceptionnel'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    isHalfDay: {
        type: Boolean,
        default: false
    },
    reason: {
        type: String,
        required: true
    },
    attachmentUrl: {
        type: String // Optional, mandatory for 'Maladie' (checked in controller)
    },
    status: {
        type: String,
        enum: ['pending_manager', 'pending_rh', 'approved', 'rejected'],
        default: 'pending_manager'
    },
    managerComment: {
        type: String
    },
    rhComment: {
        type: String
    },
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

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
