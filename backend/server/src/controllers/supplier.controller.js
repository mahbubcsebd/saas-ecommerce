const prisma = require('../config/prisma');
const { errorResponse } = require('../helpers/responseHandler');

/**
 * Create Supplier
 */
exports.createSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, email, phone, address } = req.body;

    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson,
        email,
        phone,
        address,
      },
    });

    res.status(201).json({
      success: true,
      data: supplier,
      message: 'Supplier created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Suppliers
 */
exports.getSuppliers = async (req, res, next) => {
  try {
    const { search, isActive } = req.query;
    const query = {};

    if (search) {
      query.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const suppliers = await prisma.supplier.findMany({
      where: query,
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: suppliers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Supplier
 */
exports.getSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    });

    if (!supplier) {
      return errorResponse(res, { statusCode: 404, message: 'Supplier not found' });
    }

    res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Supplier
 */
exports.updateSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, contactPerson, email, phone, address, isActive } = req.body;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name,
        contactPerson,
        email,
        phone,
        address,
        isActive,
      },
    });

    res.status(200).json({
      success: true,
      data: supplier,
      message: 'Supplier updated successfully',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return errorResponse(res, { statusCode: 404, message: 'Supplier not found' });
    }
    next(error);
  }
};

/**
 * Delete Supplier (Soft delete if has purchases)
 */
exports.deleteSupplier = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check for purchases
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { purchases: true },
        },
      },
    });

    if (!supplier) {
      return errorResponse(res, { statusCode: 404, message: 'Supplier not found' });
    }

    if (supplier._count.purchases > 0) {
      // Soft delete
      await prisma.supplier.update({
        where: { id },
        data: { isActive: false },
      });
      return res.status(200).json({
        success: true,
        message: 'Supplier has associated purchases. Marked as inactive instead of deleted.',
      });
    }

    await prisma.supplier.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
