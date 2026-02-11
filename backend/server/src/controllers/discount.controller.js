const prisma = require('../config/prisma');
const { validateCoupon } = require('../utils/discount');
// const { validateCoupon } = require('../utils/discountCalculator');

/**
 * Create Discount/Coupon
 */
exports.createDiscount = async (req, res, next) => {
  try {
    const {
      name, code, description, type, applicableOn, value,
      buyQuantity, getQuantity, startDate, endDate, isActive,
      usageLimit, perUserLimit, minOrderValue, maxDiscountCap,
      categoryIds, brandNames, productIds, priority, isStackable
    } = req.body;

    // Validate code uniqueness
    if (code) {
      const existing = await prisma.discount.findUnique({
        where: { code: code.toUpperCase() }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Discount code already exists'
        });
      }
    }

    const discount = await prisma.discount.create({
      data: {
        name,
        code: code ? code.toUpperCase() : null,
        description,
        type,
        applicableOn,
        value: parseFloat(value),
        buyQuantity: buyQuantity ? parseInt(buyQuantity) : null,
        getQuantity: getQuantity ? parseInt(getQuantity) : null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== false,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        perUserLimit: perUserLimit ? parseInt(perUserLimit) : 1,
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
        maxDiscountCap: maxDiscountCap ? parseFloat(maxDiscountCap) : null,
        categoryIds: categoryIds || [],
        brandNames: brandNames || [],
        priority: priority || 0,
        isStackable: isStackable || false
      }
    });

    // Link to specific products if provided
    if (productIds && productIds.length > 0) {
      await prisma.productDiscount.createMany({
        data: productIds.map(productId => ({
          productId,
          discountId: discount.id
        }))
      });
    }

    res.status(201).json({
      success: true,
      data: discount,
      message: 'Discount created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Discount
 */
exports.updateDiscount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, code, description, type, applicableOn, value,
      buyQuantity, getQuantity, startDate, endDate, isActive,
      usageLimit, perUserLimit, minOrderValue, maxDiscountCap,
      categoryIds, brandNames, productIds, priority, isStackable
    } = req.body;

    // Check code uniqueness if changed
    if (code) {
      const existing = await prisma.discount.findFirst({
        where: {
          code: code.toUpperCase(),
          id: { not: id }
        }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Discount code already exists'
        });
      }
    }

    const discount = await prisma.discount.update({
      where: { id },
      data: {
        name,
        code: code ? code.toUpperCase() : undefined,
        description,
        type,
        applicableOn,
        value: value ? parseFloat(value) : undefined,
        buyQuantity: buyQuantity ? parseInt(buyQuantity) : undefined,
        getQuantity: getQuantity ? parseInt(getQuantity) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        isActive,
        usageLimit: usageLimit ? parseInt(usageLimit) : undefined,
        perUserLimit: perUserLimit ? parseInt(perUserLimit) : undefined,
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : undefined,
        maxDiscountCap: maxDiscountCap ? parseFloat(maxDiscountCap) : undefined,
        categoryIds,
        brandNames,
        priority,
        isStackable
      }
    });

    // Update product links if provided
    if (productIds !== undefined) {
      // Remove old links
      await prisma.productDiscount.deleteMany({
        where: { discountId: id }
      });

      // Add new links
      if (productIds.length > 0) {
        await prisma.productDiscount.createMany({
          data: productIds.map(productId => ({
            productId,
            discountId: id
          }))
        });
      }
    }

    res.status(200).json({
      success: true,
      data: discount,
      message: 'Discount updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Discounts
 */
exports.getDiscounts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      isActive,
      type,
      search
    } = req.query;

    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (type) {
      query.type = type;
    }

    if (search) {
      query.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }

    const discounts = await prisma.discount.findMany({
      where: query,
      include: {
        productDiscounts: {
          include: {
            product: {
              select: { id: true, name: true, slug: true }
            }
          }
        }
      },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const count = await prisma.discount.count({ where: query });

    res.status(200).json({
      success: true,
      data: discounts,
      pagination: {
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Discount
 */
exports.getDiscount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const discount = await prisma.discount.findUnique({
      where: { id },
      include: {
        productDiscounts: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, images: true }
            }
          }
        }
      }
    });

    if (!discount) {
      return res.status(404).json({
        success: false,
        message: 'Discount not found'
      });
    }

    res.status(200).json({
      success: true,
      data: discount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Discount
 */
exports.deleteDiscount = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.discount.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Discount deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate Coupon Code (Public)
 */
exports.validateCouponCode = async (req, res, next) => {
  try {
    const { code, cartTotal } = req.body;
    const userId = req.user?.id;

    const coupon = await validateCoupon(
      code.toUpperCase(),
      userId,
      parseFloat(cartTotal)
    );

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = (parseFloat(cartTotal) * coupon.value) / 100;
    } else if (coupon.type === 'FLAT') {
      discountAmount = coupon.value;
    }

    // Apply max cap
    if (coupon.maxDiscountCap && discountAmount > coupon.maxDiscountCap) {
      discountAmount = coupon.maxDiscountCap;
    }

    res.status(200).json({
      success: true,
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount: Math.round(discountAmount * 100) / 100,
        description: coupon.description
      },
      message: 'Coupon applied successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get Active Discounts (Public)
 */
exports.getActiveDiscounts = async (req, res, next) => {
  try {
    const now = new Date();

    const discounts = await prisma.discount.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } }
        ],
        code: { not: null } // Only coupons with codes
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        type: true,
        value: true,
        minOrderValue: true,
        endDate: true
      },
      orderBy: { priority: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: discounts
    });
  } catch (error) {
    next(error);
  }
};