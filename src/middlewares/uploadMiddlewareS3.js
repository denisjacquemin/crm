require('dotenv').config();
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Define all possible error types and their messages
const ERROR_MESSAGES = {
    logo: {
        FILE_TYPE: 'middleware.logo_file_type_error',
        FILE_SIZE: 'middleware.logo_file_size_error',
        NO_FILE: 'middleware.no_file_uploaded',
        UPLOAD_FAILED: 'middleware.upload_failed',
        UNKNOWN: 'middleware.unknown_error'
    },
    document: {
        FILE_TYPE: 'middleware.document_file_type_error',
        FILE_SIZE: 'middleware.document_file_size_error',
        NO_FILE: 'middleware.no_file_uploaded',
        UPLOAD_FAILED: 'middleware.upload_failed',
        UNKNOWN: 'middleware.unknown_error'
    }
};

// Define configurations for different upload types
const UPLOAD_CONFIGS = {
    logo: {
        mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
        maxSize: 500 * 1024, // 500KB for logos
        errors: ERROR_MESSAGES.logo
    },
    document: {
        mimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.oasis.opendocument.text',
            'text/plain'
        ],
        maxSize: 10 * 1024 * 1024, // 10MB for documents
        errors: ERROR_MESSAGES.document
    }
};

// Configure AWS SDK
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

// Helper function to create error with type
const createError = (messageKey, type = 'error') => ({
    message: messageKey,
    type: type
});

// Create configurable multer middleware
const createUploadMiddleware = (configType) => {
    const config = UPLOAD_CONFIGS[configType];
    
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: config.maxSize
        },
        fileFilter: (req, file, cb) => {
            if (config.mimeTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(createError(config.errors.FILE_TYPE), false);
            }
        }
    });

    return upload.single('file');
};

const uploadFileToS3 = async (file) => {
    const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    return {
        url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`,
        key: params.Key,
        size: file.size,
        type: file.mimetype,
        filename: file.originalname
    };
};

const handleFileUpload = async (req, res, next) => {
    try {
        if (req.fileError) {
            return next();
        }

        const file = req.file;
        const data = await uploadFileToS3(file);
        req.uploadResult = data;
        next();
    } catch (err) {
        console.error('File upload error:', err);

        const configType = req.params.type || 'document';
        const config = UPLOAD_CONFIGS[configType];

        if (err instanceof multer.MulterError) {
            switch (err.code) {
                case 'LIMIT_FILE_SIZE':
                    req.fileError = createError(config.errors.FILE_SIZE);
                    break;
                default:
                    req.fileError = createError(config.errors.UNKNOWN);
            }
        } else {
            req.fileError = createError(config.errors.UPLOAD_FAILED);
        }
        next();
    }
};

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Update the wrapper function to handle both file type errors and no file errors
const wrapUploadMiddleware = (type) => {
    return (req, res, next) => {
        const config = UPLOAD_CONFIGS[type];
        
        createUploadMiddleware(type)(req, res, (err) => {
            if (err) {
                req.fileError = err;
                return next();
            }
            
            if (!req.file) {
                req.fileError = createError(config.errors.NO_FILE);
                return next();
            }
            next();
        });
    };
};

module.exports = { 
    createUploadMiddleware, 
    handleFileUpload,
    UPLOAD_CONFIGS,
    wrapUploadMiddleware  // Add this export
};