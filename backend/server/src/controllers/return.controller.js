const prisma = require("../config/prisma");
const { successResponse, errorResponse } = require("../helpers/responseHandler");

// Create a new Return Request (RMA)
exports.createReturn = async (req, res) => {
  try {
    const { orderId, productId, quantity, refundAmount, reason } = req.body;
    const userId = req.user.id;

    // Validate if the order belongs to the user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      return errorResponse(res, "Order not found", 404);
    }

    // Return Policy Enforcement
    const orderSettings = await prisma.orderSetting.findFirst();
    const policyDays = orderSettings?.returnPolicyDays || 7;
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - orderDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > policyDays) {
      return errorResponse(res, `Return period has expired. Policy allows returns within ${policyDays} days.`, 400);
    }

    if (order.userId && order.userId !== userId && req.user.role === 'CUSTOMER') {
      return errorResponse(res, "You are not authorized to return items from this order", 403);
    }

    // Validate the product exists in the order
    const orderItem = order.items.find(item => item.productId === productId || item.variantId === productId);

    if (!orderItem) {
      return errorResponse(res, "The specified product is not part of this order", 400);
    }

    if (quantity > (orderItem.quantity - orderItem.returnedQuantity)) {
      return errorResponse(res, "Return quantity exceeds available purchased quantity", 400);
    }

    // Handle image attachments if any (placeholder via URLs or Multer integration)
    const attachments = req.body.images || [];

    // Generate RMA ID
    const recentReturn = await prisma.returnRequest.findFirst({
      orderBy: { createdAt: "desc" }
    });

    let nextNum = 1;
    if (recentReturn && recentReturn.rmaId && recentReturn.rmaId.startsWith('RET-')) {
       const parts = recentReturn.rmaId.split('-');
       if(parts.length > 1) {
          nextNum = parseInt(parts[1]) + 1;
       }
    }
    const rmaId = `RET-${String(nextNum).padStart(4, '0')}`;

    // Create the Request
    const newReturn = await prisma.returnRequest.create({
      data: {
        rmaId,
        orderId,
        userId: order.userId || userId,
        productId: orderItem.productId,
        productName: orderItem.productName,
        quantity: parseInt(quantity),
        refundAmount: parseFloat(refundAmount),
        reason,
        images: attachments,
        status: "PENDING"
      }
    });

    return successResponse(res, {
      message: "Return request submitted successfully",
      data: newReturn
    }, 201);

  } catch (error) {
    console.error("[createReturn]", error);
    return errorResponse(res, "Failed to submit return request", 500);
  }
};

// Get All Returns (Admin)
exports.getAllReturns = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build the query
    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Role-based retrieval: if customer, only get their returns
    if (req.user.role === 'CUSTOMER') {
       where.userId = req.user.id;
    }

    if (search) {
      where.OR = [
        { rmaId: { contains: search, mode: "insensitive" } },
        { productName: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { username: { contains: search, mode: "insensitive" } } }
      ];
    }

    const [returns, total] = await Promise.all([
      prisma.returnRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { orderNumber: true } },
          user: { select: { username: true, email: true } },
        }
      }),
      prisma.returnRequest.count({ where })
    ]);

    // Format for frontend
    const formattedReturns = returns.map(r => ({
      id: r.id,
      rmaId: r.rmaId,
      orderId: r.orderId,
      orderNumber: r.order?.orderNumber,
      customerName: r.user?.username || "Guest",
      customerEmail: r.user?.email || "N/A",
      productName: r.productName,
      reason: r.reason,
      status: r.status,
      amount: r.refundAmount,
      quantity: r.quantity,
      images: r.images,
      createdAt: r.createdAt
    }));

    return successResponse(res, {
      data: formattedReturns,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / take)
      }
    });

  } catch (error) {
    console.error("[getAllReturns]", error);
    return errorResponse(res, "Failed to fetch returns", 500);
  }
};

// Get Return by ID
exports.getReturnById = async (req, res) => {
  try {
    const { id } = req.params;

    const returnReq = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: true,
        user: { select: { username: true, email: true, phone: true } },
      }
    });

    if (!returnReq) {
      return errorResponse(res, "Return request not found", 404);
    }

    // Protect customer access
    if (req.user.role === 'CUSTOMER' && returnReq.userId !== req.user.id) {
       return errorResponse(res, "Access denied", 403);
    }

    return successResponse(res, { data: returnReq });

  } catch (error) {
    console.error("[getReturnById]", error);
    return errorResponse(res, "Failed to retrieve return request", 500);
  }
};

// Update Return Status (Admin)
exports.updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const returnReq = await prisma.returnRequest.findUnique({
      where: { id },
      include: { order: { include: { items: true } } }
    });

    if (!returnReq) {
       return errorResponse(res, "Return request not found", 404);
    }

    const updatedReturn = await prisma.returnRequest.update({
      where: { id },
      data: {
        status,
        ...(adminNotes && { adminNotes })
      }
    });

    // If approved/refunded, update the order item's return quantity to prevent double returning
    if (status === 'REFUNDED' && returnReq.status !== 'REFUNDED') {
       // Find correct order item
       const orderItem = returnReq.order.items.find(i => i.productId === returnReq.productId || i.variantId === returnReq.productId);
       if (orderItem) {
          await prisma.orderItem.update({
             where: { id: orderItem.id },
             data: {
                 returnedQuantity: { increment: returnReq.quantity },
                 isRefunded: true
             }
          });

          // Check if all items in order are now refunded
          const updatedOrder = await prisma.order.findUnique({
            where: { id: returnReq.orderId },
            include: { items: true }
          });

          const allRefunded = updatedOrder.items.every(item => item.isRefunded || item.returnedQuantity >= item.quantity);
          const anyRefunded = updatedOrder.items.some(item => item.isRefunded || item.returnedQuantity > 0);

          await prisma.order.update({
             where: { id: returnReq.orderId },
             data: {
                 status: allRefunded ? "REFUNDED" : updatedOrder.status,
                 paymentStatus: allRefunded ? "REFUNDED" : "PAID" // Or handle partial if needed
             }
          });

           // Add back to inventory (if applicable)
          const product = await prisma.product.findUnique({
             where: { id: returnReq.productId },
             select: { stock: true }
          });

          if (product) {
            const previousQty = product.stock;
            const newQty = previousQty + returnReq.quantity;

            // Update product stock
            await prisma.product.update({
              where: { id: returnReq.productId },
              data: { stock: newQty }
            });

            await prisma.stockMovement.create({
              data: {
                  productId: returnReq.productId,
                  type: "RETURN",
                  quantity: returnReq.quantity,
                  previousQty,
                  newQty,
                  reason: `RMA Returned: ${returnReq.rmaId}`,
                  performedBy: req.user.id
              }
            });
          }
       }
    }

    return successResponse(res, {
       message: `Return request marked as ${status}`,
       data: updatedReturn
    });

  } catch (error) {
    console.error("[updateReturnStatus]", error);
    return errorResponse(res, "Failed to update return status", 500);
  }
};
