const prisma = require('../config/prisma');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const { successResponse, createdResponse } = require('../utils/response');
const { getIO } = require('../socket');
const { emitOrderUpdate, emitStaffOrderPlaced } = require('../socket/handlers/orderHandler');

// Order Include Helper
const orderInclude = {
  items: {
    include: {
      product: { select: { name: true, slug: true, images: true } },
      variant: { select: { name: true, attributes: true, images: true } },
    },
  },
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
};

/**
 * Create Order
 */
exports.createOrder = asyncHandler(async (req, res) => {
  const DeviceDetector = require('device-detector-js');
  const deviceDetector = new DeviceDetector();

  const ipAddress = req.headers['x-client-ip'] || req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
  const rawUserAgent = req.headers['x-client-device'] || req.headers['user-agent'] || 'Unknown';

  let deviceInfo = rawUserAgent;
  if (rawUserAgent && rawUserAgent !== 'node' && rawUserAgent !== 'Unknown') {
    try {
      const result = deviceDetector.parse(rawUserAgent);
      const os = result.os ? `${result.os.name} ${result.os.version || ''}`.trim() : '';
      const client = result.client ? `${result.client.name} ${result.client.version || ''}`.trim() : '';
      const deviceType = result.device && result.device.type ? result.device.type.toUpperCase() : 'DESKTOP';
      
      let str = '';
      if (client) str += client;
      if (os) str += ` on ${os}`;
      if (deviceType) str += ` (${deviceType})`;
      
      if (str) deviceInfo = str;
    } catch (e) {
      // fallback
    }
  } else if (rawUserAgent === 'node') {
    deviceInfo = 'NextJS Server (Proxy)';
  }

  // Check if IP or Device is blocked (match against either raw user agent or parsed device info)
  const isBlocked = await prisma.blockedClient.findFirst({
    where: {
      OR: [
        { type: 'IP', value: ipAddress },
        { type: 'DEVICE', value: rawUserAgent },
        { type: 'DEVICE', value: deviceInfo },
      ],
    },
  });

  if (isBlocked) {
    throw ApiError.forbidden(`Your device or IP has been blocked due to suspicious activity. Please contact support. (Reason: ${isBlocked.reason || 'None'})`);
  }

  const userId = req.user?.id;
  const {
    sessionId,
    guestInfo,
    shippingAddress,
    paymentMethod,
    source = 'ONLINE', // ONLINE, POS
    items: directItems, // Items passed directly (POS)

    // POS specific
    walkInName,
    walkInPhone,
    discount = 0, // value
    discountType, // PERCENTAGE, FLAT
    vatPercent = 0,
    tenderedAmount,
    changeAmount,
    soldBy,

    // Online Order specific fields
    shippingCost = 0,
    shippingMethod,
    shippingZoneId,
    shippingRateId,
    appliedCoupon,
    discountAmount: discountAmountFromFront, // Actual amount deducted from frontend
    codExtraCharge = 0,
  } = req.body;

  let orderItemsData = [];
  let total = 0;
  let finalTotal = 0;
  let totalDiscountAmount = 0;
  let cart;

  // ---------------------------------------------------------
  // 1. Item Retrieval (Cart vs Direct)
  // ---------------------------------------------------------
  const isBuyNow = req.body.isBuyNow;
  const frontendOrderItems = req.body.orderItems || [];

  if (source === 'POS' || isBuyNow) {
    // POS direct items OR Online "Buy Now"
    // For Buy Now, frontend passes `orderItems` (matching what POS calls directItems theoretically, but frontend keys it as orderItems)
    const itemsToProcess = source === 'POS' ? directItems : frontendOrderItems;

    if (!itemsToProcess || itemsToProcess.length === 0) {
      throw ApiError.badRequest('No items provided for direct purchase.');
    }

    for (const item of itemsToProcess) {
      // Fetch product to get latest price/stock
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: { variants: true },
      });

      if (!product) continue;

      // Validate: if product has active variants, a variantId must be provided
      const activeVariants = product.variants.filter((v) => v.isActive);
      if (activeVariants.length > 0 && !item.variantId) {
        throw ApiError.badRequest(
          `Product "${product.name}" has variants. Please select a variant before ordering.`
        );
      }

      let variant;
      if (item.variantId) {
        variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          throw ApiError.badRequest(
            `Selected variant not found for product "${product.name}".`
          );
        }
      }

      const basePrice = variant ? variant.basePrice || product.basePrice : product.basePrice;
      const salePrice = variant
        ? variant.sellingPrice || product.sellingPrice
        : product.sellingPrice;
      const sku = variant ? variant.sku : product.sku;
      const name = product.name + (variant ? ` - ${variant.name}` : '');

      // Warranty (Variant overrides Product)
      const warranty = variant?.warranty || product.warranty;

      // Stock Check
      const currentStock = variant ? variant.stock : product.stock;
      if (currentStock < item.quantity) {
        throw ApiError.badRequest(
          `Insufficient stock for ${name}. Available: ${currentStock}, Requested: ${item.quantity}`
        );
      }

      const itemTotal = salePrice * item.quantity;
      total += itemTotal;

      orderItemsData.push({
        productId: item.productId,
        variantId: item.variantId || undefined,
        productName: name,
        sku,
        unitPrice: salePrice,
        quantity: item.quantity,
        totalPrice: itemTotal,
        warranty,
      });
    }
  } else {
    // Standard Online Cart Checkout (Selective Items)
    if (userId) {
      cart = await prisma.cart.findFirst({
        where: { userId },
        include: { items: { include: { product: { include: { variants: true } }, variant: true } } },
      });
    }

    // Fallback to anonymous guest cart if the authenticated cart is missing or empty
    if ((!cart || cart.items.length === 0) && sessionId) {
      const guestCart = await prisma.cart.findFirst({
        where: { sessionId },
        include: { items: { include: { product: { include: { variants: true } }, variant: true } } },
      });
      if (guestCart && guestCart.items.length > 0) {
        cart = guestCart;
        // We could optionally link it to the user here, but it's fine since it will be cleared soon anyway
      }
    }

    if (!cart || cart.items.length === 0) {
      throw ApiError.badRequest('Cart is empty');
    }

    // Filter cart items strictly to match the selections transmitted from the frontend
    const selectedItemIds = frontendOrderItems.map((item) => item.id);
    const selectedCartItems = cart.items.filter((item) => selectedItemIds.includes(item.id));

    if (selectedCartItems.length === 0) {
      throw ApiError.badRequest('No valid items selected from the cart.');
    }

    for (const item of selectedCartItems) {
      // Validate: if product has active variants, item must have a variantId
      const activeVariants = (item.product.variants || []).filter((v) => v.isActive);
      if (activeVariants.length > 0 && !item.variantId) {
        throw ApiError.badRequest(
          `Product "${item.product.name}" has variants. Please select a variant before ordering.`
        );
      }

      const itemSellingPrice = item.variant?.sellingPrice || item.product.sellingPrice;
      const availableStock = item.variant?.stock || item.product.stock;
      const isPreOrder = item.variant?.isPreOrder || item.product.isPreOrder;
      const warranty = item.variant?.warranty || item.product.warranty;

      if (availableStock < item.quantity && !isPreOrder) {
        throw ApiError.badRequest(
          `Insufficient stock for ${item.product.name}. Available: ${availableStock}, Requested: ${item.quantity}`
        );
      }

      const itemTotal = itemSellingPrice * item.quantity;
      total += itemTotal;

      orderItemsData.push({
        productId: item.productId,
        variantId: item.variantId || undefined,
        productName: item.product.name + (item.variant ? ` - ${item.variant.name}` : ''),
        sku: item.variant?.sku || item.product.slug,
        unitPrice: itemSellingPrice,
        quantity: item.quantity,
        totalPrice: itemTotal,
        warranty,
      });
    }
  }

  // ---------------------------------------------------------
  // 2. Calculations (Discount, VAT)
  // ---------------------------------------------------------

  // Apply Discount
  if (discount > 0) {
    if (discountType === 'PERCENTAGE') {
      totalDiscountAmount = (total * discount) / 100;
    } else {
      totalDiscountAmount = discount;
    }
  }

  let subtotal = total;
  let afterDiscount = subtotal - totalDiscountAmount;

  // Apply VAT
  let vatAmount = 0;
  if (vatPercent > 0) {
    vatAmount = (afterDiscount * vatPercent) / 100;
  }

  // Shipping Cost
  // We trust the value from the frontend for now, or could re-calculate
  const finalShippingCost = parseFloat(shippingCost) || 0;

  finalTotal = afterDiscount + vatAmount + finalShippingCost + (parseFloat(codExtraCharge) || 0);

  // ---------------------------------------------------------
  // 3. Create Order
  // ---------------------------------------------------------
  const prefix = source === 'POS' ? 'POS' : 'ORD';
  // Generate clearer Unique Order Number: ORD-YYYYMMDD-Random
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  const orderNumber = `${prefix}-${dateStr}-${randomStr}`;

  // Generate Invoice Number: INV-YYYYMMDD-Random
  // This reduces collision chance significantly compared to just random
  const invoiceNumber = `INV-${dateStr}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Validation
  if (source === 'ONLINE' && !shippingAddress) {
    throw ApiError.badRequest('Shipping address is required for Online orders');
  }

  let finalPaymentStatus = source === 'POS' ? 'PAID' : 'PENDING';
  let finalDueAmount = source === 'POS' ? 0 : finalTotal;
  let finalTenderedAmount = source === 'POS' ? parseFloat(tenderedAmount) || 0 : 0;
  
  if (source === 'POS') {
    if (finalTenderedAmount === 0) {
      finalPaymentStatus = 'UNPAID';
      finalDueAmount = finalTotal;
    } else if (finalTenderedAmount < finalTotal) {
      finalPaymentStatus = 'PARTIAL';
      finalDueAmount = finalTotal - finalTenderedAmount;
    }
  }

  const orderData = {
    orderNumber,
    invoiceNumber, // Added invoice number
    source: source,
    userId: userId || undefined,
    ipAddress,
    deviceInfo,

    // Info
    guestInfo: !userId ? guestInfo : undefined,
    walkInName,
    walkInPhone,

    // Financials
    subtotal,
    discountType,
    discountValue: parseFloat(discount) || 0,
    discountAmount:
      discountAmountFromFront !== undefined
        ? parseFloat(discountAmountFromFront) || 0
        : totalDiscountAmount,
    vatPercent: parseFloat(vatPercent) || 0,
    vatAmount,
    shippingCost: finalShippingCost,
    shippingMethod,
    shippingZoneId,
    shippingRateId,
    appliedCoupon,
    couponDiscount:
      discountAmountFromFront !== undefined
        ? parseFloat(discountAmountFromFront) || 0
        : totalDiscountAmount,
    codExtraCharge: parseFloat(codExtraCharge) || 0,
    total: finalTotal,
    dueAmount: finalDueAmount,

    // Payment
    paymentMethod: paymentMethod || 'CASH',
    paymentStatus: finalPaymentStatus,
    tenderedAmount: source === 'POS' ? finalTenderedAmount : undefined,
    changeAmount: source === 'POS' ? parseFloat(changeAmount) : undefined,

    // Status
    status: source === 'POS' ? 'COMPLETED' : 'PENDING',

    // Fulfillment
    shippingAddress: shippingAddress || {},

    // Staff
    soldBy: soldBy || (source === 'POS' ? userId : undefined),

    items: {
      create: orderItemsData,
    },
  };

  if (source === 'POS') {
    orderData.deliveredAt = new Date();
  }

  const order = await prisma.order.create({
    data: orderData,
    include: orderInclude,
  });

  // ---------------------------------------------------------
  // 4. Stock Updates
  // ---------------------------------------------------------
  // Re-iterate items to decrement stock
  // Note: If using Cart, we iterate cart items. If Direct, we iterate directItems.
  // Easier to iterate the `orderItemsData` we prepared.

  for (const item of orderItemsData) {
    let previousQty = 0;
    let newQty = 0;

    if (item.variantId) {
      const v = await prisma.productVariant.findUnique({
        where: { id: item.variantId },
      });
      previousQty = v.stock;
      await prisma.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
      // Sync parent
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          soldCount: { increment: item.quantity },
        },
      });
      newQty = previousQty - item.quantity;
    } else {
      const p = await prisma.product.findUnique({
        where: { id: item.productId },
      });
      previousQty = p.stock;
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          soldCount: { increment: item.quantity },
        },
      });
      newQty = previousQty - item.quantity;
    }

    await prisma.stockMovement.create({
      data: {
        productId: item.productId,
        variantId: item.variantId,
        type: 'SALE',
        quantity: -item.quantity,
        previousQty,
        newQty,
        reason: `Order ${orderNumber}`,
        performedBy: userId,
      },
    });
  }

  // Clear purchased items from the Cart (Skip if it was a Buy Now without an underlying cart tie)
  if (source === 'ONLINE' && cart && !isBuyNow) {
    const selectedItemIds = frontendOrderItems.map((item) => item.id);

    await prisma.cartItem.deleteMany({
      where: { id: { in: selectedItemIds } },
    });

    // We don't necessarily reset the whole cart's coupon/totals because other items might still exist.
    // The next `fetchCart` call from the frontend will naturally recalculate totals via Prisma inclusion.
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        isRecovered: cart.recoveryEmailCount > 0,
        appliedCoupon: null, // Reset coupon since it was used on this order
        discountAmount: 0,
      },
    });
  }

  // Trigger Staff notifications only (no customer notify on order create) - Background / Non-blocking
  try {
    const io = getIO();
    emitStaffOrderPlaced(io, order.id).catch((err) => {
      console.warn('Failed to emit staff notification inside async job:', err?.message || err);
    });
  } catch (ioError) {
    console.warn('Socket.IO not initialized during order creation notify');
  }

  // Send order confirmation email to customer (or guest) in background (no-blocking)
  try {
    const { sendOrderConfirmationEmail } = require('../services/emailService');
    const customerEmail = order.user?.email || order.guestInfo?.email;
    const customerName = order.user
      ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim()
      : order.guestInfo?.name || 'Customer';
    if (customerEmail) {
      sendOrderConfirmationEmail({
        to: customerEmail,
        name: customerName,
        order,
      }).catch((emailErr) => {
        console.warn('Failed to send order confirmation email inside async job:', emailErr?.message || emailErr);
      });
    }
  } catch (emailErr) {
    console.warn('Failed to dispatch order confirmation email:', emailErr?.message || emailErr);
  }

  // ---------------------------------------------------------
  // 5. Analytics (Server-side Purchase)
  // ---------------------------------------------------------
  // 5. Analytics (Internal + Server-side Tracking)
  try {
    const analyticsService = require('../services/analytics.service');
    // Track purchase (Internal DB + GA4 + Meta)
    // Attach sessionId from request if available for proper session attribution
    const analyticsOrder = { ...order, sessionId };
    analyticsService.trackPurchase(analyticsOrder, req);
  } catch (analyticsErr) {
    console.warn('Failed to send server-side analytics:', analyticsErr.message);
  }

  return createdResponse(res, {
    message: 'Order placed successfully',
    data: order,
  });
});

/**
 * Get My Orders
 */
exports.getMyOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const orders = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: orderInclude,
  });

  return successResponse(res, {
    message: 'Orders retrieved successfully',
    data: orders,
  });
});

/**
 * Get All Orders (Admin)
 */
exports.getAllOrders = asyncHandler(async (req, res) => {
  const {
    status,
    search,
    startDate,
    endDate,
    paymentMethod,
    userId,
    page = 1,
    limit = 10,
  } = req.query;
  const query = {};

  if (status && status !== 'ALL') {
    query.status = status;
  }

  if (userId) {
    query.userId = userId;
  }

  if (paymentMethod) {
    query.paymentMethod = paymentMethod;
  }

  // Date filtering
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.gte = new Date(startDate);
    if (endDate) query.createdAt.lte = new Date(endDate);
  }

  // Search by orderNumber or customer info
  if (search) {
    query.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { user: { firstName: { contains: search, mode: 'insensitive' } } },
      { user: { lastName: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { walkInPhone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: query,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        ...orderInclude,
      },
    }),
    prisma.order.count({ where: query }),
  ]);

  return successResponse(res, {
    message: 'Orders retrieved successfully',
    data: orders,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / take),
    },
  });
});

/**
 * Update Order Status (Admin)
 */
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  // Get current order with items to check if we need to revert stock
  const currentOrder = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!currentOrder) {
    throw ApiError.notFound('Order not found');
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status },
  });

  // If order is being CANCELLED or REFUNDED, revert stock and decrement soldCount
  if ((status === 'CANCELLED' || status === 'REFUNDED') && currentOrder.status !== 'CANCELLED' && currentOrder.status !== 'REFUNDED') {
    for (const item of currentOrder.items) {
      if (item.productId) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: { increment: item.quantity },
            soldCount: { decrement: item.quantity },
          },
        });

        // Also update variant stock if applicable
        if (item.variantId) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    }
  }

  // Trigger Real-time notifications for status update
  try {
    const io = getIO();
    await emitOrderUpdate(io, order.id);
  } catch (ioError) {
    console.warn('Socket.IO not initialized during order status update notify');
  }

  return successResponse(res, {
    message: `Order status updated to ${status}`,
    data: order,
  });
});

/**
 * Update Payment Status (Admin)
 */
exports.updatePaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body; // PENDING, PAID, FAILED, REFUNDED

  const order = await prisma.order.update({
    where: { id },
    data: { paymentStatus },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  try {
    if (order.userId) {
      const { sendNotification } = require('./notification.controller');
      const type =
        paymentStatus === 'PAID'
          ? 'PAYMENT_SUCCESS'
          : paymentStatus === 'FAILED'
            ? 'PAYMENT_FAILED'
            : 'PAYMENT_UPDATE';
      await sendNotification(order.userId, {
        type,
        title:
          paymentStatus === 'PAID'
            ? 'Payment Successful'
            : paymentStatus === 'FAILED'
              ? 'Payment Failed'
              : 'Payment Update',
        message: `Order #${order.orderNumber || order.id} payment status: ${paymentStatus}`,
        data: { orderId: order.id, url: `/orders/${order.id}` },
      });
    }
  } catch (notifyErr) {
    console.warn('Payment status notify error:', notifyErr?.message || notifyErr);
  }

  return successResponse(res, {
    message: `Payment status updated to ${paymentStatus}`,
    data: order,
  });
});

/**
 * Get Single Order (Public/Shared)
 */
exports.getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          address: true,
        },
      },
      soldByUser: { select: { firstName: true, lastName: true } },
    },
  });

  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  // Calculate historical customer stats for security/fraud check
  let customerStats = {
    total: 1,
    delivered: 0,
    cancelled: 0,
    successRate: 100,
    resolvedCount: 0
  };

  try {
    const customerEmail = order.user?.email || order.guestInfo?.email || (order.shippingAddress && typeof order.shippingAddress === 'object' ? order.shippingAddress.email : undefined);
    const customerPhone = order.user?.phone || order.guestInfo?.phone || order.walkInPhone || (order.shippingAddress && typeof order.shippingAddress === 'object' ? order.shippingAddress.phone : undefined);
    const userId = order.userId;

    const conditions = [];
    if (userId) conditions.push({ userId });
    if (customerPhone) conditions.push({ walkInPhone: customerPhone });
    if (customerEmail) conditions.push({ user: { email: customerEmail } });
    if (customerPhone) conditions.push({ user: { phone: customerPhone } });

    const candidateOrders = await prisma.order.findMany({
      where: {
        OR: conditions.length > 0 ? conditions : [{ id: order.id }]
      },
      select: {
        id: true,
        status: true,
        guestInfo: true,
        shippingAddress: true,
        walkInPhone: true,
        userId: true,
        user: {
          select: {
            email: true,
            phone: true
          }
        }
      },
      take: 100,
      orderBy: { createdAt: 'desc' }
    });

    const matchedOrders = candidateOrders.filter(o => {
      if (userId && o.userId === userId) return true;
      
      const oEmail = o.user?.email || o.guestInfo?.email || (o.shippingAddress && typeof o.shippingAddress === 'object' ? o.shippingAddress.email : undefined);
      const oPhone = o.user?.phone || o.guestInfo?.phone || o.walkInPhone || (o.shippingAddress && typeof o.shippingAddress === 'object' ? o.shippingAddress.phone : undefined);

      if (customerEmail && oEmail === customerEmail) return true;
      if (customerPhone && oPhone === customerPhone) return true;

      return false;
    });

    const total = matchedOrders.length;
    const delivered = matchedOrders.filter(o => o.status === 'DELIVERED' || o.status === 'COMPLETED').length;
    const cancelled = matchedOrders.filter(o => o.status === 'CANCELLED' || o.status === 'REFUNDED').length;
    const resolvedCount = delivered + cancelled;
    const successRate = resolvedCount > 0 ? Math.round((delivered / resolvedCount) * 100) : 100;

    customerStats = {
      total,
      delivered,
      cancelled,
      successRate,
      resolvedCount
    };
  } catch (error) {
    console.error('Error calculating customer order stats:', error);
  }

  return successResponse(res, {
    message: 'Order retrieved successfully',
    data: {
      ...order,
      customerStats
    },
  });
});

/**
 * Bulk Update Order Status (Admin)
 */
exports.bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { ids, status } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw ApiError.badRequest('Order IDs are required as an array');
  }

  // We loop to ensure stock reversal logic triggers if needed for each
  // Alternatively, use updateMany if no stock logic is needed, but here we want to be safe
  const results = [];
  for (const id of ids) {
    try {
      // Re-using the logic from updateOrderStatus or similar
      const currentOrder = await prisma.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!currentOrder) continue;

      const updated = await prisma.order.update({
        where: { id },
        data: { status },
      });

      // Stock Reversal for CANCELLED or REFUNDED
      if ((status === 'CANCELLED' || status === 'REFUNDED') && currentOrder.status !== 'CANCELLED' && currentOrder.status !== 'REFUNDED') {
        for (const item of currentOrder.items) {
          if (item.productId) {
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.quantity },
                soldCount: { decrement: item.quantity },
              },
            });
            if (item.variantId) {
              await prisma.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { increment: item.quantity } },
              });
            }
          }
        }
      }
      results.push(updated);
    } catch (err) {
      console.error(`Bulk update failed for ${id}:`, err.message);
    }
  }

  return successResponse(res, {
    message: `Successfully updated ${results.length} orders to ${status}`,
    data: results,
  });
});

/**
 * Block a client (IP or User Agent)
 */
exports.blockClient = asyncHandler(async (req, res) => {
  const { type, value, reason } = req.body;
  if (!type || !value) {
    throw ApiError.badRequest('Type and value are required');
  }

  const blocked = await prisma.blockedClient.create({
    data: {
      type, // "IP" or "DEVICE"
      value,
      reason,
    },
  });

  return createdResponse(res, {
    message: `${type} blocked successfully`,
    data: blocked,
  });
});

/**
 * Get all blocked clients
 */
exports.getBlockedClients = asyncHandler(async (req, res) => {
  const blocked = await prisma.blockedClient.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return successResponse(res, {
    message: 'Blocked clients list retrieved successfully',
    data: blocked,
  });
});

/**
 * Unblock a client
 */
exports.unblockClient = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await prisma.blockedClient.delete({
    where: { id },
  });

  return successResponse(res, {
    message: 'Client unblocked successfully',
  });
});
