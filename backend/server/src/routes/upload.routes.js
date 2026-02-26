const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const { authMiddleware: protect } = require('../middlewares/auth.middleware');
const { anyImageUpload } = require('../middlewares/upload.middleware');

// POST /api/upload
// Uses 'anyImageUpload' which accepts any field name and uploads to 'uploads' folder (or dynamic if configured)
// We designate a default folder 'general' for generic uploads
router.post('/',
    protect,
    anyImageUpload('general'),
    uploadController.uploadFile
);

module.exports = router;
