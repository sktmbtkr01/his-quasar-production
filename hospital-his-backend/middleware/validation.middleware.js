const { validationResult, body, param, query } = require('express-validator');
const ErrorResponse = require('../utils/errorResponse');

/**
 * Validation Middleware
 * Handles request validation using express-validator
 */

/**
 * Validate request and return errors if any
 */
exports.validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((err) => err.msg);
        return next(new ErrorResponse(errorMessages.join(', '), 400));
    }
    next();
};

/**
 * Common validation rules
 */
exports.rules = {
    // Patient validation
    createPatient: [
        body('firstName').trim().notEmpty().withMessage('First name is required'),
        body('lastName').trim().notEmpty().withMessage('Last name is required'),
        body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
        body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
        body('phone').matches(/^[0-9]{10}$/).withMessage('Valid 10-digit phone number is required'),
        body('email').optional().isEmail().withMessage('Valid email is required'),
    ],

    // Appointment validation
    createAppointment: [
        body('patient').isMongoId().withMessage('Valid patient ID is required'),
        body('doctor').isMongoId().withMessage('Valid doctor ID is required'),
        body('department').isMongoId().withMessage('Valid department ID is required'),
        body('scheduledDate').isISO8601().withMessage('Valid date is required'),
        body('scheduledTime').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time (HH:MM) is required'),
    ],

    // Admission validation
    createAdmission: [
        body('patient').isMongoId().withMessage('Valid patient ID is required'),
        body('doctor').isMongoId().withMessage('Valid doctor ID is required'),
        body('department').isMongoId().withMessage('Valid department ID is required'),
        body('ward').isMongoId().withMessage('Valid ward ID is required'),
        body('bed').isMongoId().withMessage('Valid bed ID is required'),
        body('reasonForAdmission').trim().notEmpty().withMessage('Reason for admission is required'),
    ],

    // Billing validation
    createBill: [
        body('patient').isMongoId().withMessage('Valid patient ID is required'),
        body('items').isArray({ min: 1 }).withMessage('At least one billing item is required'),
        body('items.*.description').notEmpty().withMessage('Item description is required'),
        body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity is required'),
        body('items.*.rate').isFloat({ min: 0 }).withMessage('Valid rate is required'),
    ],

    // Payment validation
    createPayment: [
        body('bill').isMongoId().withMessage('Valid bill ID is required'),
        body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
        body('paymentMode').isIn(['cash', 'card', 'upi', 'cheque', 'online', 'insurance']).withMessage('Valid payment mode is required'),
    ],

    // Login validation
    login: [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
    ],

    // Password change validation
    changePassword: [
        body('currentPassword').notEmpty().withMessage('Current password is required'),
        body('newPassword')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
            .matches(/[A-Z]/)
            .withMessage('Password must contain at least one uppercase letter')
            .matches(/[0-9]/)
            .withMessage('Password must contain at least one number'),
    ],

    // Common param validation
    mongoId: [
        param('id').isMongoId().withMessage('Invalid ID format'),
    ],

    // Pagination validation
    pagination: [
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    ],

    // Date range validation
    dateRange: [
        query('startDate').optional().isISO8601().withMessage('Valid start date is required'),
        query('endDate').optional().isISO8601().withMessage('Valid end date is required'),
    ],
};

/**
 * Sanitize request body
 */
exports.sanitize = (req, res, next) => {
    // Trim all string fields
    if (req.body && typeof req.body === 'object') {
        Object.keys(req.body).forEach((key) => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        });
    }
    next();
};
