const { body, param } = require('express-validator');

const createCategoryValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Category name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Category name must be between 2 and 100 characters'),

    body('image')
        .optional()
        .trim(),

    body('description')
        .optional()
        .trim(),

    body('icon')
        .optional()
        .trim(),

    body('isHomeShown')
        .optional()
        .isBoolean()
        .withMessage('isHomeShown must be a boolean'),

    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),

    body('order')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Order must be a non-negative integer'),

    body('parentId')
        .optional({ nullable: true })
        .isMongoId()
        .withMessage('Invalid Parent Category ID'),

    body('metaTitle')
        .optional()
        .trim(),

    body('metaDescription')
        .optional()
        .trim(),

    body('metaKeywords')
        .optional()
        .trim(),
];

const updateCategoryValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid Category ID format'),

    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category name must be between 2 and 100 characters'),

    body('image')
        .optional()
        .trim(),

    body('description')
        .optional()
        .trim(),

    body('icon')
        .optional()
        .trim(),

    body('isHomeShown')
        .optional()
        .isBoolean()
        .withMessage('isHomeShown must be a boolean'),

    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),

    body('order')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Order must be a non-negative integer'),

    body('parentId')
        .optional({ nullable: true })
        .isMongoId()
        .withMessage('Invalid Parent Category ID'),

    body('metaTitle')
        .optional()
        .trim(),

    body('metaDescription')
        .optional()
        .trim(),

    body('metaKeywords')
        .optional()
        .trim(),
];

const categoryIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid Category ID format'),
];

const categoryStructureValidation = [
    body('categories')
        .isArray()
        .withMessage('Categories must be an array'),

    body('categories.*.id')
        .notEmpty()
        .isMongoId()
        .withMessage('Invalid Category ID in structure'),

    body('categories.*.order')
        .isInt({ min: 0 })
        .withMessage('Order must be a non-negative integer'),

    body('categories.*.parentId')
        .optional({ nullable: true })
        .isMongoId()
        .withMessage('Invalid Parent ID in structure'),
];

module.exports = {
    createCategoryValidation,
    updateCategoryValidation,
    categoryIdValidation,
    categoryStructureValidation,
};
