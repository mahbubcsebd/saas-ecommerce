const prisma = require('../config/prisma');

// ─── Helper: generate a random code ──────────────────────────────────────────
function generateCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─── CREATE ──────────────────────────────────────────────────────────────────
exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      type,
      value,
      maxDiscountCap,
      applicableOn,
      categoryIds,
      productIds,
      excludedProducts,
      minOrderValue,
      usageLimit,
      perUserLimit,
      newUsersOnly,
      allowedUserIds,
      allowedCountries,
      startDate,
      endDate,
      isActive,
    } = req.body;

    if (!name) return res.status(400).json({ success: false, message: 'Name is required.' });
    if (!type) return res.status(400).json({ success: false, message: 'Type is required.' });

    const finalCode = (code || generateCode()).toUpperCase().replace(/\s/g, '');

    const discount = await prisma.discount.create({
      data: {
        code: finalCode,
        name,
        description: description || null,
        type,
        value: parseFloat(value) || 0,
        maxDiscountCap: maxDiscountCap ? parseFloat(maxDiscountCap) : null,
        applicableOn: applicableOn || 'CART',
        categoryIds: categoryIds || [],
        excludedProducts: excludedProducts || [],
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        perUserLimit: perUserLimit ? parseInt(perUserLimit) : null,
        newUsersOnly: !!newUsersOnly,
        allowedUserIds: allowedUserIds || [],
        allowedCountries: allowedCountries || [],
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? isActive : true,
        productDiscounts: productIds?.length
          ? { create: productIds.map((pid) => ({ productId: pid })) }
          : undefined,
      },
      include: { productDiscounts: true, _count: { select: { usages: true } } },
    });

    return res.status(201).json({ success: true, data: discount });
  } catch (error) {
    if (error.code === 'P2002')
      return res
        .status(409)
        .json({ success: false, message: 'A coupon with this code already exists.' });
    console.error('createCoupon error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET ALL ─────────────────────────────────────────────────────────────────
exports.getAllCoupons = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search)
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (status === 'expired') where.endDate = { lt: new Date() };

    const [coupons, total] = await Promise.all([
      prisma.discount.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        include: { _count: { select: { usages: true } } },
      }),
      prisma.discount.count({ where }),
    ]);

    // Summary
    const now = new Date();
    const [totalActive, totalExpired] = await Promise.all([
      prisma.discount.count({ where: { isActive: true } }),
      prisma.discount.count({ where: { endDate: { lt: now } } }),
    ]);

    return res.status(200).json({
      success: true,
      data: coupons,
      summary: { total: await prisma.discount.count(), totalActive, totalExpired },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('getAllCoupons error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GET ONE ─────────────────────────────────────────────────────────────────
exports.getCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const coupon = await prisma.discount.findUnique({
      where: { id },
      include: {
        productDiscounts: { include: { discount: false } },
        usages: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: { discount: false },
        },
        _count: { select: { usages: true } },
      },
    });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    return res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    console.error('getCoupon error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── UPDATE ──────────────────────────────────────────────────────────────────
exports.updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.discount.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Coupon not found.' });

    const {
      name,
      description,
      type,
      value,
      maxDiscountCap,
      applicableOn,
      categoryIds,
      productIds,
      excludedProducts,
      minOrderValue,
      usageLimit,
      perUserLimit,
      newUsersOnly,
      allowedUserIds,
      allowedCountries,
      startDate,
      endDate,
      isActive,
    } = req.body;

    const updated = await prisma.discount.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(value !== undefined && { value: parseFloat(value) }),
        ...(maxDiscountCap !== undefined && {
          maxDiscountCap: maxDiscountCap ? parseFloat(maxDiscountCap) : null,
        }),
        ...(applicableOn !== undefined && { applicableOn }),
        ...(categoryIds !== undefined && { categoryIds }),
        ...(excludedProducts !== undefined && { excludedProducts }),
        ...(minOrderValue !== undefined && {
          minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
        }),
        ...(usageLimit !== undefined && { usageLimit: usageLimit ? parseInt(usageLimit) : null }),
        ...(perUserLimit !== undefined && {
          perUserLimit: perUserLimit ? parseInt(perUserLimit) : null,
        }),
        ...(newUsersOnly !== undefined && { newUsersOnly: !!newUsersOnly }),
        ...(allowedUserIds !== undefined && { allowedUserIds }),
        ...(allowedCountries !== undefined && { allowedCountries }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { _count: { select: { usages: true } } },
    });

    // Update product discounts if provided
    if (productIds !== undefined) {
      await prisma.productDiscount.deleteMany({ where: { discountId: id } });
      if (productIds.length > 0) {
        await prisma.productDiscount.createMany({
          data: productIds.map((pid) => ({ discountId: id, productId: pid })),
        });
      }
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    if (error.code === 'P2002')
      return res
        .status(409)
        .json({ success: false, message: 'A coupon with this code already exists.' });
    console.error('updateCoupon error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── DELETE ──────────────────────────────────────────────────────────────────
exports.deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.discount.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    await prisma.discount.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Coupon deleted.' });
  } catch (error) {
    console.error('deleteCoupon error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── TOGGLE ACTIVE ───────────────────────────────────────────────────────────
exports.toggleCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.discount.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    const updated = await prisma.discount.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('toggleCoupon error:', error);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ─── GENERATE CODE ───────────────────────────────────────────────────────────
exports.generateCode = async (req, res) => {
  return res.status(200).json({ success: true, code: generateCode() });
};

// ─── VALIDATE (customer-facing) ──────────────────────────────────────────────
const couponService = require('../services/coupon.service');
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, cart, country } = req.body;
    const userId = req.user?.id || null;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code is required' });
    const result = await couponService.validateAndApply(code, userId, { ...cart, country });
    if (!result.valid) return res.status(400).json({ success: false, message: result.error });
    res.json({
      success: true,
      discount: result.discountAmount,
      coupon: {
        code: result.coupon.code,
        name: result.coupon.name,
        type: result.coupon.type,
        value: result.coupon.value,
      },
    });
  } catch (error) {
    next(error);
  }
};
