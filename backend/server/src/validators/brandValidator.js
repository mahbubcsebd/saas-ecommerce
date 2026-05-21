const { body, param } = require('express-validator');

const createBrandValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Brand name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Brand name must be between 2 and 100 characters'),

  body('image').optional().trim(),

  body('description').optional().trim(),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),

  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean'),

  body('metaTitle').optional().trim(),

  body('metaDescription').optional().trim(),

  body('metaKeywords').optional().trim(),
];

const updateBrandValidation = [
  param('id').isMongoId().withMessage('Invalid Brand ID format'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Brand name must be between 2 and 100 characters'),

  body('image').optional().trim(),

  body('description').optional().trim(),

  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),

  body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean'),

  body('metaTitle').optional().trim(),

  body('metaDescription').optional().trim(),

  body('metaKeywords').optional().trim(),
];

const brandIdValidation = [param('id').isMongoId().withMessage('Invalid Brand ID format')];

const brandOrderValidation = [
  body('brands')
    .isArray()
    .withMessage('Brands must be an array')
    .notEmpty()
    .withMessage('Brands array cannot be empty'),
  body('brands.*.id')
    .isMongoId()
    .withMessage('Each brand ID must be a valid Mongo ID'),
  body('brands.*.order')
    .isInt({ min: 0 })
    .withMessage('Each brand order must be an integer >= 0'),
];

module.exports = {
  createBrandValidation,
  updateBrandValidation,
  brandIdValidation,
  brandOrderValidation,
};
