const { successResponse } = require('../utils/response');

/**
 * Upload single or multiple files
 * Expects 'files' in req from multer middleware
 */
exports.uploadFile = async (req, res, next) => {
    try {
        const files = req.files || [];

        // If single file uploaded via .single(), it might be in req.file
        if (req.file) {
            files.push(req.file);
        }

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files uploaded'
            });
        }

        const uploadedUrls = files.map(file => ({
            url: file.path,
            filename: file.filename,
            originalName: file.originalname
        }));

        return successResponse(res, {
            message: 'Files uploaded successfully',
            data: uploadedUrls
        });
    } catch (error) {
        next(error);
    }
};
