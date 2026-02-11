const express = require('express');
const { getPublicSettings, updateSettings } = require('../controllers/settings.controller');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/public', getPublicSettings);
router.put('/:type', authMiddleware, isAdmin, updateSettings);

module.exports = router;
