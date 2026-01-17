const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);

/**
 * @route   GET /api/staff
 * @desc    Get all staff
 */
router.get('/', authorize('admin'), staffController.getAllStaff);

/**
 * @route   POST /api/staff
 * @desc    Add new staff
 */
router.post('/', authorize('admin'), staffController.addStaff);

/**
 * @route   GET /api/staff/:id
 * @desc    Get staff by ID
 */
router.get('/:id', authorize('admin'), staffController.getStaffById);

/**
 * @route   PUT /api/staff/:id
 * @desc    Update staff
 */
router.put('/:id', authorize('admin'), staffController.updateStaff);

/**
 * @route   DELETE /api/staff/:id
 * @desc    Delete staff
 */
router.delete('/:id', authorize('admin'), staffController.deleteStaff);

/**
 * @route   POST /api/staff/attendance
 * @desc    Record attendance
 */
router.post('/attendance', authorize('admin'), staffController.recordAttendance);

/**
 * @route   GET /api/staff/attendance
 * @desc    Get attendance records
 */
router.get('/attendance', authorize('admin'), staffController.getAttendance);

/**
 * @route   POST /api/staff/leaves
 * @desc    Apply for leave
 */
router.post('/leaves', staffController.applyLeave);

/**
 * @route   GET /api/staff/leaves
 * @desc    Get leave records
 */
router.get('/leaves', authorize('admin'), staffController.getLeaves);

/**
 * @route   PUT /api/staff/leaves/:id
 * @desc    Approve/reject leave
 */
router.put('/leaves/:id', authorize('admin'), staffController.updateLeave);

module.exports = router;
