const prisma = require('../config/prisma');

class CouponService {
  /**
   * Validate and apply a coupon
   * @param {string} code - Coupon code
   * @param {string} userId - ID of the user applying the coupon
   * @param {object} cartData - { items: [], subtotal: 0, country: "BD" }
   */
  async validateAndApply(code, userId, cartData) {
    // 1. Find coupon (Discount model)
    const coupon = await prisma.discount.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        productDiscounts: true,
      },
    });

    if (!coupon) {
      return { valid: false, error: 'Invalid coupon code' };
    }

    // 2. Check if active
    if (!coupon.isActive) {
      return { valid: false, error: 'This coupon is no longer active' };
    }

    // 3. Check date validity
    const now = new Date();
    if (now < new Date(coupon.startDate)) {
      return { valid: false, error: 'This coupon is not yet valid' };
    }
    if (coupon.endDate && now > new Date(coupon.endDate)) {
      return { valid: false, error: 'This coupon has expired' };
    }

    // 4. Check max total uses
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, error: 'This coupon has reached its usage limit' };
    }

    // 5. Check per-user limit
    if (userId && coupon.perUserLimit) {
      const userUsageCount = await prisma.discountUsage.count({
        where: {
          discountId: coupon.id,
          userId: userId,
        },
      });

      if (userUsageCount >= coupon.perUserLimit) {
        return {
          valid: false,
          error:
            coupon.perUserLimit === 1
              ? 'You have already used this coupon'
              : `You can only use this coupon ${coupon.perUserLimit} times`,
        };
      }
    }

    // 6. Check minimum order value
    if (coupon.minOrderValue && cartData.subtotal < coupon.minOrderValue) {
      return {
        valid: false,
        error: `Minimum order value of ৳${coupon.minOrderValue} required`,
      };
    }

    // 7. Check country restrictions
    if (coupon.allowedCountries && coupon.allowedCountries.length > 0) {
      // Default to 'BD' if no country provided
      const country = cartData.country || 'BD';
      if (!coupon.allowedCountries.includes(country)) {
        return { valid: false, error: 'This coupon is not valid in your country' };
      }
    }

    // 8. Check new users only
    if (coupon.newUsersOnly && userId) {
      const orderCount = await prisma.order.count({
        where: { userId: userId },
      });
      if (orderCount > 0) {
        return { valid: false, error: 'This coupon is for new users only' };
      }
    }

    // 9. Check allowed users
    if (coupon.allowedUserIds && coupon.allowedUserIds.length > 0 && userId) {
      if (!coupon.allowedUserIds.includes(userId)) {
        return { valid: false, error: 'This coupon is not valid for your account' };
      }
    }

    // 10. Check product/category applicability
    const applicableItems = this.filterApplicableItems(cartData.items, coupon);

    if (applicableItems.length === 0) {
      return {
        valid: false,
        error: 'This coupon is not applicable to items in your cart',
      };
    }

    // 11. Calculate discount
    let applicableSubtotal = 0;
    applicableItems.forEach((item) => {
      applicableSubtotal += item.price * item.quantity;
    });

    let discountAmount = 0;

    if (coupon.type === 'PERCENTAGE') {
      discountAmount = (applicableSubtotal * coupon.value) / 100;

      // Apply max discount cap
      if (coupon.maxDiscountCap && discountAmount > coupon.maxDiscountCap) {
        discountAmount = coupon.maxDiscountCap;
      }
    } else {
      // FLAT or other types
      // For simplified logic assuming FLAT operates on total
      discountAmount = coupon.value;

      // Don't exceed applicable subtotal
      if (discountAmount > applicableSubtotal) {
        discountAmount = applicableSubtotal;
      }
    }

    return {
      valid: true,
      coupon,
      discountAmount: Math.round(discountAmount * 100) / 100, // 2 decimal places
    };
  }

  filterApplicableItems(items, coupon) {
    if (!items || items.length === 0) return [];

    return items.filter((item) => {
      // Check if product is excluded
      if (coupon.excludedProducts && coupon.excludedProducts.includes(item.productId)) {
        return false;
      }

      // APPLICABLE ON Logic
      // If DiscountApplicableOn is PRODUCT -> Check specific productIds
      // If DiscountApplicableOn is CATEGORY -> Check categoryIds
      // If DiscountApplicableOn is BRAND -> Check brand names (assuming item has brand info if needed, or we fetch it)
      // If DiscountApplicableOn is CART -> All items valid (unless excluded)

      // Simplifying based on user snippet logic which checked lists directly:

      // If specific products are set in 'productDiscounts' relation or we can adapt Schema
      // The user snippet used `applicableProducts` array on the model.
      // Our prisma schema uses `ProductDiscount` relation for products, and `categoryIds` array for categories.

      // Check Category
      if (coupon.categoryIds && coupon.categoryIds.length > 0) {
        if (!coupon.categoryIds.includes(item.categoryId)) {
          // Item category not in list.
          // However, if we also have allowed products, we should check that too.
          // If BOTH are present, usually OR logic or match either.
          // For now, if categories defined, item MUST be in category UNLESS product specific match.
        }
      }

      // Since our schema uses relations for products, we might need to preload them or just check if `coupon.productDiscounts` contains productId
      const isProductExplicit = coupon.productDiscounts.some(
        (pd) => pd.productId === item.productId
      );

      if (coupon.applicableOn === 'PRODUCT') {
        return isProductExplicit;
      }

      if (coupon.applicableOn === 'CATEGORY') {
        return coupon.categoryIds.includes(item.categoryId);
      }

      // Default fallback for CART type
      return true;
    });
  }

  async recordUsage(discountId, userId, orderId, discountAmount) {
    await prisma.$transaction([
      // Record usage
      prisma.discountUsage.create({
        data: {
          discountId,
          userId,
          orderId,
          discountAmount,
        },
      }),
      // Increment usage count
      prisma.discount.update({
        where: { id: discountId },
        data: { usageCount: { increment: 1 } },
      }),
    ]);
  }
}

module.exports = new CouponService();
