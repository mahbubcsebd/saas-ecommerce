const prisma = require('../config/prisma');
const { successResponse, createdResponse } = require('../utils/response');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../middlewares/asyncHandler');
const logger = require('../utils/logger');

// @desc    Add a payment to an order (Due Collection)
// @route   POST /api/payments/order/:orderId
// @access  Private (Manager/Admin/Staff)
exports.addOrderPayment = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { amount, paymentMethod, transactionId, notes } = req.body;

  if (!amount || parseFloat(amount) <= 0) {
    throw ApiError.badRequest('Valid payment amount is required');
  }

  if (!paymentMethod) {
    throw ApiError.badRequest('Payment method is required');
  }

  // 1. Find the order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payments: true }
  });

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  if (order.dueAmount <= 0) {
    throw ApiError.badRequest('This order has no due amount');
  }

  const paymentAmount = parseFloat(amount);
  
  if (paymentAmount > order.dueAmount) {
    throw ApiError.badRequest(`Payment amount (${paymentAmount}) cannot exceed due amount (${order.dueAmount})`);
  }

  // 2. Perform transaction to add payment and update order due
  const result = await prisma.$transaction(async (tx) => {
    // Create the payment record
    const payment = await tx.orderPayment.create({
      data: {
        orderId,
        amount: paymentAmount,
        paymentMethod,
        transactionId,
        notes,
        recordedById: req.user.id
      }
    });

    // Update order amounts
    const newDueAmount = order.dueAmount - paymentAmount;
    const newTenderedAmount = (order.tenderedAmount || 0) + paymentAmount;
    
    // Determine new status
    let newPaymentStatus = order.paymentStatus;
    if (newDueAmount === 0) {
      newPaymentStatus = 'PAID';
    } else if (newDueAmount < order.total) {
      newPaymentStatus = 'PARTIAL';
    }

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        dueAmount: newDueAmount,
        tenderedAmount: newTenderedAmount,
        paymentStatus: newPaymentStatus
      }
    });

    return { payment, order: updatedOrder };
  });

  createdResponse(res, { 
    message: 'Payment recorded successfully', 
    data: result 
  });
});

// @desc    Get all payments for a specific order
// @route   GET /api/payments/order/:orderId
// @access  Private (Manager/Admin/Staff)
exports.getOrderPayments = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const payments = await prisma.orderPayment.findMany({
    where: { orderId },
    include: {
      recordedBy: {
        select: {
          firstName: true,
          lastName: true,
          email: true
        }
      }
    },
    orderBy: { paymentDate: 'desc' }
  });

  successResponse(res, { data: payments });
});
