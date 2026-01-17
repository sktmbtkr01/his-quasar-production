const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ErrorResponse = require('../utils/errorResponse');

/**
 * File Upload Middleware
 * Handles file uploads using multer
 */

// Ensure upload directories exist
const uploadDirs = ['./uploads', './uploads/documents', './uploads/images', './uploads/reports'];
uploadDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

/**
 * Storage configuration
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = './uploads';

        // Determine folder based on file type
        if (file.mimetype.startsWith('image/')) {
            folder = './uploads/images';
        } else if (file.mimetype === 'application/pdf') {
            folder = './uploads/documents';
        }

        cb(null, folder);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});

/**
 * Memory storage for temporary file processing
 */
const memoryStorage = multer.memoryStorage();

/**
 * File filter
 */
const fileFilter = (allowedTypes) => {
    return (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new ErrorResponse(`File type ${file.mimetype} is not allowed`, 400), false);
        }
    };
};

/**
 * Pre-configured upload middleware
 */

// General document upload
exports.uploadDocument = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: fileFilter([
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
    ]),
});

// Image upload
exports.uploadImage = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
});

// Report upload (PDF only)
exports.uploadReport = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: fileFilter(['application/pdf']),
});

// Profile picture upload
exports.uploadProfilePic = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: fileFilter(['image/jpeg', 'image/png']),
}).single('profilePicture');

// Multiple images upload
exports.uploadMultipleImages = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
}).array('images', 10);

// Lab/Radiology images
exports.uploadMedicalImages = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for medical images
    fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/dicom', 'application/dicom']),
}).array('medicalImages', 20);

// Memory storage for processing before S3 upload
exports.uploadToMemory = multer({
    storage: memoryStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * Error handler for multer errors
 */
exports.handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return next(new ErrorResponse('File too large', 400));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return next(new ErrorResponse('Too many files', 400));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return next(new ErrorResponse('Unexpected file field', 400));
        }
        return next(new ErrorResponse(err.message, 400));
    }
    next(err);
};

/**
 * Delete uploaded file
 */
exports.deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Error deleting file:', err.message);
        }
    });
};
