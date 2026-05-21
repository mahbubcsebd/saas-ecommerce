const express = require('express');
const router = express.Router();
const brandController = require('../controllers/brand.controller');
const { authMiddleware, isManager } = require('../middlewares/auth.middleware');
const { singleImageUpload } = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validate');

const {
  createBrandValidation,
  updateBrandValidation,
  brandIdValidation,
  brandOrderValidation,
} = require('../validators/brandValidator');

// ============================================
// PUBLIC BRAND ROUTES
// ============================================
router.get('/', brandController.getAllBrands);
router.get('/:slug', brandController.getBrandBySlug);

// ============================================
// ADMIN BRAND ROUTES
// ============================================
router.put(
  '/order',
  authMiddleware,
  isManager,
  brandOrderValidation,
  validate,
  brandController.updateBrandsOrder
);

router.post(
  '/',
  authMiddleware,
  isManager,
  singleImageUpload('ecommerce/brands', 'image'),
  createBrandValidation,
  validate,
  brandController.createBrand
);

router.put(
  '/:id',
  authMiddleware,
  isManager,
  singleImageUpload('ecommerce/brands', 'image'),
  updateBrandValidation,
  validate,
  brandController.updateBrand
);

router.delete(
  '/:id',
  authMiddleware,
  isManager,
  brandIdValidation,
  validate,
  brandController.deleteBrand
);

module.exports = router;
