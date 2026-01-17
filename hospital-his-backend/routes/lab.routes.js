const express = require('express');
const router = express.Router();
const labController = require('../controllers/lab.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);

/**
 * @route   POST /api/lab/orders
 * @desc    Create a new lab order
 */
router.post('/orders', authorize('doctor', 'nurse'), labController.createLabOrder);

/**
 * @route   GET /api/lab/orders
 * @desc    Get all lab orders
 */
router.get('/orders', labController.getAllLabOrders);

/**
 * @route   GET /api/lab/orders/:id
 * @desc    Get lab order by ID
 */
router.get('/orders/:id', labController.getLabOrderById);

/**
 * @route   PUT /api/lab/orders/:id
 * @desc    Update lab order
 */
router.put('/orders/:id', authorize('lab_tech', 'doctor'), labController.updateLabOrder);

/**
 * @route   POST /api/lab/orders/:id/collect-sample
 * @desc    Mark sample as collected
 */
router.post('/orders/:id/collect-sample', authorize('lab_tech', 'nurse'), labController.collectSample);

/**
 * @route   POST /api/lab/orders/:id/enter-results
 * @desc    Enter lab results
 */
router.post('/orders/:id/enter-results', authorize('lab_tech'), labController.enterResults);

/**
 * @route   POST /api/lab/orders/:id/generate-report
 * @desc    Generate lab report
 */
router.post('/orders/:id/generate-report', authorize('lab_tech'), labController.generateReport);

/**
 * @route   GET /api/lab/queue
 * @desc    Get lab work queue
 */
router.get('/queue', authorize('lab_tech', 'admin'), labController.getLabQueue);

/**
 * @route   GET /api/lab/dashboard
 * @desc    Get lab dashboard stats
 */
router.get('/dashboard', authorize('lab_tech', 'admin'), labController.getDashboard);

/**
 * @route   GET /api/lab/tests
 * @desc    Get available lab tests (master)
 */
router.get('/tests', labController.getLabTests);

module.exports = router;
