const prisma = require('../config/prisma');

/**
 * Calculate discount for a single product
 */
function calculateProductDiscount(product, discounts) {
  if (!discounts || discounts.length === 0) return 0;

  let maxDiscount = 0;

  for (const discount of discounts) {
    let amount = 0;

    switch (discount.type) {
      case 'PERCENTAGE':
        amount = (product.sellingPrice * discount.value) / 100;
        break;

      case 'FLAT':
        amount = discount.value;
        break;

      default:
        amount = 0;
    }

    // Apply max discount cap if set
    if (discount.maxDiscountCap && amount > discount.maxDiscountCap) {
      amount = discount.maxDiscountCap;
    }

    // Keep track of maximum discount (non-stackable)
    if (amount > maxDiscount) {
      maxDiscount = amount;
    }
  }

  // Ensure discount doesn't exceed product price
  return Math.min(maxDiscount, product.sellingPrice);
}

/**
 * Calculate cart totals with discounts
 */
async function calculateCartTotals(cartItems, couponCode = null) {
  let subtotal = 0;
  let totalDiscount = 0;
  let couponDiscount = 0;

  const itemsWithDiscount = [];

  // Calculate subtotal and product-level discounts
  for (const item of cartItems) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId },
      include: {
        discounts: {
          include: {
            discount: {
              where: {
                isActive: true,
                startDate: { lte: new Date() },
                OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
              },
            },
          },
        },
      },
    });

    if (!product) continue;

    const activeDiscounts = product.discounts.map((pd) => pd.discount).filter((d) => d);

    const productDiscount = calculateProductDiscount(product, activeDiscounts);
    const itemPrice = product.sellingPrice - productDiscount;
    const itemTotal = itemPrice * item.quantity;

    subtotal += product.sellingPrice * item.quantity;
    totalDiscount += productDiscount * item.quantity;

    itemsWithDiscount.push({
      ...item,
      unitPrice: product.sellingPrice,
      discount: productDiscount,
      finalPrice: itemPrice,
      total: itemTotal,
    });
  }

  // Apply coupon code if provided
  if (couponCode) {
    const coupon = await prisma.discount.findFirst({
      where: {
        code: couponCode,
        isActive: true,
        applicableOn: { in: ['CART', 'PRODUCT', 'CATEGORY', 'BRAND'] },
        startDate: { lte: new Date() },
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
    });

    if (coupon) {
      // Check if coupon has reached usage limit
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        throw new Error('Coupon usage limit exceeded');
      }

      // Check minimum order value
      if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
        throw new Error(`Minimum order value ৳${coupon.minOrderValue} required`);
      }

      // Calculate coupon discount
      if (coupon.type === 'PERCENTAGE') {
        couponDiscount = (subtotal * coupon.value) / 100;
      } else if (coupon.type === 'FLAT') {
        couponDiscount = coupon.value;
      }

      // Apply max discount cap
      if (coupon.maxDiscountCap && couponDiscount > coupon.maxDiscountCap) {
        couponDiscount = coupon.maxDiscountCap;
      }

      totalDiscount += couponDiscount;
    } else {
      throw new Error('Invalid or expired coupon code');
    }
  }

  const total = subtotal - totalDiscount;

  return {
    items: itemsWithDiscount,
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    couponDiscount: Math.round(couponDiscount * 100) / 100,
    total: Math.max(0, Math.round(total * 100) / 100),
    appliedCoupon: couponCode,
  };
}

/**
 * Validate and apply coupon
 */
async function validateCoupon(couponCode, userId, cartTotal) {
  const coupon = await prisma.discount.findFirst({
    where: {
      code: couponCode,
      isActive: true,
      startDate: { lte: new Date() },
      OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
    },
  });

  if (!coupon) {
    throw new Error('Invalid or expired coupon code');
  }

  // Check usage limits
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    throw new Error('Coupon usage limit exceeded');
  }

  // Check per-user limit
  if (userId && coupon.perUserLimit) {
    const userUsage = await prisma.discountUsage.count({
      where: {
        userId,
        discountId: coupon.id,
      },
    });

    if (userUsage >= coupon.perUserLimit) {
      throw new Error(`You can only use this coupon ${coupon.perUserLimit} time(s)`);
    }
  }

  // Check minimum order value
  if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
    throw new Error(`Minimum order value ৳${coupon.minOrderValue} required`);
  }

  return coupon;
}

/**
 * Apply Buy X Get Y discount
 */
function applyBuyXGetY(items, discount) {
  const eligibleItems = items.filter((item) => {
    // Check if item matches discount criteria
    return true; // Implement your logic
  });

  let freeItems = 0;
  eligibleItems.forEach((item) => {
    const sets = Math.floor(item.quantity / discount.buyQuantity);
    freeItems += sets * discount.getQuantity;
  });

  return freeItems;
}

/**
 * Get all active discounts for a product
 */
async function getActiveDiscountsForProduct(productId) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: true,
      discounts: {
        include: {
          discount: {
            where: {
              isActive: true,
              startDate: { lte: new Date() },
              OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
            },
          },
        },
      },
    },
  });

  if (!product) return [];

  const discounts = product.discounts.map((pd) => pd.discount).filter((d) => d);

  // Also get category-wide and brand-wide discounts
  const additionalDiscounts = await prisma.discount.findMany({
    where: {
      isActive: true,
      startDate: { lte: new Date() },
      OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      AND: [
        {
          OR: [
            { categoryIds: { has: product.categoryId } },
            { brandNames: { has: product.brand } },
            {
              AND: [{ categoryIds: { isEmpty: true } }, { brandNames: { isEmpty: true } }],
            },
          ],
        },
      ],
    },
  });

  return [...discounts, ...additionalDiscounts];
}

module.exports = {
  calculateProductDiscount,
  calculateCartTotals,
  validateCoupon,
  applyBuyXGetY,
  getActiveDiscountsForProduct,
};
