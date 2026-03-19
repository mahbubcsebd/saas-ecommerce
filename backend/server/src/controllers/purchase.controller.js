const prisma = require('../config/prisma');
const { errorResponse } = require('../helpers/responseHandler');

/**
 * Create Purchase (PO)
 */
exports.createPurchase = async (req, res, next) => {
  try {
    const { supplierId, items, paymentStatus, notes, receivedAt } = req.body;
    // items: [{ productId, variantId, quantity, unitCost }]

    // 1. Calculate Totals
    let totalCost = 0;
    const purchaseItemsData = [];

    for (const item of items) {
      const itemTotal = item.quantity * item.unitCost;
      totalCost += itemTotal;

      purchaseItemsData.push({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: itemTotal,
      });
    }

    // 2. Generate PO Number
    const purchaseNumber = `PO-${Date.now()}`;

    const backInStockProducts = new Set();

    // 3. Create Purchase Transaction
    const purchase = await prisma.$transaction(async (tx) => {
      // Create Purchase record
      const newPurchase = await tx.purchase.create({
        data: {
          purchaseNumber,
          supplierId,
          totalCost,
          status: 'RECEIVED', // Assuming direct receive for now, or use 'PENDING'
          notes,
          receivedAt: receivedAt ? new Date(receivedAt) : new Date(),
          createdBy: req.user.id,
          items: {
            create: purchaseItemsData,
          },
        },
        include: { items: true },
      });

      // If status is RECEIVED, update inventory immediately
      if (newPurchase.status === 'RECEIVED') {
        for (const item of items) {
          // Update Product/Variant Stock
          let previousQty = 0;
          let newStockQty = 0;

          if (item.variantId) {
            const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
            previousQty = variant.stock;
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
            newStockQty = previousQty + item.quantity;
            // Track parent product back-in-stock
            const parent = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stock: true },
            });
            const prevParentStock = parent?.stock || 0;
            const updatedParent = await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
            if (prevParentStock === 0 && updatedParent.stock > 0) {
              backInStockProducts.add(item.productId);
            }
          } else {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            previousQty = product.stock;
            const updated = await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
            newStockQty = previousQty + item.quantity;
            if ((previousQty || 0) === 0 && (updated.stock || 0) > 0) {
              backInStockProducts.add(item.productId);
            }
          }

          // Create Stock Movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              variantId: item.variantId || null,
              type: 'PURCHASE',
              quantity: item.quantity,
              previousQty,
              newQty: newStockQty,
              reason: `Purchase Order ${newPurchase.purchaseNumber}`,
              purchaseId: newPurchase.id,
              supplierId: supplierId,
              performedBy: req.user.id,
            },
          });
        }
      }

      // --- SUPPLIER LEDGER LOGIC ---
      if (newPurchase.status === 'RECEIVED') {
        const supplier = await tx.supplier.findUnique({ where: { id: supplierId } });
        const previousBalance = supplier.dueBalance || 0;
        const newBalance = previousBalance + totalCost;

        // 1. Update Supplier Balance
        await tx.supplier.update({
          where: { id: supplierId },
          data: { dueBalance: newBalance },
        });

        // 2. Create Transaction Record
        await tx.supplierTransaction.create({
          data: {
            supplierId,
            type: 'PURCHASE',
            amount: totalCost,
            balanceAfter: newBalance,
            referenceId: newPurchase.id,
            purchaseId: newPurchase.id,
            notes: `Purchase Order ${purchaseNumber}`,
          },
        });
      }
      // -----------------------------

      return newPurchase;
    });

    // Notify wishlisters for back-in-stock products
    try {
      if (backInStockProducts.size > 0) {
        const { sendNotification } = require('./notification.controller');
        for (const pid of backInStockProducts) {
          const product = await prisma.product.findUnique({
            where: { id: pid },
            select: { id: true, name: true, slug: true },
          });
          if (!product) continue;
          const wishlists = await prisma.wishlist.findMany({
            where: { productId: pid },
            select: { userId: true },
          });
          const url = `/products/${product.slug || product.id}`;
          for (const w of wishlists) {
            await sendNotification(w.userId, {
              type: 'PRODUCT_BACK_IN_STOCK',
              title: 'Back in Stock',
              message: `${product.name} is back in stock`,
              data: { productId: pid, slug: product.slug, url },
            });
          }
        }
      }
    } catch (notifyErr) {
      console.warn('Purchase back-in-stock notify error:', notifyErr?.message || notifyErr);
    }

    res.status(201).json({
      success: true,
      data: purchase,
      message: 'Purchase recorded successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Purchases
 */
exports.getPurchases = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        skip,
        take: parseInt(limit),
        include: {
          supplier: { select: { name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.purchase.count(),
    ]);

    res.status(200).json({
      success: true,
      data: purchases,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Purchase
 */
exports.getPurchase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: { select: { name: true, slug: true } },
            variant: { select: { name: true, sku: true } },
          },
        },
        stockMovements: true,
      },
    });

    if (!purchase) {
      return errorResponse(res, { statusCode: 404, message: 'Purchase not found' });
    }

    res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Purchase (Supplier, Items, Status, etc.)
 */
exports.updatePurchase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { supplierId, items, status, notes, receivedAt } = req.body;

    const existingPurchase = await prisma.purchase.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingPurchase) {
      return errorResponse(res, { statusCode: 404, message: 'Purchase not found' });
    }

    const updatedPurchase = await prisma.$transaction(async (tx) => {
      // 1. Rollback Stock if old status was RECEIVED
      if (existingPurchase.status === 'RECEIVED') {
        for (const item of existingPurchase.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } },
            });
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }
        // Delete old stock movements for this purchase to keep it clean (or we could add new ones)
        await tx.stockMovement.deleteMany({ where: { purchaseId: id } });
      }

      // 2. Delete old items
      await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });

      // 3. Calculate new total cost and prepare new items
      let totalCost = 0;
      const newItemsData = [];
      for (const item of items) {
        const itemTotal = item.quantity * item.unitCost;
        totalCost += itemTotal;
        newItemsData.push({
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: itemTotal,
        });
      }

      // 4. Update Purchase Record
      const purchase = await tx.purchase.update({
        where: { id },
        data: {
          supplierId,
          status,
          totalCost,
          notes,
          receivedAt: receivedAt ? new Date(receivedAt) : existingPurchase.receivedAt,
          items: {
            create: newItemsData,
          },
        },
        include: { items: true },
      });

      // 5. Apply Stock if new status is RECEIVED
      if (status === 'RECEIVED') {
        for (const item of items) {
          let previousQty = 0;
          let newStockQty = 0;

          if (item.variantId) {
            const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
            previousQty = variant.stock;
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
            newStockQty = previousQty + item.quantity;
          } else {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            previousQty = product.stock;
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
            newStockQty = previousQty + item.quantity;
          }

          // Create new Stock Movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              variantId: item.variantId || null,
              type: 'PURCHASE',
              quantity: item.quantity,
              previousQty,
              newQty: newStockQty,
              reason: `Purchase Order ${purchase.purchaseNumber} Updated/Received`,
              purchaseId: purchase.id,
              performedBy: req.user.id,
            },
          });
        }
      }

      // --- SUPPLIER LEDGER LOGIC ---
      // If status changed to RECEIVED, or if already RECEIVED and items changed, reconciliation is needed.
      // My implementation of updatePurchase already rolls back stock if it was RECEIVED.
      // I should also roll back the ledger effect if it was RECEIVED, and apply new effect.

      if (existingPurchase.status === 'RECEIVED') {
        // Remove old transaction and subtract old cost from balance
        await tx.supplierTransaction.deleteMany({ where: { purchaseId: id } });
        await tx.supplier.update({
          where: { id: existingPurchase.supplierId },
          data: { dueBalance: { decrement: existingPurchase.totalCost } },
        });
      }

      if (status === 'RECEIVED') {
        const supplier = await tx.supplier.findUnique({ where: { id: supplierId } });
        const currentBalance = supplier.dueBalance || 0;
        const newBalance = currentBalance + totalCost;

        await tx.supplier.update({
          where: { id: supplierId },
          data: { dueBalance: newBalance },
        });

        await tx.supplierTransaction.create({
          data: {
            supplierId,
            type: 'PURCHASE',
            amount: totalCost,
            balanceAfter: newBalance,
            referenceId: purchase.id,
            purchaseId: purchase.id,
            notes: `Purchase Order ${purchase.purchaseNumber} Updated`,
          },
        });
      }
      // -----------------------------

      return purchase;
    });

    res.status(200).json({
      success: true,
      data: updatedPurchase,
      message: 'Purchase updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Purchase (with Stock Rollback)
 */
exports.deletePurchase = async (req, res, next) => {
  try {
    const { id } = req.params;

    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Rollback Stock if RECEIVED
      if (purchase.status === 'RECEIVED') {
        for (const item of purchase.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } },
            });
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }
      }

      // 2. Delete Stock Movements
      await tx.stockMovement.deleteMany({
        where: { purchaseId: id },
      });

      // 3. Delete Purchase Items
      await tx.purchaseItem.deleteMany({
        where: { purchaseId: id },
      });

      // 4. Delete Purchase
      await tx.purchase.delete({
        where: { id },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Purchase Order deleted and stock rolled back successfully',
    });
  } catch (error) {
    next(error);
  }
};
