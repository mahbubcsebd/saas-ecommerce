const express = require('express');
const router = express.Router();
const { authMiddleware: protect, isAdmin: admin } = require('../middlewares/auth.middleware');
const {
  createDatabaseBackup,
  exportData,
  getBackupHistory,
  downloadBackup,
  deleteBackup,
  restoreFromBackup,
  scheduleBackup,
  getBackupSettings,
} = require('../controllers/backup.controller');

// All backup routes require admin access
router.use(protect);
router.use(admin);

// Database backup
router.post('/database', createDatabaseBackup);

// Export specific data types
router.get('/export/:type', exportData);

// Get backup history
router.get('/history', getBackupHistory);

// Get backup settings
router.get('/settings', getBackupSettings);

// Schedule automatic backup
router.post('/schedule', scheduleBackup);

// Download backup file
router.get('/download/:id', downloadBackup);

// Restore from backup
router.post('/restore/:id', restoreFromBackup);

// Delete backup
router.delete('/:id', deleteBackup);

module.exports = router;
