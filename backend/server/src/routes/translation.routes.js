const express = require('express');
const router = express.Router();
const translationController = require('../controllers/translation.controller');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');

// Public
router.get('/languages', translationController.getLanguages);
router.get('/versions', translationController.getVersions);
router.get('/languages', translationController.getLanguages);
router.post('/languages', translationController.addLanguage);
router.post('/update', translationController.updateTranslation);
router.post('/key', translationController.addKey);
router.post('/bulk-translate', translationController.bulkAutoTranslate);
router.post('/rename-key', translationController.renameKey);
router.post('/translate-key', translationController.translateSingleKey);
router.post('/reset-all', translationController.resetNamespace);
router.delete('/key', translationController.deleteKey);
router.get('/namespaces', translationController.getNamespaces);
router.post('/namespaces', translationController.addNamespace);
router.put('/namespaces/:id', translationController.updateNamespace);
router.delete('/namespaces/:id', translationController.deleteNamespace);

router.get('/:langCode', translationController.getTranslations);

module.exports = router;
