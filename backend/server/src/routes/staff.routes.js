const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staff.controller');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');

// All staff routes are protected and require admin access
router.use(authMiddleware, isAdmin);

router.get('/', staffController.getAllStaff);
router.patch('/:userId/permissions', staffController.updatePermissions);
router.get('/activity', staffController.getActivityLogs);
router.get('/activity/export', staffController.exportActivityLogs);
router.post('/activity', staffController.logActivity); // Allow logging from other sources if needed

module.exports = router;
