const prisma = require('../config/prisma');
const { errorResponse } = require('../helpers/responseHandler');

// Order Include Helper
const orderInclude = {
  items: {
    include: {
      product: { select: { slug: true, images: true } }
    }
  }
};

/**
 * Create Order
 */
exports.createOrder = async (req, res, next) => {
  try {
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
      soldBy
    } = req.body;

    let orderItemsData = [];
    let total = 0;
    let finalTotal = 0;
    let totalDiscountAmount = 0;
    let cart; // Fixed scope issue

    // ---------------------------------------------------------
    // 1. Item Retrieval (Cart vs Direct)
    // ---------------------------------------------------------
    if (source === 'POS' && directItems && directItems.length > 0) {
        // Direct items processing for POS
        for (const item of directItems) {
            // Fetch product to get latest price/stock
            // Optimization: could `findMany` but loop is easier for logic now
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                include: { variants: true }
            });

            if (!product) continue;

            let variant;
            if (item.variantId) {
                variant = product.variants.find(v => v.id === item.variantId);
            }

            const basePrice = variant ? (variant.basePrice || product.basePrice) : product.basePrice;
            const salePrice = variant ? (variant.sellingPrice || product.sellingPrice) : product.sellingPrice;
            const sku = variant ? variant.sku : product.sku;
            const name = product.name + (variant ? ` - ${variant.name}` : '');

            // Warranty (Variant overrides Product)
            const warranty = variant?.warranty || product.warranty;

            // Stock Check
            const currentStock = variant ? variant.stock : product.stock;
            if (currentStock < item.quantity) {
                 return errorResponse(res, { statusCode: 400, message: `Insufficient stock for ${name}` });
            }

            const itemTotal = salePrice * item.quantity;
            total += itemTotal;

            orderItemsData.push({
                productId: item.productId,
                variantId: item.variantId,
                name,
                sku,
                unitPrice: basePrice,
                salePrice: salePrice,
                quantity: item.quantity,
                total: itemTotal,
                warranty, // Added warranty
                // Legacy mapping if needed
                basePrice,
                sellingPriceLegacy: salePrice,
            });
        }
    } else {
        // Existing Cart Logic (Online)
        if (userId) {
           cart = await prisma.cart.findFirst({
            where: { userId },
            include: { items: { include: { product: true, variant: true } } }
          });
        } else if (sessionId) {
           cart = await prisma.cart.findFirst({
            where: { sessionId },
            include: { items: { include: { product: true, variant: true } } }
          });
        }

        if (!cart || cart.items.length === 0) {
          return errorResponse(res, { statusCode: 400, message: 'Cart is empty' });
        }

        for (const item of cart.items) {
          const itemSellingPrice = item.variant?.sellingPrice || item.product.sellingPrice;
          const itemBasePrice = item.variant?.basePrice || item.product.basePrice;
          const availableStock = item.variant?.stock || item.product.stock;
          const isPreOrder = item.variant?.isPreOrder || item.product.isPreOrder;

          // Warranty
          const warranty = item.variant?.warranty || item.product.warranty;

          if (availableStock < item.quantity && !isPreOrder) {
            return errorResponse(res, {
              statusCode: 400,
              message: `Insufficient stock for ${item.product.name}`
            });
          }

          const itemTotal = itemSellingPrice * item.quantity;
          total += itemTotal;

          orderItemsData.push({
            productId: item.productId,
            variantId: item.variantId || undefined,
            name: item.product.name,
            sku: item.variant?.sku || item.product.slug,
            unitPrice: itemBasePrice,
            salePrice: itemSellingPrice,
            quantity: item.quantity,
            total: itemTotal,
            warranty, // Added warranty
            // Legacy
            basePrice: itemBasePrice,
            sellingPriceLegacy: itemSellingPrice,
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

    // Shipping Cost (Online only usually)
    let shippingCost = 0;
    // ... (existing shipping calculation if any) ...

    finalTotal = afterDiscount + vatAmount + shippingCost;


    // ---------------------------------------------------------
    // 3. Create Order
    // ---------------------------------------------------------
    const prefix = source === 'POS' ? 'POS' : 'ORD';
    // Generate clearer Unique Order Number: ORD-YYYYMMDD-Random
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,"");
    const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderNumber = `${prefix}-${dateStr}-${randomStr}`;

    // Generate Invoice Number: INV-YYYYMMDD-Random
    // This reduces collision chance significantly compared to just random
    const invoiceNumber = `INV-${dateStr}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Validation
    if (source === 'ONLINE' && !shippingAddress) {
        return errorResponse(res, { statusCode: 400, message: 'Shipping address is required for Online orders' });
    }

    const orderData = {
        orderNumber,
        invoiceNumber, // Added invoice number
        source: source,
        userId: userId || undefined,

        // Info
        guestInfo: !userId ? guestInfo : undefined,
        walkInName,
        walkInPhone,

        // Financials
        subtotal,
        discountType,
        discountValue: parseFloat(discount),
        discountAmount: totalDiscountAmount,
        vatPercent: parseFloat(vatPercent),
        vatAmount,
        total: finalTotal,

        // Payment
        paymentMethod: paymentMethod || 'CASH',
        paymentStatus: source === 'POS' ? 'PAID' : 'PENDING',
        tenderedAmount: source === 'POS' ? parseFloat(tenderedAmount) : undefined,
        changeAmount: source === 'POS' ? parseFloat(changeAmount) : undefined,

        // Status
        status: source === 'POS' ? 'COMPLETED' : 'PENDING',

        // Fulfillment
        shippingAddress: shippingAddress || {},

        // Staff
        soldBy: soldBy || (source === 'POS' ? userId : undefined),

        items: {
          create: orderItemsData
        }
    };

    if (source === 'POS') {
        orderData.deliveredAt = new Date();
    }

    const order = await prisma.order.create({
      data: orderData,
      include: orderInclude
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
        const v = await prisma.productVariant.findUnique({ where: { id: item.variantId }});
        previousQty = v.stock;
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } }
        });
        // Sync parent
        await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
        });
        newQty = previousQty - item.quantity;
      } else {
        const p = await prisma.product.findUnique({ where: { id: item.productId }});
        previousQty = p.stock;
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
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
              performedBy: userId
          }
      });
    }

    // Clear Cart (only if Online or if Cart was used)
    if (source === 'ONLINE' && cart) {
        await prisma.cart.delete({ where: { id: cart.id } });
    }

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order placed successfully',
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get My Orders
 */
exports.getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: orderInclude
    });

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Orders (Admin)
 */
exports.getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: query,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, username: true } }, ...orderInclude }
      }),
      prisma.order.count({ where: query }),
    ]);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Order Status (Admin)
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    res.status(200).json({
      success: true,
      data: order,
      message: `Order status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
};
/**
 * Get Single Order (Public/Shared)
 */
exports.getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        user: { select: { email: true, firstName: true, lastName: true, phone: true, address: true } }
      }
    });

    if (!order) {
      return errorResponse(res, { statusCode: 404, message: 'Order not found' });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};
