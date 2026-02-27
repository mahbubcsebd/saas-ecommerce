const express = require('express');
const router = express.Router();
const flashSaleController = require('../controllers/flash-sale.controller');
const { authMiddleware, isManager } = require('../middlewares/auth.middleware');

// Public routes
router.get('/public/active', flashSaleController.getActiveFlashSale);

// All other routes are protected by manager/admin rights
router.use(authMiddleware, isManager);

router.post('/', flashSaleController.createFlashSale);
router.get('/', flashSaleController.getAllFlashSales);
router.get('/:id', flashSaleController.getFlashSale);
router.put('/:id', flashSaleController.updateFlashSale);
router.delete('/:id', flashSaleController.deleteFlashSale);
router.patch('/:id/toggle', flashSaleController.toggleFlashSale);

module.exports = router;
