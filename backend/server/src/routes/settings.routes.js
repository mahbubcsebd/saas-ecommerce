const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const {
  updateSettings,
  getPublicSettings,
  getSettingsByType,
} = require('../controllers/settings.controller'); // Using controller functions
const {
  authMiddleware: protect,
  adminMiddleware: admin,
} = require('../middlewares/auth.middleware');

// Get Public Settings
router.get('/public', getPublicSettings);

// Get Company Settings (Public or Protected?) - Let's make it protected or admin for now, or public if needed for footer.
// The controller has getPublicSettings which returns company settings designated for public.
// If we need a specific route for just company:
// router.get('/company', ...);

// Get settings by type (Admin/Protected)
router.get('/:type', protect, getSettingsByType);

// Update settings by type
router.put(
  '/:type',
  protect,
  // admin, // Enable if you have admin middleware working
  [body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email format')],
  validate,
  updateSettings
);

// Test Email Connection
router.post(
  '/email-test',
  protect,
  require('../controllers/settings.controller').testEmailConnection
);

// Test SMS Connection
router.post('/sms-test', protect, require('../controllers/settings.controller').testSmsConnection);

// Webhooks CRUD
const {
  createWebhook,
  updateWebhook,
  deleteWebhook,
} = require('../controllers/settings.controller');
router.post('/webhooks', protect, createWebhook);
router.put('/webhooks/:id', protect, updateWebhook);
router.delete('/webhooks/:id', protect, deleteWebhook);

module.exports = router;
