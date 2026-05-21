const express = require('express');
const router = express.Router();
const attributeController = require('../controllers/attribute.controller');
const { authMiddleware, isManager } = require('../middlewares/auth.middleware');

// Public/Common endpoints (retrieving attributes)
router.get('/', attributeController.getAttributes);

// Admin setup/migration endpoint (temporary, triggered manually during deployment)
router.get('/run-setup', attributeController.runSetup);

// Protected administrative endpoints
router.post('/', authMiddleware, isManager, attributeController.upsertAttribute);
router.delete('/:id', authMiddleware, isManager, attributeController.deleteAttribute);

module.exports = router;
