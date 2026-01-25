/**
 * Centralized API Configuration
 * All services should import these constants instead of hardcoding URLs
 */

// Base API URL - uses environment variable or falls back to localhost in development
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// Socket.IO URL for real-time features
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// OCR Service URL
export const OCR_URL = import.meta.env.VITE_OCR_URL || 'http://localhost:8000';

// Get base URL without /api/v1 for static file serving
export const getServerBaseUrl = () => {
    const apiUrl = API_BASE_URL;
    // Remove /api/v1 suffix to get base server URL
    return apiUrl.replace('/api/v1', '');
};

export default {
    API_BASE_URL,
    SOCKET_URL,
    OCR_URL,
    getServerBaseUrl
};
