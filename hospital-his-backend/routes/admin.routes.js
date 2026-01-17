const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/rbac.middleware');

router.use(authenticate);
router.use(authorize('admin'));

// ==========================================
// User Management
// ==========================================

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 */
router.get('/users', adminController.getAllUsers);

/**
 * @route   POST /api/admin/users
 * @desc    Create new user
 */
router.post('/users', adminController.createUser);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID
 */
router.get('/users/:id', adminController.getUserById);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user
 */
router.put('/users/:id', adminController.updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user
 */
router.delete('/users/:id', adminController.deleteUser);

// ==========================================
// Department Management
// ==========================================

/**
 * @route   GET /api/admin/departments
 * @desc    Get all departments
 */
router.get('/departments', adminController.getDepartments);

/**
 * @route   POST /api/admin/departments
 * @desc    Create department
 */
router.post('/departments', adminController.createDepartment);

// ==========================================
// Tariff Management
// ==========================================

/**
 * @route   GET /api/admin/tariffs
 * @desc    Get all tariffs
 */
router.get('/tariffs', adminController.getTariffs);

/**
 * @route   POST /api/admin/tariffs
 * @desc    Create tariff
 */
router.post('/tariffs', adminController.createTariff);

// ==========================================
// Audit & System
// ==========================================

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs
 */
router.get('/audit-logs', adminController.getAuditLogs);

/**
 * @route   GET /api/admin/system-config
 * @desc    Get system configuration
 */
router.get('/system-config', adminController.getSystemConfig);

/**
 * @route   PUT /api/admin/system-config
 * @desc    Update system configuration
 */
router.put('/system-config', adminController.updateSystemConfig);

/**
 * @route   POST /api/admin/backup
 * @desc    Create backup
 */
router.post('/backup', adminController.createBackup);

/**
 * @route   POST /api/admin/restore
 * @desc    Restore from backup
 */
router.post('/restore', adminController.restoreBackup);

module.exports = router;
