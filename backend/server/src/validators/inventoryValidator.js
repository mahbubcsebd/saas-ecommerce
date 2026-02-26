const { body, query } = require('express-validator');

const adjustStockValidation = [
    body('productId')
        .notEmpty()
        .withMessage('Product ID is required')
        .isMongoId()
        .withMessage('Invalid Product ID'),

    body('variantId')
        .optional({ nullable: true })
        .isMongoId()
        .withMessage('Invalid Variant ID'),

    body('quantity')
        .notEmpty()
        .withMessage('Quantity is required')
        .isInt()
        .withMessage('Quantity must be an integer (positive to add, negative to deduct)')
        .custom((value) => value !== 0)
        .withMessage('Quantity cannot be zero'),

    body('reason')
        .optional()
        .trim(),

    body('type')
        .optional()
        .isIn(['ADJUSTMENT', 'PURCHASE', 'RETURN', 'DAMAGED', 'THEFT', 'LOSS'])
        .withMessage('Invalid adjustment type'),
];

const bulkStockUpdateValidation = [
    body('items')
        .isArray({ min: 1 })
        .withMessage('Items array is required and must not be empty'),

    body('items.*.productId')
        .notEmpty()
        .withMessage('Product ID is required')
        .isMongoId()
        .withMessage('Invalid Product ID'),

    body('items.*.quantity')
        .isInt()
        .withMessage('Quantity must be an integer'),
];

const inventoryQueryValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    query('productId')
        .optional()
        .isMongoId()
        .withMessage('Invalid Product ID filter'),
];

module.exports = {
    adjustStockValidation,
    bulkStockUpdateValidation,
    inventoryQueryValidation,
};
