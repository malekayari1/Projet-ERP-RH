const mongoose = require("mongoose");

const PrimeSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    evaluationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Evaluation",
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    chefEquipeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
});

module.exports = mongoose.model("Prime", PrimeSchema);
