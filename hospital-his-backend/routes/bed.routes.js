const express = require('express');
const router = express.Router();
const bedController = require('../controllers/bed.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);

/**
 * @route   GET /api/beds
 * @desc    Get all beds
 */
router.get('/', bedController.getAllBeds);

/**
 * @route   GET /api/beds/:id
 * @desc    Get bed by ID
 */
router.get('/:id', bedController.getBedById);

/**
 * @route   PUT /api/beds/:id
 * @desc    Update bed
 */
router.put('/:id', authorize('admin', 'nurse'), bedController.updateBed);

/**
 * @route   POST /api/beds/allocate
 * @desc    Allocate bed to patient
 */
router.post('/allocate', authorize('receptionist', 'nurse', 'admin'), bedController.allocateBed);

/**
 * @route   POST /api/beds/transfer
 * @desc    Transfer patient to another bed
 */
router.post('/transfer', authorize('nurse', 'admin'), bedController.transferBed);

/**
 * @route   GET /api/beds/availability
 * @desc    Get available beds
 */
router.get('/availability', bedController.getAvailability);

/**
 * @route   GET /api/beds/occupancy
 * @desc    Get bed occupancy stats
 */
router.get('/occupancy', bedController.getOccupancy);

/**
 * @route   POST /api/beds
 * @desc    Add new bed
 */
router.post('/', authorize('admin'), bedController.addBed);

/**
 * @route   GET /api/beds/wards
 * @desc    Get all wards
 */
router.get('/wards', bedController.getWards);

module.exports = router;
