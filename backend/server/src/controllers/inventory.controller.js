const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const NotificationService = require('../services/notification.service');

// @desc    Get all inventory items (products + their variants)
// @route   GET /api/v1/inventory
// @access  Private/Admin/Manager
exports.getAllInventory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const { search, status } = req.query;

    // Build where clause
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Special handling for low stock / out of stock filters
    if (status === 'OUT_OF_STOCK') {
      where.stock = 0;
    } else if (status === 'LOW_STOCK') {
      where.stock = { gt: 0, lte: 10 }; // Assuming threshold is 10
    } else if (status === 'IN_STOCK') {
      where.stock = { gt: 10 };
    }

    const total = await prisma.product.count({ where });

    // Calculate global inventory summary analytics (ignoring current filters)
    const summary = {
      totalProducts: await prisma.product.count(),
      outOfStock: await prisma.product.count({ where: { stock: 0 } }),
      lowStock: await prisma.product.count({
        where: {
          OR: [
            { variants: { none: {} }, stock: { gt: 0, lte: prisma.product.minStockLevel } },
            { variants: { some: { stock: { gt: 0, lte: prisma.productVariant.minStockLevel } } } },
          ],
        },
      }),
    };

    const products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        variants: true,
      },
      skip: startIndex,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      count: products.length,
      summary, // Inject analytics summary here
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get stock movement history for a specific product
// @route   GET /api/v1/inventory/:productId/history
// @access  Private/Admin/Manager
exports.getStockHistory = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const movements = await prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      include: {
        variant: { select: { name: true, sku: true } },
      },
    });

    res.status(200).json({
      success: true,
      count: movements.length,
      data: movements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually adjust stock (Add/Remove)
// @route   POST /api/v1/inventory/adjust
// @access  Private/Admin/Manager
exports.adjustStock = async (req, res, next) => {
  try {
    const { productId, variantId, type, quantity, reason } = req.body;

    if (!productId || !type || !quantity || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide productId, type, quantity, and reason',
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be greater than 0',
      });
    }

    if (!['ADD', 'REMOVE', 'SET'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Adjustment type must be ADD, REMOVE, or SET',
      });
    }

    // Determine if updating base product or variant
    let previousQty = 0;
    let newQty = 0;
    let updateTarget = null;

    if (variantId) {
      const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
      if (!variant) return res.status(404).json({ success: false, message: 'Variant not found' });
      previousQty = variant.stock;
      updateTarget = prisma.productVariant;
    } else {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
      previousQty = product.stock;
      updateTarget = prisma.product;
    }

    // Calculate new quantity
    if (type === 'ADD') {
      newQty = previousQty + quantity;
    } else if (type === 'REMOVE') {
      newQty = Math.max(0, previousQty - quantity); // Prevent negative stock
    } else if (type === 'SET') {
      newQty = quantity;
    }

    // Transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update stock
      let updatedItem;
      if (variantId) {
        updatedItem = await tx.productVariant.update({
          where: { id: variantId },
          data: { stock: newQty },
        });
      } else {
        updatedItem = await tx.product.update({
          where: { id: productId },
          data: { stock: newQty },
        });
      }

      // 2. Create StockMovement record
      let movementType = 'ADJUSTMENT';
      if (type === 'ADD') movementType = 'PURCHASE';
      if (type === 'REMOVE') movementType = 'DAMAGE'; // Assumption for manual removals
      if (type === 'SET') movementType = 'ADJUSTMENT';

      const qtyChange =
        type === 'ADD' ? quantity : type === 'REMOVE' ? -quantity : newQty - previousQty;

      await tx.stockMovement.create({
        data: {
          productId,
          variantId: variantId || null,
          type: movementType, // Note: Need to check if this adheres to strict enum in schema
          quantity: qtyChange,
          previousQty,
          newQty,
          reason,
        },
      });

      return updatedItem;
    });

    // Trigger Notification if stock drops to critical levels
    try {
      const productName = variantId
        ? `a variant of ${result?.name || 'Product'}`
        : result?.name || 'Product';
      if (newQty === 0 && previousQty > 0) {
        await NotificationService.notifyAdmins(
          'STOCK_OUT',
          'Product Out of Stock',
          `"${productName}" is now completely out of stock.`,
          { productId, type: 'inventory' }
        );
      } else if (newQty > 0 && newQty <= 10 && previousQty > 10) {
        await NotificationService.notifyAdmins(
          'STOCK_LOW',
          'Low Stock Alert',
          `"${productName}" is running low on stock (${newQty} left).`,
          { productId, type: 'inventory' }
        );
      }
    } catch (notifErr) {
      logger.error(`Failed to send stock notification: ${notifErr.message}`);
    }

    res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully',
      data: result,
    });
  } catch (error) {
    logger.error(`Stock Adjustment Error: ${error.message}`);
    next(error);
  }
};

// ============================================
// RESTORED MOCKS FOR CRASH FIX
// ============================================

exports.getStockMovements = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const { productId, type } = req.query;

    const where = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;

    const total = await prisma.stockMovement.count({ where });

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true } },
        variant: { select: { name: true, sku: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: startIndex,
      take: limit,
    });

    res.status(200).json({
      success: true,
      count: movements.length,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      data: movements,
    });
  } catch (error) {
    next(error);
  }
};

exports.bulkStockUpdate = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Not implemented yet' });
};

exports.getLowStockReport = async (req, res, next) => {
  try {
    // Fetch products that are low stock
    const lowStockProducts = await prisma.product.findMany({
      where: {
        variants: { none: {} },
        stock: { lte: 5 }, // Default or we can use the field directly in a more complex query
      },
      include: { category: { select: { name: true } } },
    });

    // However, Prisma doesn't support comparing two fields in the same record easily in 'where'
    // So we might need to use raw query or fetch and filter (if small) or a better approach.
    // For MongoDB, we can use a raw aggregation if needed, but let's try a standard approach.

    const products = await prisma.product.findMany({
      include: {
        variants: true,
        category: { select: { name: true } },
      },
    });

    const report = [];

    for (const p of products) {
      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          if (v.stock <= v.minStockLevel) {
            report.push({
              id: p.id,
              variantId: v.id,
              name: `${p.name} (${v.name})`,
              sku: v.sku,
              stock: v.stock,
              minStockLevel: v.minStockLevel,
              category: p.category?.name,
              type: 'VARIANT',
            });
          }
        }
      } else {
        if (p.stock <= p.minStockLevel) {
          report.push({
            id: p.id,
            variantId: null,
            name: p.name,
            sku: p.sku,
            stock: p.stock,
            minStockLevel: p.minStockLevel,
            category: p.category?.name,
            type: 'PRODUCT',
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      count: report.length,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

exports.getOutOfStockReport = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Not implemented yet' });
};

exports.getInventoryValue = async (req, res, next) => {
  res.status(200).json({ success: true, message: 'Not implemented yet' });
};
