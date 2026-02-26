const { body, param, query } = require('express-validator');

const createDiscountValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Discount name is required'),

    body('code')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Code cannot be empty if provided')
        .matches(/^[A-Za-z0-9_-]+$/)
        .withMessage('Code can only contain letters, numbers, underscores and dashes'),

    body('type')
        .notEmpty()
        .withMessage('Type is required')
        .isIn(['PERCENTAGE', 'FLAT'])
        .withMessage('Type must be PERCENTAGE or FLAT'),

    body('value')
        .isFloat({ min: 0 })
        .withMessage('Value must be a positive number'),

    body('startDate')
        .notEmpty()
        .withMessage('Start Date is required')
        .isISO8601()
        .withMessage('Invalid Start Date format'),

    body('endDate')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('Invalid End Date format'),

    body('minOrderValue')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Min Order Value must be a positive number'),
];

const updateDiscountValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid Discount ID format'),

    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Discount name cannot be empty'),

    body('type')
        .optional()
        .isIn(['PERCENTAGE', 'FLAT'])
        .withMessage('Type must be PERCENTAGE or FLAT'),
];

const discountIdValidation = [
    param('id')
        .isMongoId()
        .withMessage('Invalid Discount ID format'),
];

const validateCouponValidation = [
    body('code')
        .trim()
        .notEmpty()
        .withMessage('Coupon code is required'),
];

module.exports = {
    createDiscountValidation,
    updateDiscountValidation,
    discountIdValidation,
    validateCouponValidation,
};
