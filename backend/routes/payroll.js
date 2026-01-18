const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payroll');
const protect = require('../middleware/auth');

// Middleware to check role
// Assuming 'rh' or 'directeur' or 'manager' can manage payroll? Prompt says "Responsable RH".
const isRH = (req, res, next) => {
    if (req.user && (req.user.role === 'rh' || req.user.role === 'admin' || req.user.role === 'directeur')) {
        next();
    } else {
        res.status(403).json({ message: "RH Access Required" });
    }
};

// --- RH Routes ---
router.post('/periods', protect, isRH, payrollController.createPeriod);
router.get('/periods', protect, isRH, payrollController.getPeriods);
router.get('/periods/:periodId/entries', protect, isRH, payrollController.getPeriodEntries); // Get all entries for a month
router.put('/entries/:entryId/validate', protect, isRH, payrollController.validateEntry); // Validate/Reject single
router.post('/periods/:periodId/calculate-all', protect, isRH, payrollController.calculateAll); // Bulk Calc
router.post('/periods/:periodId/close', protect, isRH, payrollController.closePeriod); // Finalize
router.post('/remind', protect, isRH, payrollController.sendReminder); // Send Notification

// --- Employee Routes ---
router.get('/my-entries', protect, payrollController.getMyEntries);
router.put('/entries/:entryId', protect, payrollController.updateMyEntry); // Submit hours/primes
router.post('/entries/:entryId/dispute', protect, payrollController.disputeEntry); // Signal error
router.get('/entries/:entryId/payslip', protect, payrollController.generatePayslipPdf); // Download PDF

module.exports = router;
