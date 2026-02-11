const express = require('express');
const router = express.Router();
const translationController = require('../controllers/translation.controller');
const { authMiddleware, hasRole } = require('../middlewares/auth.middleware');

// Public
router.get('/languages', translationController.getLanguages);
router.get('/:langCode', translationController.getTranslations);

// Admin
router.post('/admin/languages', authMiddleware, hasRole(['ADMIN', 'SUPERADMIN']), translationController.addLanguage);
router.put('/admin/translations', authMiddleware, hasRole(['ADMIN', 'SUPERADMIN']), translationController.updateTranslation);

module.exports = router;
