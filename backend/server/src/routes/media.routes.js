const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/media.controller');
const { authenticate, isStaff, isAdmin } = require('../middlewares/auth.middleware');

// GET /api/media - Get all media assets from Cloudinary (requires Staff or above)
router.get('/', authenticate, isStaff, mediaController.listMedia);

// POST /api/media/delete - Delete a media asset from Cloudinary (requires Admin or above)
router.post('/delete', authenticate, isAdmin, mediaController.deleteMedia);

module.exports = router;
