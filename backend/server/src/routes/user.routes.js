const express = require('express');
const {
  getAllUsers,
  getUserById,
  deleteUser,
  updateUser,
  toggleUserStatus,
  roleUpdate,
  sendEmailToUser,
  exportCustomers,
} = require('../controllers/user.controller');
const {
  authMiddleware,
  isAdmin,
  canManageUser,
  isStaff,
} = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate');
const { singleImageUpload } = require('../middlewares/upload.middleware');
const {
  updateUserValidation,
  roleUpdateValidation,
  userIdValidation,
} = require('../validators/userValidator');

const userRouter = express.Router();

userRouter.patch(
  '/:id/toggle-status',
  authMiddleware,
  isAdmin,
  canManageUser,
  // Using userIdValidation but param is :id, need to be careful or update param name in route or validator
  // Validator uses 'userId'. Let's rename route param to :userId or use a check.
  // Actually userValidator has `param('userId')`.
  // Let's standardise route params to :userId where possible or update validator.
  // userValidator.js checks `param('userId')`.
  // So I should change `:id` to `:userId` in route or create a generic id validator.
  // For now, I will use generic check or just skip id validation if strictly named,
  // BUT best is to match.
  // Let's update route param to :userId for consistency with other routes in this file.
  toggleUserStatus
);

// Get All Users
userRouter.get('/', authMiddleware, isStaff, getAllUsers);

// Profile (Current User)
userRouter.get('/profile', authMiddleware, getUserById);
userRouter.put(
  '/profile',
  authMiddleware,
  singleImageUpload('ecommerce/users', 'avatar'),
  updateUserValidation,
  validate,
  updateUser
);

// Export Customers
userRouter.get('/export', authMiddleware, isStaff, exportCustomers);

// Specific User Operations (Admin/Manager)
userRouter.get('/:userId', authMiddleware, userIdValidation, validate, getUserById);
userRouter.post('/:userId/send-email', authMiddleware, isStaff, sendEmailToUser);
userRouter.patch(
  '/:userId',
  authMiddleware,
  userIdValidation,
  singleImageUpload('ecommerce/users', 'avatar'),
  updateUserValidation,
  validate,
  canManageUser,
  updateUser
);
userRouter.delete(
  '/:userId',
  authMiddleware,
  userIdValidation,
  validate,
  canManageUser,
  deleteUser
);
userRouter.patch(
  '/:userId/role',
  authMiddleware,
  isAdmin,
  roleUpdateValidation,
  validate,
  canManageUser,
  roleUpdate
);

// Special route fix for toggle status which used :id
// Let's change it to :userId to match validator if we want to validate ID.
// Or just leave it if validator is strict.
// userValidator: param('userId').isMongoId()
// So route MUST use :userId.
userRouter.patch(
  '/:userId/toggle-status',
  authMiddleware,
  isAdmin,
  canManageUser,
  userIdValidation,
  validate,
  toggleUserStatus
);

module.exports = userRouter;
