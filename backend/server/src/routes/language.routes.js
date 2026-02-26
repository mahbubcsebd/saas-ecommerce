const express = require('express');
const router = express.Router();
const languageController = require('../controllers/language.controller');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');

// Public routes
router.get('/active', languageController.getActiveLanguages);

// Admin routes
router.get('/', authMiddleware, isAdmin, languageController.getLanguages);
router.post('/', authMiddleware, isAdmin, languageController.createLanguage);
router.patch('/:id', authMiddleware, isAdmin, languageController.updateLanguage);
router.delete('/:id', authMiddleware, isAdmin, languageController.deleteLanguage);

module.exports = router;
