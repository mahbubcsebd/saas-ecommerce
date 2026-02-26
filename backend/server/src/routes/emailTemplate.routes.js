const express = require('express');
const router = express.Router();
const controller = require('../controllers/emailTemplate.controller');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');

// All routes are protected and admin only
router.use(authMiddleware);
router.use(isAdmin);

router.get('/', controller.getAllEmailTemplates);
router.get('/:id', controller.getEmailTemplateById);
router.post('/', controller.createEmailTemplate);
router.put('/:id', controller.updateEmailTemplate);
router.delete('/:id', controller.deleteEmailTemplate);
router.post('/:id/duplicate', controller.duplicateEmailTemplate);

module.exports = router;
