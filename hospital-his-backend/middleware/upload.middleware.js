/**
 * File Upload Middleware
 * Handles file uploads using Multer
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ErrorResponse = require('../utils/errorResponse');

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create subdirectory based on resource type
        const resourceType = req.baseUrl.split('/').pop() || 'general';
        const uploadPath = path.join(uploadsDir, resourceType);

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});

// File filter
const fileFilter = (allowedTypes) => {
    return (req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new ErrorResponse(
                    `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
                    400
                ),
                false
            );
        }
    };
};

// Common file type configurations
const fileTypes = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    documents: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    medical: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/dicom',
        'image/dicom-rle',
    ],
    all: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
};

/**
 * Upload single image
 */
exports.uploadImage = multer({
    storage,
    fileFilter: fileFilter(fileTypes.images),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});

/**
 * Upload single document
 */
exports.uploadDocument = multer({
    storage,
    fileFilter: fileFilter(fileTypes.documents),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});

/**
 * Upload medical files (DICOM, PDFs, images)
 */
exports.uploadMedical = multer({
    storage,
    fileFilter: fileFilter(fileTypes.medical),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB for medical images
    },
});

/**
 * Upload any allowed file
 */
exports.uploadAny = multer({
    storage,
    fileFilter: fileFilter(fileTypes.all),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});

/**
 * Memory storage for processing files without saving
 */
exports.uploadToMemory = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
});

/**
 * Delete uploaded file
 */
exports.deleteFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};
