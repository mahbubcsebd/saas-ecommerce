const express = require('express');
const { body } = require('express-validator');
const authRouter = express.Router();

const {
  register,
  login,
  refreshToken,
  logout,
  getProfile,
  verifyInvitation,
  setupPassword,
  verifyEmail, // Import verifyEmail
  forgotPassword,
  resetPassword,
  changePassword,
} = require('../controllers/auth.controllers');

// ... (existing code)

// Verify email
authRouter.post('/verify-email', verifyEmail);

module.exports = authRouter;

const { registerValidation, loginValidation } = require('../validators/authValidator');

const validate = require('../middlewares/validate');

const { authMiddleware, isAdmin } = require('../middlewares/auth.middleware');

// Public routes (only accessible when logged out)
authRouter.post('/register', registerValidation, validate, register);

authRouter.post('/login', loginValidation, validate, login);

// Refresh token doesn’t care about login/logout state
authRouter.post('/refresh', refreshToken);

// Forgot/Reset password
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password', resetPassword);

// Protected routes (require authentication)
authRouter.post('/change-password', authMiddleware, changePassword);
authRouter.post('/logout', authMiddleware, logout);

authRouter.get('/profile', authMiddleware, getProfile);

// Example admin-only route
authRouter.get('/admin/stats', authMiddleware, isAdmin, (req, res) => {
  res.json({ message: 'Admin stats here' });
});

// Verify invitation
authRouter.get('/verify-invitation/:token', verifyInvitation);

// Setup password
authRouter.post(
  '/setup-password',
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  setupPassword
);

module.exports = authRouter;
