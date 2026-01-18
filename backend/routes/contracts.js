const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const protect = require('../middleware/auth');
const permit = require('../middleware/roles');

// Get all contracts (filtered by role in controller)
router.get('/', protect, contractController.getContracts);

// Create contract (RH/Directeur/Employee - ERP Swimlane Trigger)
router.post('/', protect, permit('rh', 'directeur', 'employee'), contractController.createContract);

// RH Validation
router.post('/rh-validate', protect, permit('rh', 'directeur'), contractController.rhValidate);

// Employee Signature
router.post('/sign', protect, permit('employee'), contractController.employeeSign);

// Manager Final Validation
router.post('/manager-validate', protect, permit('manager', 'directeur'), contractController.managerValidate);

module.exports = router;
