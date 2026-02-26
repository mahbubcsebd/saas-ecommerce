const { body, param, query } = require('express-validator');

const addToCartValidation = [
    body('productId')
        .notEmpty()
        .withMessage('Product ID is required')
        .isMongoId()
        .withMessage('Invalid Product ID'),

    body('variantId')
        .optional()
        .isMongoId()
        .withMessage('Invalid Variant ID'),

    body('quantity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),

    body('guestId')
        .optional()
        .trim(),
];

const updateCartItemValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid Cart Item ID'),

    body('quantity')
        .notEmpty()
        .withMessage('Quantity is required')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),
];

const cartItemIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid Cart Item ID'),
];

const cartQueryValidation = [
    query('guestId')
        .optional()
        .trim(),
];

module.exports = {
    addToCartValidation,
    updateCartItemValidation,
    cartItemIdValidation,
    cartQueryValidation,
};
