const express = require('express');
const {
  getAllCategories,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryStructure
} = require('../controllers/category.controller');
const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public
router.get('/', getAllCategories);
router.get('/:slug', getCategoryBySlug);

// Admin Routes
router.post('/', authMiddleware, isAdmin, createCategory);
router.put('/structure', authMiddleware, isAdmin, updateCategoryStructure); // Bulk update structure
router.put('/:id', authMiddleware, isAdmin, updateCategory);
router.delete('/:id', authMiddleware, isAdmin, deleteCategory);

module.exports = router;
