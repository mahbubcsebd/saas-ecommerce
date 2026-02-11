const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const discountController = require('../controllers/discount.controller');
const inventoryController = require('../controllers/inventory.controller');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');

// ============================================
// PUBLIC PRODUCT ROUTES
// ============================================
router.get('/', productController.getProducts);
router.get('/related/:id', productController.getRelatedProducts);
router.get('/:id', productController.getProduct);

// ============================================
// ADMIN PRODUCT ROUTES
// ============================================
router.post('/', authMiddleware, isAdmin, productController.createProduct);
router.put('/:id', authMiddleware, isAdmin, productController.updateProduct);
router.delete('/:id', authMiddleware, isAdmin, productController.deleteProduct);
router.get('/admin/low-stock', authMiddleware, isAdmin, productController.getLowStockProducts);

// ============================================
// PUBLIC DISCOUNT ROUTES
// ============================================
router.get('/discounts/active', discountController.getActiveDiscounts);
router.post('/discounts/validate', discountController.validateCouponCode);

// ============================================
// ADMIN DISCOUNT ROUTES
// ============================================
router.get('/admin/discounts', authMiddleware, isAdmin, discountController.getDiscounts);
router.post('/admin/discounts', authMiddleware, isAdmin, discountController.createDiscount);
router.get('/admin/discounts/:id', authMiddleware, isAdmin, discountController.getDiscount);
router.put('/admin/discounts/:id', authMiddleware, isAdmin, discountController.updateDiscount);
router.delete('/admin/discounts/:id', authMiddleware, isAdmin, discountController.deleteDiscount);

// ============================================
// ADMIN INVENTORY ROUTES
// ============================================
router.get('/admin/inventory/movements', authMiddleware, isAdmin, inventoryController.getStockMovements);
router.post('/admin/inventory/adjust', authMiddleware, isAdmin, inventoryController.adjustStock);
router.post('/admin/inventory/bulk-update', authMiddleware, isAdmin, inventoryController.bulkStockUpdate);
router.get('/admin/inventory/low-stock', authMiddleware, isAdmin, inventoryController.getLowStockReport);
router.get('/admin/inventory/out-of-stock', authMiddleware, isAdmin, inventoryController.getOutOfStockReport);
router.get('/admin/inventory/value', authMiddleware, isAdmin, inventoryController.getInventoryValue);

module.exports = router;