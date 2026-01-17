const User = require('../models/User');
const Department = require('../models/Department');
const Tariff = require('../models/Tariff');
const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// ==========================================
// User Management
// ==========================================

/**
 * @desc    Get all users
 * @route   GET /api/admin/users
 */
exports.getAllUsers = asyncHandler(async (req, res, next) => {
    const { role, isActive, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const skip = (page - 1) * limit;

    const users = await User.find(query)
        .populate('department', 'name')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
        success: true,
        count: users.length,
        total,
        page: parseInt(page),
        data: users,
    });
});

/**
 * @desc    Create user
 * @route   POST /api/admin/users
 */
exports.createUser = asyncHandler(async (req, res, next) => {
    const user = await User.create(req.body);

    res.status(201).json({
        success: true,
        data: user,
    });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/admin/users/:id
 */
exports.getUserById = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id).populate('department');

    if (!user) {
        return next(new ErrorResponse('User not found', 404));
    }

    res.status(200).json({
        success: true,
        data: user,
    });
});

/**
 * @desc    Update user
 * @route   PUT /api/admin/users/:id
 */
exports.updateUser = asyncHandler(async (req, res, next) => {
    // Don't allow password update through this route
    delete req.body.password;

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    if (!user) {
        return next(new ErrorResponse('User not found', 404));
    }

    res.status(200).json({
        success: true,
        data: user,
    });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 */
exports.deleteUser = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new ErrorResponse('User not found', 404));
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'User deactivated successfully',
    });
});

// ==========================================
// Department Management
// ==========================================

/**
 * @desc    Get departments
 * @route   GET /api/admin/departments
 */
exports.getDepartments = asyncHandler(async (req, res, next) => {
    const departments = await Department.find()
        .populate('head', 'profile.firstName profile.lastName')
        .sort({ name: 1 });

    res.status(200).json({
        success: true,
        count: departments.length,
        data: departments,
    });
});

/**
 * @desc    Create department
 * @route   POST /api/admin/departments
 */
exports.createDepartment = asyncHandler(async (req, res, next) => {
    const department = await Department.create(req.body);

    res.status(201).json({
        success: true,
        data: department,
    });
});

// ==========================================
// Tariff Management
// ==========================================

/**
 * @desc    Get tariffs
 * @route   GET /api/admin/tariffs
 */
exports.getTariffs = asyncHandler(async (req, res, next) => {
    const tariffs = await Tariff.find()
        .populate('category', 'name')
        .sort({ name: 1 });

    res.status(200).json({
        success: true,
        count: tariffs.length,
        data: tariffs,
    });
});

/**
 * @desc    Create tariff
 * @route   POST /api/admin/tariffs
 */
exports.createTariff = asyncHandler(async (req, res, next) => {
    const tariff = await Tariff.create(req.body);

    res.status(201).json({
        success: true,
        data: tariff,
    });
});

// ==========================================
// Audit & System
// ==========================================

/**
 * @desc    Get audit logs
 * @route   GET /api/admin/audit-logs
 */
exports.getAuditLogs = asyncHandler(async (req, res, next) => {
    const { user, action, entity, page = 1, limit = 50 } = req.query;

    const query = {};
    if (user) query.user = user;
    if (action) query.action = action;
    if (entity) query.entity = entity;

    const skip = (page - 1) * limit;

    const logs = await AuditLog.find(query)
        .populate('user', 'username profile.firstName profile.lastName')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ timestamp: -1 });

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
        success: true,
        count: logs.length,
        total,
        page: parseInt(page),
        data: logs,
    });
});

/**
 * @desc    Get system config
 * @route   GET /api/admin/system-config
 */
exports.getSystemConfig = asyncHandler(async (req, res, next) => {
    // TODO: Implement system config model
    res.status(200).json({
        success: true,
        data: {
            hospitalName: 'City Hospital',
            address: '123 Healthcare Avenue',
            phone: '+91-1234567890',
            email: 'info@cityhospital.com',
        },
    });
});

/**
 * @desc    Update system config
 * @route   PUT /api/admin/system-config
 */
exports.updateSystemConfig = asyncHandler(async (req, res, next) => {
    // TODO: Implement system config update
    res.status(200).json({
        success: true,
        message: 'System configuration updated',
    });
});

/**
 * @desc    Create backup
 * @route   POST /api/admin/backup
 */
exports.createBackup = asyncHandler(async (req, res, next) => {
    // TODO: Implement backup functionality
    res.status(200).json({
        success: true,
        message: 'Backup initiated',
        data: {
            backupId: `BKP${Date.now()}`,
            status: 'processing',
        },
    });
});

/**
 * @desc    Restore from backup
 * @route   POST /api/admin/restore
 */
exports.restoreBackup = asyncHandler(async (req, res, next) => {
    // TODO: Implement restore functionality
    res.status(200).json({
        success: true,
        message: 'Restore initiated',
    });
});
