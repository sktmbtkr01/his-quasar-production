/**
 * Helper Functions
 * Common utility functions used across the application
 */

/**
 * Generate random alphanumeric string
 */
exports.generateRandomString = (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * Generate numeric OTP
 */
exports.generateOTP = (length = 6) => {
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += Math.floor(Math.random() * 10);
    }
    return otp;
};

/**
 * Capitalize first letter
 */
exports.capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert to title case
 */
exports.toTitleCase = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Slugify string
 */
exports.slugify = (str) => {
    return str
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

/**
 * Deep clone object
 */
exports.deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if object is empty
 */
exports.isEmpty = (obj) => {
    if (!obj) return true;
    if (Array.isArray(obj)) return obj.length === 0;
    if (typeof obj === 'object') return Object.keys(obj).length === 0;
    return false;
};

/**
 * Pick specific keys from object
 */
exports.pick = (obj, keys) => {
    return keys.reduce((acc, key) => {
        if (obj.hasOwnProperty(key)) {
            acc[key] = obj[key];
        }
        return acc;
    }, {});
};

/**
 * Omit specific keys from object
 */
exports.omit = (obj, keys) => {
    const result = { ...obj };
    keys.forEach((key) => delete result[key]);
    return result;
};

/**
 * Group array by key
 */
exports.groupBy = (array, key) => {
    return array.reduce((acc, item) => {
        const group = item[key];
        if (!acc[group]) {
            acc[group] = [];
        }
        acc[group].push(item);
        return acc;
    }, {});
};

/**
 * Remove duplicates from array
 */
exports.uniqueArray = (array, key = null) => {
    if (key) {
        const seen = new Set();
        return array.filter((item) => {
            const value = item[key];
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        });
    }
    return [...new Set(array)];
};

/**
 * Paginate array
 */
exports.paginate = (array, page = 1, limit = 10) => {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const results = {
        data: array.slice(startIndex, endIndex),
        pagination: {
            total: array.length,
            page,
            limit,
            pages: Math.ceil(array.length / limit),
        },
    };

    if (endIndex < array.length) {
        results.pagination.next = page + 1;
    }
    if (startIndex > 0) {
        results.pagination.prev = page - 1;
    }

    return results;
};

/**
 * Format currency (INR)
 */
exports.formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
    }).format(amount);
};

/**
 * Calculate percentage
 */
exports.calculatePercentage = (value, total) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100 * 100) / 100;
};

/**
 * Round to decimal places
 */
exports.roundTo = (num, decimals = 2) => {
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

/**
 * Sleep/delay function
 */
exports.sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
exports.retry = async (fn, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await exports.sleep(delay * Math.pow(2, i));
        }
    }
};

/**
 * Mask sensitive data
 */
exports.maskData = (str, visibleChars = 4) => {
    if (!str || str.length <= visibleChars) return str;
    const masked = '*'.repeat(str.length - visibleChars);
    return masked + str.slice(-visibleChars);
};

/**
 * Parse query string params
 */
exports.parseQueryParams = (query) => {
    const params = {};
    Object.keys(query).forEach((key) => {
        const value = query[key];
        // Parse boolean strings
        if (value === 'true') params[key] = true;
        else if (value === 'false') params[key] = false;
        // Parse numbers
        else if (!isNaN(value) && value !== '') params[key] = Number(value);
        else params[key] = value;
    });
    return params;
};
