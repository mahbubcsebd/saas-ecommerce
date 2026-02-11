const prisma = require('../config/prisma');
const { errorResponse } = require('../helpers/responseHandler');

/**
 * Create a new address
 */
exports.createAddress = async (req, res, next) => {
  try {
    const { name, phone, street, city, state, zipCode, country, type, isDefault } = req.body;
    const userId = req.user.id;

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        name,
        phone,
        street,
        city,
        state,
        zipCode,
        country,
        type: type || 'Home',
        isDefault: isDefault || false,
      },
    });

    res.status(201).json({
      success: true,
      data: address,
      message: 'Address added successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all addresses for logged-in user
 */
exports.getMyAddresses = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' }, // Defaults first
    });

    res.status(200).json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an address
 */
exports.updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, phone, street, city, state, zipCode, country, type, isDefault } = req.body;

    // Verify ownership
    const existing = await prisma.address.findFirst({
        where: { id, userId }
    });

    if (!existing) {
        return errorResponse(res, { statusCode: 404, message: 'Address not found or unauthorized' });
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: {
        name,
        phone,
        street,
        city,
        state,
        zipCode,
        country,
        type,
        isDefault,
      },
    });

    res.status(200).json({
      success: true,
      data: address,
      message: 'Address updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an address
 */
exports.deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const existing = await prisma.address.findFirst({
        where: { id, userId }
    });

    if (!existing) {
        return errorResponse(res, { statusCode: 404, message: 'Address not found or unauthorized' });
    }

    await prisma.address.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
