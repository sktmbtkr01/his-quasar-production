/**
 * Role-Based Access Control (RBAC) Middleware
 * Handles authorization based on user roles
 */

const ErrorResponse = require('../utils/errorResponse');
const { USER_ROLES } = require('../config/constants');

/**
 * Authorize specific roles to access a route
 * @param  {...String} roles - Allowed roles
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ErrorResponse('User not authenticated', 401));
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
 * Check if user has specific permission
 * @param {String} permission - Required permission
 */
exports.hasPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ErrorResponse('User not authenticated', 401));
        }

        // Admin has all permissions
        if (req.user.role === USER_ROLES.ADMIN) {
            return next();
        }

        // Define role-permission mappings
        const rolePermissions = {
            [USER_ROLES.DOCTOR]: [
                'view_patient',
                'edit_patient',
                'view_emr',
                'create_emr',
                'edit_emr',
                'view_prescription',
                'create_prescription',
                'view_lab',
                'order_lab',
                'view_radiology',
                'order_radiology',
                'view_appointment',
                'create_appointment',
            ],
            [USER_ROLES.NURSE]: [
                'view_patient',
                'view_emr',
                'edit_emr',
                'view_prescription',
                'view_lab',
                'collect_sample',
                'view_vitals',
                'edit_vitals',
                'view_bed',
            ],
            [USER_ROLES.RECEPTIONIST]: [
                'view_patient',
                'create_patient',
                'edit_patient',
                'view_appointment',
                'create_appointment',
                'edit_appointment',
                'view_billing',
                'create_billing',
            ],
            [USER_ROLES.LAB_TECH]: [
                'view_lab',
                'edit_lab',
                'enter_lab_results',
                'view_patient',
            ],
            [USER_ROLES.RADIOLOGIST]: [
                'view_radiology',
                'edit_radiology',
                'enter_radiology_results',
                'view_patient',
            ],
            [USER_ROLES.PHARMACIST]: [
                'view_prescription',
                'dispense_medicine',
                'view_pharmacy_inventory',
                'edit_pharmacy_inventory',
                'view_patient',
            ],
            [USER_ROLES.BILLING]: [
                'view_billing',
                'create_billing',
                'edit_billing',
                'view_payment',
                'create_payment',
                'view_patient',
            ],
            [USER_ROLES.INSURANCE]: [
                'view_insurance',
                'create_insurance_claim',
                'edit_insurance_claim',
                'view_patient',
                'view_billing',
            ],
            [USER_ROLES.COMPLIANCE]: [
                'view_audit',
                'view_reports',
                'view_patient',
                'view_billing',
            ],
        };

        const userPermissions = rolePermissions[req.user.role] || [];

        if (!userPermissions.includes(permission)) {
            return next(
                new ErrorResponse(
                    `User does not have permission: ${permission}`,
                    403
                )
            );
        }

        next();
    };
};

/**
 * Check if user is accessing their own resource or is admin
 */
exports.isOwnerOrAdmin = (req, res, next) => {
    if (!req.user) {
        return next(new ErrorResponse('User not authenticated', 401));
    }

    const resourceUserId = req.params.userId || req.body.userId;

    if (
        req.user.role === USER_ROLES.ADMIN ||
        req.user._id.toString() === resourceUserId
    ) {
        return next();
    }

    return next(
        new ErrorResponse('Not authorized to access this resource', 403)
    );
};

/**
 * Check if user belongs to the same department
 */
exports.sameDepartment = (req, res, next) => {
    if (!req.user) {
        return next(new ErrorResponse('User not authenticated', 401));
    }

    // Admin can access all departments
    if (req.user.role === USER_ROLES.ADMIN) {
        return next();
    }

    const departmentId = req.params.departmentId || req.body.departmentId;

    if (req.user.department && req.user.department.toString() === departmentId) {
        return next();
    }

    return next(
        new ErrorResponse('Not authorized to access this department', 403)
    );
};
