const { body, param, query } = require('express-validator');

const createOrderValidation = [
    body('source')
        .optional()
        .isIn(['ONLINE', 'POS'])
        .withMessage('Source must be either ONLINE or POS'),

    body('items')
        .optional()
        .isArray()
        .withMessage('Items must be an array'),

    body('items.*.productId')
        .optional()
        .isMongoId()
        .withMessage('Invalid Product ID'),

    body('items.*.quantity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),

    body('shippingAddress')
        .optional()
        .isObject()
        .withMessage('Shipping address must be an object'),

    body('paymentMethod')
        .optional()
        .isIn(['CASH', 'COD', 'CARD', 'MOBILE_BANKING', 'STRIPE', 'SSLCOMMERZ'])
        .withMessage('Invalid payment method'),

    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Invalid phone number'),

    // POS Specific Fields
    body('walkInName')
        .optional()
        .isString()
        .trim(),

    body('walkInPhone')
        .optional()
        .isString()
        .trim(),

    body('discount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Discount must be a positive number'),

    body('discountType')
        .optional()
        .isIn(['PERCENTAGE', 'FLAT'])
        .withMessage('Invalid discount type'),

    body('vatPercent')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('VAT must be a positive number'),

    body('tenderedAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Tendered amount must be a positive number'),

    body('changeAmount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Change amount must be a positive number'),
];

const updateOrderStatusValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid Order ID format'),

    body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'COMPLETED', 'RETURNED'])
        .withMessage('Invalid order status'),
];

const orderIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid Order ID format'),
];

const orderQueryValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    query('status')
        .optional()
        .isIn(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'COMPLETED', 'RETURNED'])
        .withMessage('Invalid status filter'),

    query('search')
        .optional()
        .isString()
        .trim(),

    query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid start date format'),

    query('endDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid end date format'),

    query('paymentMethod')
        .optional()
        .isIn(['CASH', 'COD', 'CARD', 'MOBILE_BANKING', 'STRIPE', 'SSLCOMMERZ', 'ONLINE', 'BKASH', 'NAGAD'])
        .withMessage('Invalid payment method filter'),
];

module.exports = {
    createOrderValidation,
    updateOrderStatusValidation,
    orderIdValidation,
    orderQueryValidation,
};
