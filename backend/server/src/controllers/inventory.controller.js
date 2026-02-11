const prisma = require('../config/prisma');

/**
 * Get Stock Movements History
 */
exports.getStockMovements = async (req, res, next) => {
  try {
    const {
      productId,
      type,
      page = 1,
      limit = 20,
      startDate,
      endDate
    } = req.query;

    const query = {};

    if (productId) query.productId = productId;
    if (type) query.type = type;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.gte = new Date(startDate);
      if (endDate) query.createdAt.lte = new Date(endDate);
    }

    const movements = await prisma.stockMovement.findMany({
      where: query,
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const count = await prisma.stockMovement.count({ where: query });

    res.status(200).json({
      success: true,
      data: movements,
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
 * Adjust Stock (Manual)
 */
exports.adjustStock = async (req, res, next) => {
  try {
    const { productId, variantId, quantity, reason, notes } = req.body;

    // Get current stock
    let currentStock;
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId }
      });
      if (!variant) {
        return res.status(404).json({
          success: false,
          message: 'Variant not found'
        });
      }
      currentStock = variant.stock;
    } else {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      currentStock = product.stock;
    }

    const newStock = currentStock + parseInt(quantity);

    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock cannot be negative'
      });
    }

    // Update stock
    if (variantId) {
      await prisma.productVariant.update({
        where: { id: variantId },
        data: { stock: newStock }
      });
    } else {
      await prisma.product.update({
        where: { id: productId },
        data: { stock: newStock }
      });
    }

    // Record movement
    const movement = await prisma.stockMovement.create({
      data: {
        productId,
        variantId: variantId || null,
        type: 'ADJUSTMENT',
        quantity: parseInt(quantity),
        previousQty: currentStock,
        newQty: newStock,
        reason: reason || 'Manual adjustment',
        notes,
        performedBy: req.user?.id
      }
    });

    res.status(200).json({
      success: true,
      data: movement,
      message: 'Stock adjusted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk Stock Update
 */
exports.bulkStockUpdate = async (req, res, next) => {
  try {
    const { items } = req.body; // [{ productId, variantId?, stock }]

    const results = [];

    for (const item of items) {
      try {
        // Get current stock
        let currentStock;
        if (item.variantId) {
          const variant = await prisma.productVariant.findUnique({
            where: { id: item.variantId }
          });
          currentStock = variant?.stock || 0;
        } else {
          const product = await prisma.product.findUnique({
            where: { id: item.productId }
          });
          currentStock = product?.stock || 0;
        }

        const newStock = parseInt(item.stock);
        const difference = newStock - currentStock;

        // Update stock
        if (item.variantId) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stock: newStock }
          });
        } else {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: newStock }
          });
        }

        // Record movement
        await prisma.stockMovement.create({
          data: {
            productId: item.productId,
            variantId: item.variantId || null,
            type: 'ADJUSTMENT',
            quantity: difference,
            previousQty: currentStock,
            newQty: newStock,
            reason: 'Bulk stock update',
            performedBy: req.user?.id
          }
        });

        results.push({
          productId: item.productId,
          variantId: item.variantId,
          success: true,
          oldStock: currentStock,
          newStock
        });
      } catch (err) {
        results.push({
          productId: item.productId,
          variantId: item.variantId,
          success: false,
          error: err.message
        });
      }
    }

    res.status(200).json({
      success: true,
      data: results,
      message: 'Bulk stock update completed'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Low Stock Report
 */
exports.getLowStockReport = async (req, res, next) => {
  try {
    // Products with low stock
    const products = await prisma.product.findMany({
      where: {
        trackInventory: true,
        stock: {
          lte: prisma.product.fields.lowStockAlert
        }
      },
      include: {
        category: { select: { name: true } },
        variants: {
          where: { stock: { lte: 5 } }
        }
      },
      orderBy: { stock: 'asc' }
    });

    res.status(200).json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Out of Stock Report
 */
exports.getOutOfStockReport = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        trackInventory: true,
        stock: 0
      },
      include: {
        category: { select: { name: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Inventory Value Report
 */
exports.getInventoryValue = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { trackInventory: true },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        basePrice: true,
        sellingPrice: true,
        costPrice: true
      }
    });

    let totalRetailValue = 0;
    let totalCostValue = 0;
    let totalItems = 0;

    const breakdown = products.map(product => {
      const retailValue = product.sellingPrice * product.stock;
      const costValue = (product.costPrice || 0) * product.stock;

      totalRetailValue += retailValue;
      totalCostValue += costValue;
      totalItems += product.stock;

      return {
        ...product,
        retailValue: Math.round(retailValue * 100) / 100,
        costValue: Math.round(costValue * 100) / 100,
        potentialProfit: Math.round((retailValue - costValue) * 100) / 100
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalProducts: products.length,
          totalItems,
          totalRetailValue: Math.round(totalRetailValue * 100) / 100,
          totalCostValue: Math.round(totalCostValue * 100) / 100,
          potentialProfit: Math.round((totalRetailValue - totalCostValue) * 100) / 100,
          profitMargin: totalRetailValue > 0
            ? Math.round(((totalRetailValue - totalCostValue) / totalRetailValue) * 100)
            : 0
        },
        breakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reserve Stock (for orders)
 */
exports.reserveStock = async (productId, variantId, quantity) => {
  try {
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId }
      });

      if (!variant || variant.stock < quantity) {
        throw new Error('Insufficient stock');
      }

      await prisma.productVariant.update({
        where: { id: variantId },
        data: { stock: { decrement: quantity } }
      });

      await prisma.stockMovement.create({
        data: {
          productId,
          variantId,
          type: 'SALE',
          quantity: -quantity,
          previousQty: variant.stock,
          newQty: variant.stock - quantity,
          reason: 'Order placed'
        }
      });
    } else {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product || product.stock < quantity) {
        throw new Error('Insufficient stock');
      }

      await prisma.product.update({
        where: { id: productId },
        data: {
          stock: { decrement: quantity },
          soldCount: { increment: quantity }
        }
      });

      await prisma.stockMovement.create({
        data: {
          productId,
          type: 'SALE',
          quantity: -quantity,
          previousQty: product.stock,
          newQty: product.stock - quantity,
          reason: 'Order placed'
        }
      });
    }

    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Restore Stock (for cancelled orders)
 */
exports.restoreStock = async (productId, variantId, quantity, reason = 'Order cancelled') => {
  try {
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId }
      });

      await prisma.productVariant.update({
        where: { id: variantId },
        data: { stock: { increment: quantity } }
      });

      await prisma.stockMovement.create({
        data: {
          productId,
          variantId,
          type: 'RETURN',
          quantity: quantity,
          previousQty: variant.stock,
          newQty: variant.stock + quantity,
          reason
        }
      });
    } else {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      await prisma.product.update({
        where: { id: productId },
        data: {
          stock: { increment: quantity },
          soldCount: { decrement: quantity }
        }
      });

      await prisma.stockMovement.create({
        data: {
          productId,
          type: 'RETURN',
          quantity: quantity,
          previousQty: product.stock,
          newQty: product.stock + quantity,
          reason
        }
      });
    }

    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = exports;