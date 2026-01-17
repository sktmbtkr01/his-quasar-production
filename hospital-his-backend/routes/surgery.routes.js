const express = require('express');
const router = express.Router();
const surgeryController = require('../controllers/surgery.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);

/**
 * @route   POST /api/surgery/schedule
 * @desc    Schedule a new surgery
 */
router.post('/schedule', authorize('doctor', 'admin'), surgeryController.scheduleSurgery);

/**
 * @route   GET /api/surgery/schedules
 * @desc    Get all surgery schedules
 */
router.get('/schedules', surgeryController.getAllSchedules);

/**
 * @route   GET /api/surgery/schedules/:id
 * @desc    Get surgery schedule by ID
 */
router.get('/schedules/:id', surgeryController.getScheduleById);

/**
 * @route   PUT /api/surgery/schedules/:id
 * @desc    Update surgery schedule
 */
router.put('/schedules/:id', authorize('doctor', 'admin'), surgeryController.updateSchedule);

/**
 * @route   GET /api/surgery/ot-roster
 * @desc    Get OT roster
 */
router.get('/ot-roster', surgeryController.getOTRoster);

/**
 * @route   GET /api/surgery/dashboard
 * @desc    Get surgery dashboard stats
 */
router.get('/dashboard', authorize('doctor', 'admin'), surgeryController.getDashboard);

/**
 * @route   POST /api/surgery/schedules/:id/complete
 * @desc    Mark surgery as complete
 */
router.post('/schedules/:id/complete', authorize('doctor'), surgeryController.completeSurgery);

module.exports = router;
