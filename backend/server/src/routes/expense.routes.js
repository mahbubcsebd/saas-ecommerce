const express = require('express');
const { authMiddleware, isManager } = require('../middlewares/auth.middleware');
const {
  createExpenseCategory,
  getExpenseCategories,
  updateExpenseCategory,
  deleteExpenseCategory,
  createExpense,
  getExpenses,
  deleteExpense,
} = require('../controllers/expense.controller');

const router = express.Router();

// All expense routes require at least Manager access
router.use(authMiddleware, isManager);

// Category Routes
router.route('/categories')
  .post(createExpenseCategory)
  .get(getExpenseCategories);

router.route('/categories/:id')
  .put(updateExpenseCategory)
  .delete(deleteExpenseCategory);

// Expense Routes
router.route('/')
  .post(createExpense)
  .get(getExpenses);

router.route('/:id')
  .delete(deleteExpense);

module.exports = router;
