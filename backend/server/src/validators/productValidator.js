const { body, param, query } = require('express-validator');

const createProductValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Product name must be between 3 and 200 characters'),

  body('description').optional().trim(),

  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number'),

  body('sellingPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a positive number'),

  body('costPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number'),

  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),

  body('categoryId')
    .notEmpty()
    .withMessage('Category ID is required')
    .isMongoId()
    .withMessage('Invalid Category ID format'),

  body('sku').optional().trim(),

  body('barcode').optional().trim(),

  body('slug').optional().trim(),

  body('brand').optional().trim(),

  body('tags').optional(),

  body('weight').optional().isFloat({ min: 0 }).withMessage('Weight must be a positive number'),

  body('length').optional().isFloat({ min: 0 }).withMessage('Length must be a positive number'),

  body('width').optional().isFloat({ min: 0 }).withMessage('Width must be a positive number'),

  body('height').optional().isFloat({ min: 0 }).withMessage('Height must be a positive number'),

  body('lowStockAlert')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Low stock alert must be a non-negative integer'),

  body('trackInventory').optional().isBoolean().withMessage('Track inventory must be a boolean'),

  body('status').optional().isIn(['DRAFT', 'PUBLISHED', 'ARCHIVED']).withMessage('Invalid status'),

  body('isNewArrival').optional().isBoolean().withMessage('isNewArrival must be a boolean'),

  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean'),

  body('isFreeShipping').optional().isBoolean().withMessage('isFreeShipping must be a boolean'),

  body('metaTitle').optional().trim(),

  body('metaDescription').optional().trim(),

  body('metaKeywords').optional().trim(),

  body('ogImage').optional().trim(),

  body('variants').optional(),

  body('images').optional(),

  body('primaryImageIndex').optional(),

  body('keepExistingImages').optional(),
];

const updateProductValidation = [
  param('id').isMongoId().withMessage('Invalid Product ID format'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Product name must be between 3 and 200 characters'),

  body('basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),

  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),

  body('categoryId').optional().isMongoId().withMessage('Invalid Category ID format'),
];

const productIdValidation = [
  param('id')
    .trim()
    .custom((value) => {
      // Allow either MongoDB ID or valid slug (approximate check)
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(value);
      const isSlug = /^[a-z0-9-]+$/.test(value);
      if (!isMongoId && !isSlug) {
        throw new Error('Invalid Product ID or Slug format');
      }
      return true;
    }),
];

const productQueryValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min price must be a positive number'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be a positive number'),
];

module.exports = {
  createProductValidation,
  updateProductValidation,
  productIdValidation,
  productQueryValidation,
};
