const AuditLog = require('../models/AuditLog');

/**
 * Audit Logging Middleware
 * Records user actions for compliance and security
 */

/**
 * Create audit log entry
 */
const createAuditLog = async (logData) => {
    try {
        await AuditLog.create(logData);
    } catch (error) {
        console.error('Audit logging failed:', error.message);
    }
};

/**
 * Audit middleware - logs all modifying requests
 */
exports.auditLog = (entity) => {
    return async (req, res, next) => {
        // Store original json method
        const originalJson = res.json.bind(res);

        // Override json method to capture response
        res.json = (body) => {
            // Log after response is prepared
            const logData = {
                user: req.user?._id,
                action: getActionFromMethod(req.method),
                entity,
                entityId: req.params.id || body?.data?._id,
                description: `${req.method} ${req.originalUrl}`,
                ipAddress: req.ip || req.connection?.remoteAddress,
                userAgent: req.get('User-Agent'),
                timestamp: new Date(),
                metadata: {
                    statusCode: res.statusCode,
                    method: req.method,
                    url: req.originalUrl,
                    query: req.query,
                },
            };

            // For update operations, try to capture changes
            if (req.method === 'PUT' || req.method === 'PATCH') {
                logData.changes = {
                    after: sanitizeBody(req.body),
                };
            }

            // Only log modifying operations or if explicitly requested
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
                createAuditLog(logData);
            }

            return originalJson(body);
        };

        next();
    };
};

/**
 * Explicit audit log for sensitive operations
 */
exports.logAction = (action, entity, description) => {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);

        res.json = (body) => {
            createAuditLog({
                user: req.user?._id,
                action,
                entity,
                entityId: req.params.id || body?.data?._id,
                description: description || `${action} on ${entity}`,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent'),
                timestamp: new Date(),
            });

            return originalJson(body);
        };

        next();
    };
};

/**
 * Log login attempts
 */
exports.logLogin = async (req, user, success) => {
    await createAuditLog({
        user: user?._id,
        action: success ? 'login' : 'login_failed',
        entity: 'User',
        entityId: user?._id,
        description: success ? 'User logged in successfully' : 'Login attempt failed',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        metadata: {
            email: req.body.email,
            success,
        },
    });
};

/**
 * Log data export
 */
exports.logExport = async (req, entity, recordCount) => {
    await createAuditLog({
        user: req.user?._id,
        action: 'export',
        entity,
        description: `Exported ${recordCount} ${entity} records`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        metadata: {
            recordCount,
            exportType: req.query.format || 'unknown',
        },
    });
};

/**
 * Helper: Get action from HTTP method
 */
const getActionFromMethod = (method) => {
    const actionMap = {
        GET: 'read',
        POST: 'create',
        PUT: 'update',
        PATCH: 'update',
        DELETE: 'delete',
    };
    return actionMap[method] || 'other';
};

/**
 * Helper: Sanitize request body to remove sensitive data
 */
const sanitizeBody = (body) => {
    if (!body) return null;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'creditCard', 'cvv'];

    sensitiveFields.forEach((field) => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });

    return sanitized;
};
