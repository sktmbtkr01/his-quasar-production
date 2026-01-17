const { USER_ROLES } = require('../config/constants');
const ErrorResponse = require('../utils/errorResponse');

/**
 * RBAC (Role-Based Access Control) Middleware
 * Controls access based on user roles
 */

/**
 * Authorize specific roles
 * @param  {...string} roles - Allowed roles
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ErrorResponse('Not authenticated', 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(
                new ErrorResponse(
                    `User role '${req.user.role}' is not authorized to access this route`,
                    403
                )
            );
        }

        next();
    };
};

/**
 * Check if user has any of the specified permissions
 * @param  {...string} permissions - Required permissions
 */
exports.hasPermission = (...permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ErrorResponse('Not authenticated', 401));
        }

        // Define role-permission mapping
        const rolePermissions = {
            [USER_ROLES.ADMIN]: ['*'], // Admin has all permissions
            [USER_ROLES.DOCTOR]: [
                'view:patients',
                'edit:patients',
                'view:appointments',
                'edit:appointments',
                'view:emr',
                'edit:emr',
                'create:prescription',
                'view:lab',
                'create:lab',
                'view:radiology',
                'create:radiology',
            ],
            [USER_ROLES.NURSE]: [
                'view:patients',
                'view:appointments',
                'edit:appointments',
                'view:emr',
                'edit:vitals',
                'view:lab',
            ],
            [USER_ROLES.RECEPTIONIST]: [
                'view:patients',
                'create:patients',
                'edit:patients',
                'view:appointments',
                'create:appointments',
                'edit:appointments',
            ],
            [USER_ROLES.LAB_TECH]: ['view:lab', 'edit:lab', 'create:lab-results'],
            [USER_ROLES.PHARMACIST]: ['view:prescriptions', 'dispense:medicines', 'edit:pharmacy-inventory'],
            [USER_ROLES.BILLING]: ['view:billing', 'create:billing', 'edit:billing', 'view:payments', 'create:payments'],
            [USER_ROLES.RADIOLOGIST]: ['view:radiology', 'edit:radiology', 'create:radiology-report'],
        };

        const userPermissions = rolePermissions[req.user.role] || [];

        // Check if user has any of the required permissions
        const hasPermission =
            userPermissions.includes('*') ||
            permissions.some((permission) => userPermissions.includes(permission));

        if (!hasPermission) {
            return next(new ErrorResponse('Insufficient permissions', 403));
        }

        next();
    };
};

/**
 * Restrict access to resource owner or admin
 */
exports.ownerOrAdmin = (resourceField = 'user') => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ErrorResponse('Not authenticated', 401));
        }

        // Admin can access everything
        if (req.user.role === USER_ROLES.ADMIN) {
            return next();
        }

        // Check if user owns the resource
        const resourceId = req.params.id;
        const userId = req.user._id.toString();

        // For routes where the resource has a user field
        if (req.resource && req.resource[resourceField]?.toString() === userId) {
            return next();
        }

        // For self-access routes (like /users/:id)
        if (resourceId === userId) {
            return next();
        }

        return next(new ErrorResponse('Not authorized to access this resource', 403));
    };
};

/**
 * Department-based access control
 */
exports.sameDepartment = (req, res, next) => {
    if (!req.user) {
        return next(new ErrorResponse('Not authenticated', 401));
    }

    // Admin can access all departments
    if (req.user.role === USER_ROLES.ADMIN) {
        return next();
    }

    const departmentId = req.params.departmentId || req.query.department || req.body.department;

    if (departmentId && req.user.department?.toString() !== departmentId) {
        return next(new ErrorResponse('Not authorized to access this department', 403));
    }

    next();
};
