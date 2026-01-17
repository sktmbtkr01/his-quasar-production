const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacy.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);

/**
 * @route   POST /api/pharmacy/dispense
 * @desc    Dispense medicines
 */
router.post('/dispense', authorize('pharmacist'), pharmacyController.dispenseMedicines);

/**
 * @route   GET /api/pharmacy/queue
 * @desc    Get pharmacy dispensing queue
 */
router.get('/queue', authorize('pharmacist'), pharmacyController.getPharmacyQueue);

/**
 * @route   GET /api/pharmacy/inventory
 * @desc    Get pharmacy inventory
 */
router.get('/inventory', authorize('pharmacist', 'admin'), pharmacyController.getInventory);

/**
 * @route   POST /api/pharmacy/inventory
 * @desc    Add stock to inventory
 */
router.post('/inventory', authorize('pharmacist', 'admin'), pharmacyController.addStock);

/**
 * @route   PUT /api/pharmacy/inventory/:id
 * @desc    Update inventory item
 */
router.put('/inventory/:id', authorize('pharmacist', 'admin'), pharmacyController.updateStock);

/**
 * @route   GET /api/pharmacy/expiry-alerts
 * @desc    Get medicines nearing expiry
 */
router.get('/expiry-alerts', authorize('pharmacist', 'admin'), pharmacyController.getExpiryAlerts);

/**
 * @route   GET /api/pharmacy/dashboard
 * @desc    Get pharmacy dashboard stats
 */
router.get('/dashboard', authorize('pharmacist', 'admin'), pharmacyController.getDashboard);

/**
 * @route   GET /api/pharmacy/medicines
 * @desc    Get medicines catalog
 */
router.get('/medicines', pharmacyController.getMedicines);

module.exports = router;
