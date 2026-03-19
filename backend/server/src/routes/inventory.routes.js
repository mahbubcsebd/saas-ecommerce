const express = require('express');
const router = express.Router();
const {
  getAllInventory,
  getStockHistory,
  adjustStock,
  getStockMovements,
  getLowStockReport,
} = require('../controllers/inventory.controller');
const { authMiddleware, isManager } = require('../middlewares/auth.middleware');

// All inventory routes require Manager or Admin access
router.use(authMiddleware);
router.use(isManager);

router.get('/', getAllInventory);
router.get('/movements', getStockMovements);
router.get('/low-stock', getLowStockReport);
router.get('/:productId/history', getStockHistory);
router.post('/adjust', adjustStock);

module.exports = router;
