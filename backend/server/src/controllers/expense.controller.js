const prisma = require('../config/prisma');
const { successResponse, createdResponse } = require('../utils/response');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middlewares/asyncHandler');
const logger = require('../utils/logger');

// ==========================================
// Expense Category Management
// ==========================================

// @desc    Create Expense Category
// @route   POST /api/expenses/categories
exports.createExpenseCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) throw ApiError.badRequest('Category name is required');

  const existingCategory = await prisma.expenseCategory.findUnique({ where: { name } });
  if (existingCategory) throw ApiError.conflict('Expense category already exists');

  const category = await prisma.expenseCategory.create({
    data: { name, description },
  });

  createdResponse(res, { message: 'Expense category created', data: category });
});

// @desc    Get all Expense Categories
// @route   GET /api/expenses/categories
exports.getExpenseCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.expenseCategory.findMany({
    orderBy: { name: 'asc' },
  });
  successResponse(res, { data: categories });
});

// @desc    Update Expense Category
// @route   PUT /api/expenses/categories/:id
exports.updateExpenseCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, isActive } = req.body;

  const category = await prisma.expenseCategory.update({
    where: { id },
    data: { name, description, isActive },
  });

  successResponse(res, { message: 'Category updated', data: category });
});

// @desc    Delete Expense Category
// @route   DELETE /api/expenses/categories/:id
exports.deleteExpenseCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if category has expenses
  const expenses = await prisma.expense.count({ where: { categoryId: id } });
  if (expenses > 0) {
    throw ApiError.badRequest('Cannot delete category with existing expenses');
  }

  await prisma.expenseCategory.delete({ where: { id } });
  successResponse(res, { message: 'Category deleted' });
});

// ==========================================
// Expense Management
// ==========================================

// @desc    Record a new Expense
// @route   POST /api/expenses
exports.createExpense = asyncHandler(async (req, res) => {
  const { title, amount, categoryId, date, reference, notes } = req.body;

  if (!title || !amount || !categoryId) {
    throw ApiError.badRequest('Title, amount, and categoryId are required');
  }

  const category = await prisma.expenseCategory.findUnique({ where: { id: categoryId } });
  if (!category) throw ApiError.notFound('Expense category not found');

  const expense = await prisma.expense.create({
    data: {
      title,
      amount: parseFloat(amount),
      categoryId,
      date: date ? new Date(date) : new Date(),
      reference,
      notes,
      recordedById: req.user.id,
    },
    include: {
      category: { select: { name: true } },
      recordedBy: { select: { firstName: true, lastName: true } },
    },
  });

  createdResponse(res, { message: 'Expense recorded successfully', data: expense });
});

// @desc    Get Expenses with filters and pagination
// @route   GET /api/expenses
exports.getExpenses = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, categoryId, startDate, endDate, search } = req.query;
  const skip = (page - 1) * limit;

  const where = {};
  if (categoryId) where.categoryId = categoryId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { reference: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        category: { select: { name: true } },
        recordedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { date: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit),
    }),
    prisma.expense.count({ where }),
  ]);

  // Calculate total expense amount for these filters
  const sumResult = await prisma.expense.aggregate({
    where,
    _sum: { amount: true },
  });

  successResponse(res, {
    data: expenses,
    meta: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      totalAmount: sumResult._sum.amount || 0,
    },
  });
});

// @desc    Delete an Expense
// @route   DELETE /api/expenses/:id
exports.deleteExpense = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.expense.delete({ where: { id } });
  successResponse(res, { message: 'Expense deleted successfully' });
});
