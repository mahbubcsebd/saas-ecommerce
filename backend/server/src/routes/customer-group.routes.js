const express = require('express');
const router = express.Router();
const {
  createCustomerGroup,
  getAllCustomerGroups,
  getCustomerGroup,
  updateCustomerGroup,
  deleteCustomerGroup,
  assignUsersToGroup,
  removeUserFromGroup,
} = require('../controllers/customer-group.controller');
const { authMiddleware, isManager } = require('../middlewares/auth.middleware');

// All routes require auth and manager/admin role
router.use(authMiddleware);
router.use(isManager);

// Group CRUD
router.post('/', createCustomerGroup);
router.get('/', getAllCustomerGroups);
router.get('/:id', getCustomerGroup);
router.put('/:id', updateCustomerGroup);
router.delete('/:id', deleteCustomerGroup);

// Member management
router.post('/:id/assign', assignUsersToGroup);
router.delete('/:id/members/:userId', removeUserFromGroup);

module.exports = router;
