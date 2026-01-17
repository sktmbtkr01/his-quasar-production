/**
 * Standard API Response Utilities
 * Consistent response formatting across the application
 */

/**
 * Success response
 */
exports.success = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

/**
 * Created response (201)
 */
exports.created = (res, data, message = 'Resource created successfully') => {
    return res.status(201).json({
        success: true,
        message,
        data,
    });
};

/**
 * Error response
 */
exports.error = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
    const response = {
        success: false,
        message,
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

/**
 * Not found response (404)
 */
exports.notFound = (res, message = 'Resource not found') => {
    return res.status(404).json({
        success: false,
        message,
    });
};

/**
 * Bad request response (400)
 */
exports.badRequest = (res, message = 'Bad request', errors = null) => {
    const response = {
        success: false,
        message,
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(400).json(response);
};

/**
 * Unauthorized response (401)
 */
exports.unauthorized = (res, message = 'Unauthorized access') => {
    return res.status(401).json({
        success: false,
        message,
    });
};

/**
 * Forbidden response (403)
 */
exports.forbidden = (res, message = 'Access forbidden') => {
    return res.status(403).json({
        success: false,
        message,
    });
};

/**
 * Validation error response (422)
 */
exports.validationError = (res, errors, message = 'Validation failed') => {
    return res.status(422).json({
        success: false,
        message,
        errors,
    });
};

/**
 * Paginated response
 */
exports.paginated = (res, data, pagination, message = 'Success') => {
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            pages: pagination.pages,
            hasNextPage: pagination.page < pagination.pages,
            hasPrevPage: pagination.page > 1,
        },
    });
};

/**
 * List response with count
 */
exports.list = (res, data, total, message = 'Success') => {
    return res.status(200).json({
        success: true,
        message,
        count: data.length,
        total,
        data,
    });
};

/**
 * No content response (204)
 */
exports.noContent = (res) => {
    return res.status(204).send();
};

/**
 * Server error response (500)
 */
exports.serverError = (res, message = 'Internal server error') => {
    return res.status(500).json({
        success: false,
        message,
    });
};

/**
 * Service unavailable response (503)
 */
exports.serviceUnavailable = (res, message = 'Service temporarily unavailable') => {
    return res.status(503).json({
        success: false,
        message,
    });
};
