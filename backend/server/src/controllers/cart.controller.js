const prisma = require('../config/prisma');
const { errorResponse } = require('../helpers/responseHandler');

// Helper to get cart include
const cartInclude = {
  items: {
    include: {
      product: {
        select: {
          name: true,
          sellingPrice: true,
          basePrice: true,
          costPrice: true,
          images: true,
          slug: true,
          stock: true,
          category: true,
          variants: true, // Include all variants for the product
        },
      },
      // TODO: Re-enable after running: npx prisma generate
      // variant: {
      //   select: {
      //     id: true,
      //     name: true,
      //     sellingPrice: true,
      //     basePrice: true,
      //     stock: true,
      //     images: true,
      //     attributes: true,
      //   },
      // },
    },
  },
};

/**
 * Get Cart (Auth or Guest)
 * Query param: guestId (if not logged in)
 */
exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { guestId } = req.query;

    if (!userId && !guestId) {
      return res.status(200).json({ success: true, data: null });
    }

    let cart;
    if (userId) {
      cart = await prisma.cart.findFirst({
        where: { userId },
        include: cartInclude,
      });

      // If user has a guestId session, maybe merge carts? (Skipping for simplicity now)
    } else {
      cart = await prisma.cart.findFirst({
        where: { sessionId: guestId },
        include: cartInclude,
      });
    }

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add / Update Item in Cart
 */
exports.addToCart = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { guestId, productId, variantId, quantity } = req.body;

    if (!userId && !guestId) {
      return errorResponse(res, { statusCode: 400, message: 'User ID or Guest ID required' });
    }

    // 1. Fetch Product & Variant Details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: true }
    });

    if (!product) {
      return errorResponse(res, { statusCode: 404, message: 'Product not found' });
    }

    let unitPrice = product.sellingPrice;
    let availableStock = product.stock;

    if (variantId) {
      const variant = product.variants.find(v => v.id === variantId);
      if (!variant) {
        return errorResponse(res, { statusCode: 404, message: 'Variant not found' });
      }
      unitPrice = variant.sellingPrice || product.sellingPrice; // Fallback if variant price is null
      availableStock = variant.stock;
    }

    if (availableStock < quantity) {
      return errorResponse(res, { statusCode: 400, message: 'Insufficient stock' });
    }

    // 2. Find or create cart
    let cart;
    const where = userId ? { userId } : { sessionId: guestId };

    cart = await prisma.cart.findFirst({ where });
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: userId || undefined,
          sessionId: guestId || undefined,
        },
      });
    }

    // 3. Check if item exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
      },
    });

    if (existingItem) {
      // Update quantity and total
      const newQuantity = existingItem.quantity + (quantity || 1);
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
            quantity: newQuantity,
            total: existingItem.unitPrice * newQuantity
        },
      });
    } else {
      // Create new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId,
          quantity: quantity || 1,
          unitPrice: parseFloat(unitPrice),
          total: parseFloat(unitPrice) * (quantity || 1)
        },
      });
    }

    // 4. Update Cart Totals (Optional but good practice)
    // For now, we rely on the client or a separate calculation,
    // but the schema has subtotal/total fields on Cart.
    // Let's leave them for now or update if needed.

    // Return updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: cartInclude,
    });

    res.status(200).json({
      success: true,
      data: updatedCart,
      message: 'Item added to cart',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Cart Item Quantity
 */
exports.updateCartItem = async (req, res, next) => {
    try {
        const { id } = req.params; // CartItem ID
        const { quantity } = req.body;

        await prisma.cartItem.update({
            where: { id },
            data: { quantity },
        });

        res.status(200).json({
            success: true,
            message: 'Cart updated',
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Remove Item from Cart
 */
exports.removeFromCart = async (req, res, next) => {
  try {
    const { id } = req.params; // CartItem ID

    await prisma.cartItem.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    next(error);
  }
};
