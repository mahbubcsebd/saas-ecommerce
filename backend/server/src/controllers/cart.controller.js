const prisma = require('../config/prisma');
const asyncHandler = require('../middlewares/asyncHandler');
const ApiError = require('../utils/ApiError');
const { successResponse, createdResponse } = require('../utils/response');

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
      variant: true,
    },
  },
};

/**
 * Get Cart (Auth or Guest)
 * Query param: guestId (if not logged in)
 */
exports.getCart = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { guestId } = req.query;

  console.log(`[getCart] START userId: ${userId || 'none'}, guestId: ${guestId || 'none'}`);

  if (!userId && !guestId) {
    console.log(`[getCart] No userId or guestId provided, returning null`);
    return successResponse(res, { data: null });
  }

  let cart = null;

  // 1. Try fetching User cart if logged in
  if (userId) {
    console.log(`[getCart] Looking for userId: ${userId}`);
    cart = await prisma.cart.findFirst({
      where: { userId },
      include: cartInclude,
    });
    console.log(`[getCart] User cart found: ${!!cart}`);
  }

  // 2. If no user cart or not logged in, fetch Guest cart if guestId provided
  if (!cart && guestId) {
    console.log(`[getCart] Looking for sessionId (guestId): ${guestId}`);
    cart = await prisma.cart.findFirst({
      where: { sessionId: guestId },
      include: cartInclude,
    });
    console.log(`[getCart] Guest cart found: ${!!cart}`);
    if (cart) {
      console.log(`[getCart] Guest cart items: ${cart.items?.length || 0}`);
    }
  }

  return successResponse(res, {
    message: 'Cart retrieved successfully',
    data: cart,
  });
});

/**
 * Add / Update Item in Cart
 */
exports.addToCart = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { productId, variantId, quantity, guestId } = req.body;

  console.log(`[addToCart] START userId: ${userId || 'none'}, guestId: ${guestId || 'none'}`);
  console.log(
    `[addToCart] Body: productId=${productId}, variantId=${variantId || 'none'}, quantity=${quantity}`
  );

  // Allow either logged-in user or guest with guestId
  if (!userId && !guestId) {
    console.log(`[addToCart] Error: No userId or guestId`);
    throw ApiError.unauthorized(
      'User must be logged in or have a guest ID to add items to the cart'
    );
  }

  // 1. Fetch Product & Variant Details
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  });

  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  let unitPrice = product.sellingPrice;
  let availableStock = product.stock;

  if (variantId) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) {
      throw ApiError.notFound('Variant not found');
    }
    unitPrice = variant.sellingPrice || product.sellingPrice;
    availableStock = variant.stock;
  }

  if (availableStock < (quantity || 1)) {
    throw ApiError.badRequest(`Insufficient stock. Available: ${availableStock}`);
  }

  // 2. Find or create cart (by userId or sessionId)
  let cart = null;
  if (userId) {
    cart = await prisma.cart.findFirst({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }
  } else {
    cart = await prisma.cart.findFirst({ where: { sessionId: guestId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { sessionId: guestId } });
    }
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
    console.log(
      `[addToCart] Item already exists. Id: ${existingItem.id}, OldQty: ${existingItem.quantity}`
    );
    const newQuantity = existingItem.quantity + (quantity || 1);
    if (availableStock < newQuantity) {
      throw ApiError.badRequest(
        `Insufficient stock for total quantity. Available: ${availableStock}`
      );
    }

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: newQuantity,
        total: existingItem.unitPrice * newQuantity,
      },
    });
  } else {
    console.log(`[addToCart] Creating new CartItem in cart ${cart.id}`);
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        variantId,
        quantity: quantity || 1,
        unitPrice: parseFloat(unitPrice),
        total: parseFloat(unitPrice) * (quantity || 1),
      },
    });
  }

  // Return updated cart
  const updatedCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: cartInclude,
  });

  return successResponse(res, {
    message: 'Item added to cart',
    data: updatedCart,
  });
});

/**
 * Update Cart Item Quantity
 */
exports.updateCartItem = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params; // CartItem ID
  const { quantity } = req.body;
  const { guestId } = req.query;

  const cartItem = await prisma.cartItem.findUnique({
    where: { id },
    include: { product: true, variant: true, cart: true },
  });

  if (!cartItem) {
    throw ApiError.notFound('Cart item not found');
  }

  // Ownership Check (userId or guestId/sessionId)
  const isOwner =
    (userId && cartItem.cart.userId === userId) || (guestId && cartItem.cart.sessionId === guestId);

  if (!isOwner) {
    throw ApiError.forbidden('You do not have permission to update this item');
  }

  const availableStock = cartItem.variant ? cartItem.variant.stock : cartItem.product.stock;
  if (availableStock < quantity) {
    throw ApiError.badRequest(`Insufficient stock. Available: ${availableStock}`);
  }

  await prisma.cartItem.update({
    where: { id },
    data: {
      quantity,
      total: cartItem.unitPrice * quantity,
    },
  });

  const updatedCart = await prisma.cart.findUnique({
    where: { id: cartItem.cartId },
    include: cartInclude,
  });

  return successResponse(res, {
    message: 'Cart updated successfully',
    data: updatedCart,
  });
});

/**
 * Remove Item from Cart
 */
exports.removeFromCart = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params; // CartItem ID
  const { guestId } = req.query;

  const item = await prisma.cartItem.findUnique({
    where: { id },
    include: { cart: true },
  });

  if (!item) {
    throw ApiError.notFound('Cart item not found');
  }

  // Ownership Check (userId or guestId/sessionId)
  const isOwner =
    (userId && item.cart.userId === userId) || (guestId && item.cart.sessionId === guestId);

  if (!isOwner) {
    throw ApiError.forbidden('You do not have permission to remove this item');
  }

  const cartId = item.cartId;
  await prisma.cartItem.delete({ where: { id } });

  const updatedCart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: cartInclude,
  });

  return successResponse(res, {
    message: 'Item removed from cart',
    data: updatedCart,
  });
});

/**
 * Merge Guest Cart into User Cart
 */
exports.mergeCart = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { items } = req.body; // Expecting { items: [{ productId, variantId, quantity }] }

  console.log(`[mergeCart] Merging ${items?.length || 0} items into userId: ${userId}`);

  if (!userId) {
    throw ApiError.unauthorized('User must be logged in to merge cart');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return successResponse(res, { message: 'No items to merge' });
  }

  // 1. Find or create the user cart
  let userCart = await prisma.cart.findFirst({
    where: { userId },
  });

  if (!userCart) {
    userCart = await prisma.cart.create({
      data: { userId },
    });
    console.log(`[mergeCart] Created new user cart: ${userCart.id}`);
  }

  // 2. Add local items to user cart
  for (const item of items) {
    // Skip invalid items
    if (!item.productId || !item.quantity) continue;

    // Fetch product details for current price
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: { variants: true },
    });

    if (!product) continue;

    let unitPrice = product.sellingPrice;
    let availableStock = product.stock;

    if (item.variantId) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (variant) {
        unitPrice = variant.sellingPrice || product.sellingPrice;
        availableStock = variant.stock;
      }
    }

    // Check stock (optional: could skip check and just merge, but safest to check)
    // For merge, we might want to be lenient or cap at max stock

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: userCart.id,
        productId: item.productId,
        variantId: item.variantId || null, // explicit null check
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + item.quantity;
      // Cap at stock if needed, or just let it update
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          total: existingItem.unitPrice * newQuantity,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          unitPrice: parseFloat(unitPrice),
          total: parseFloat(unitPrice) * item.quantity,
        },
      });
    }
  }

  // 3. Return updated user cart
  const updatedCart = await prisma.cart.findUnique({
    where: { id: userCart.id },
    include: cartInclude,
  });

  return successResponse(res, {
    message: 'Cart merged successfully',
    data: updatedCart,
  });
});

/**
 * Clear Entire Cart
 */
exports.clearCart = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { guestId } = req.query;

  let cartQuery = {};
  if (userId) {
    cartQuery.userId = userId;
  } else if (guestId) {
    cartQuery.sessionId = guestId;
  } else {
    throw ApiError.unauthorized('User must be logged in or have a guest ID to clear the cart');
  }

  const cart = await prisma.cart.findFirst({
    where: cartQuery,
  });

  if (cart) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }

  // Return empty cart structure
  return successResponse(res, {
    message: 'Cart cleared successfully',
    data: cart ? { ...cart, items: [] } : null,
  });
});
