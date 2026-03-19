const { body, param, query } = require('express-validator');

const registerValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password').trim().notEmpty().withMessage('Password is required'),
];

const updateUserValidation = [
  body('firstName')
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage('First name cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),

  body('lastName')
    .optional({ checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage('Last name cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[0-9+\-\s()]*$/)
    .withMessage('Invalid phone number format'),

  body('address')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address is too long (max 200 characters)'),

  body('website').optional({ checkFalsy: true }).trim().isURL().withMessage('Invalid website URL'),

  body('bio')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),

  body('dob')
    .optional({ checkFalsy: true })
    .trim()
    .isISO8601()
    .withMessage('Invalid date of birth format (ISO8601 expected)'),
];

const roleUpdateValidation = [
  param('userId').isMongoId().withMessage('Invalid User ID format'),

  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['CUSTOMER', 'STAFFER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'])
    .withMessage('Invalid role provided'),
];

const userIdValidation = [
  param('userId').optional().isMongoId().withMessage('Invalid User ID format'),
  param('id').optional().isMongoId().withMessage('Invalid User ID format'),
];

module.exports = {
  registerValidation,
  loginValidation,
  updateUserValidation,
  roleUpdateValidation,
  userIdValidation,
};
