const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const discountController = require('../controllers/discount.controller');
const inventoryController = require('../controllers/inventory.controller');
const { authMiddleware, isAdmin, isManager } = require('../middlewares/auth.middleware');
const { multipleImageUpload, anyImageUpload } = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validate');

const {
  createProductValidation,
  updateProductValidation,
  productIdValidation,
  productQueryValidation,
} = require('../validators/productValidator');

const {
  createDiscountValidation,
  updateDiscountValidation,
  discountIdValidation,
  validateCouponValidation,
} = require('../validators/discountValidator');

const {
  adjustStockValidation,
  bulkStockUpdateValidation,
  inventoryQueryValidation,
} = require('../validators/inventoryValidator');

// ============================================
// PUBLIC PRODUCT ROUTES
// ============================================
router.get('/', productQueryValidation, validate, productController.getProducts);
router.get('/related/:id', productIdValidation, validate, productController.getRelatedProducts);
router.get('/:id', productIdValidation, validate, productController.getProduct);

// ============================================
// ADMIN PRODUCT ROUTES
// ============================================
// ============================================
// ADMIN PRODUCT ROUTES
// ============================================
router.post(
  '/',
  authMiddleware,
  isManager,
  anyImageUpload('products'),
  createProductValidation,
  validate,
  productController.createProduct
);
router.put(
  '/:id',
  authMiddleware,
  isManager,
  anyImageUpload('products'),
  updateProductValidation,
  validate,
  productController.updateProduct
);
router.delete(
  '/:id',
  authMiddleware,
  isManager,
  productIdValidation,
  validate,
  productController.deleteProduct
);
router.get('/admin/low-stock', authMiddleware, isManager, productController.getLowStockProducts);
router.get('/admin/export', authMiddleware, isManager, productController.exportProducts);
router.post(
  '/admin/import',
  authMiddleware,
  isManager,
  anyImageUpload('products'),
  productController.importProducts
);

// ============================================
// PUBLIC DISCOUNT ROUTES
// ============================================
router.get('/discounts/active', discountController.getActiveDiscounts);
router.post(
  '/discounts/validate',
  validateCouponValidation,
  validate,
  discountController.validateCouponCode
);

// ============================================
// ADMIN DISCOUNT ROUTES
// ============================================
// Query validation for discounts? optional
router.get('/admin/discounts', authMiddleware, isAdmin, discountController.getDiscounts);
router.post(
  '/admin/discounts',
  authMiddleware,
  isAdmin,
  createDiscountValidation,
  validate,
  discountController.createDiscount
);
router.get(
  '/admin/discounts/:id',
  authMiddleware,
  isAdmin,
  discountIdValidation,
  validate,
  discountController.getDiscount
);
router.put(
  '/admin/discounts/:id',
  authMiddleware,
  isAdmin,
  updateDiscountValidation,
  validate,
  discountController.updateDiscount
);
router.delete(
  '/admin/discounts/:id',
  authMiddleware,
  isAdmin,
  discountIdValidation,
  validate,
  discountController.deleteDiscount
);

// ============================================
// ADMIN INVENTORY ROUTES
// ============================================
router.get(
  '/admin/inventory/movements',
  authMiddleware,
  isAdmin,
  inventoryQueryValidation,
  validate,
  inventoryController.getStockMovements
);
router.post(
  '/admin/inventory/adjust',
  authMiddleware,
  isAdmin,
  adjustStockValidation,
  validate,
  inventoryController.adjustStock
);
router.post(
  '/admin/inventory/bulk-update',
  authMiddleware,
  isAdmin,
  bulkStockUpdateValidation,
  validate,
  inventoryController.bulkStockUpdate
);
router.get(
  '/admin/inventory/low-stock',
  authMiddleware,
  isAdmin,
  inventoryController.getLowStockReport
);
router.get(
  '/admin/inventory/out-of-stock',
  authMiddleware,
  isAdmin,
  inventoryController.getOutOfStockReport
);
router.get(
  '/admin/inventory/value',
  authMiddleware,
  isAdmin,
  inventoryController.getInventoryValue
);

module.exports = router;
