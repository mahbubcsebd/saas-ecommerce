const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { authMiddleware, isAdmin, isManager } = require('../middlewares/auth.middleware');
const { singleImageUpload } = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validate');

const {
  createCategoryValidation,
  updateCategoryValidation,
  categoryIdValidation,
  categoryStructureValidation,
} = require('../validators/categoryValidator');

// ============================================
// PUBLIC CATEGORY ROUTES
// ============================================
router.get('/', categoryController.getAllCategories);
router.get('/:slug', categoryController.getCategoryBySlug);

// ============================================
// ADMIN CATEGORY ROUTES
// ============================================
router.post(
  '/',
  authMiddleware,
  isManager,
  singleImageUpload('ecommerce/categories', 'image'),
  createCategoryValidation,
  validate,
  categoryController.createCategory
);
router.put(
  '/structure',
  authMiddleware,
  isManager,
  categoryStructureValidation,
  validate,
  categoryController.updateCategoryStructure
); // Specific route first
router.put(
  '/:id',
  authMiddleware,
  isManager,
  singleImageUpload('ecommerce/categories', 'image'),
  updateCategoryValidation,
  validate,
  categoryController.updateCategory
);
router.delete(
  '/:id',
  authMiddleware,
  isManager,
  categoryIdValidation,
  validate,
  categoryController.deleteCategory
);

module.exports = router;
