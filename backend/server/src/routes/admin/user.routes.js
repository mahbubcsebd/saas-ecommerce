const express = require('express');
const router = express.Router();
const userController = require('../../controllers/admin/user.controller');
const { authMiddleware, isAdmin, isStaff } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate');
const { body } = require('express-validator');

// Validation rules
const createUserValidation = [
    body('email').isEmail().withMessage('Invalid email'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('Invalid phone number'),
    body('role').optional().isIn(['CUSTOMER', 'STAFF', 'MANAGER', 'ADMIN', 'SUPER_ADMIN']),
];

// Create User (Admin only)
router.post(
    '/',
    authMiddleware,
    isStaff, // Or create a specific authorize middleware for ADMIN/MANAGER
    createUserValidation,
    validate,
    userController.createUser
);

// Resend Invitation
router.post(
    '/:id/resend-invitation',
    authMiddleware,
    isAdmin,
    userController.resendInvitation
);

module.exports = router;
