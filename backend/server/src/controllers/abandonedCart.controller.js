const prisma = require('../config/prisma');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const { successResponse } = require('../utils/response');
const { sendAbandonedCartRecoveryEmail } = require('../services/emailService');

/**
 * Get all abandoned carts
 * Carts with items, linked to a user, not updated for 24h, and not yet recovered.
 */
exports.getAllAbandonedCarts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Consider "abandoned" if not updated for at least 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const query = {
    items: { some: {} }, // Has items
    userId: { not: null }, // Linked to a user (so we have an email)
    isRecovered: false,
    updatedAt: { lte: twentyFourHoursAgo },
  };

  const [carts, total] = await Promise.all([
    prisma.cart.findMany({
      where: query,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
                sellingPrice: true,
                slug: true,
              },
            },
            variant: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
    }),
    prisma.cart.count({ where: query }),
  ]);

  return successResponse(res, {
    message: 'Abandoned carts retrieved successfully',
    data: carts,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / take),
    },
  });
});

/**
 * Get abandoned cart by ID
 */
exports.getAbandonedCartById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const cart = await prisma.cart.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
              images: true,
              sellingPrice: true,
              slug: true,
            },
          },
          variant: true,
        },
      },
    },
  });

  if (!cart) {
    throw ApiError.notFound('Abandoned cart not found');
  }

  return successResponse(res, {
    message: 'Abandoned cart details retrieved',
    data: cart,
  });
});

/**
 * Send recovery email to customer
 */
exports.sendRecoveryEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { customMessage } = req.body; // Future enhancement: allow custom message

  const cart = await prisma.cart.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });

  if (!cart || !cart.user || !cart.user.email) {
    throw ApiError.notFound('Cart or user email not found for recovery');
  }

  const recoveryLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cart?recovered=${cart.id}`;
  const fullName = `${cart.user.firstName} ${cart.user.lastName}`.trim() || 'Customer';

  await sendAbandonedCartRecoveryEmail({
    to: cart.user.email,
    name: fullName,
    cart,
    recoveryLink,
  });

  // Update cart recovery status
  const updatedCart = await prisma.cart.update({
    where: { id },
    data: {
      recoveryEmailSentAt: new Date(),
      recoveryEmailCount: { increment: 1 },
    },
  });

  return successResponse(res, {
    message: `Recovery email sent to ${cart.user.email}`,
    data: updatedCart,
  });
});
