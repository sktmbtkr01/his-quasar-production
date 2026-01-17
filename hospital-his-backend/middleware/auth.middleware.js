const jwt = require('jsonwebtoken');
const config = require('../config/config');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

/**
 * Protect routes - require authentication
 */
exports.authenticate = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies (optional)
    else if (req.cookies?.token) {
        token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, config.jwt.secret);

        // Get user from token
        const user = await User.findById(decoded.id).populate('department');

        if (!user) {
            return next(new ErrorResponse('User not found', 401));
        }

        if (!user.isActive) {
            return next(new ErrorResponse('User account is deactivated', 401));
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new ErrorResponse('Token expired', 401));
        }
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }
});

/**
 * Optional authentication - attaches user if token exists but doesn't require it
 */
exports.optionalAuth = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, config.jwt.secret);
            req.user = await User.findById(decoded.id);
        } catch {
            // Token invalid but continue without user
        }
    }

    next();
});

/**
 * Socket authentication middleware
 */
exports.socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;

        if (!token) {
            return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            return next(new Error('Authentication error'));
        }

        socket.user = user;
        next();
    } catch {
        next(new Error('Authentication error'));
    }
};
