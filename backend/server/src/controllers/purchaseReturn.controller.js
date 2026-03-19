const prisma = require('../config/prisma');
const { errorResponse } = require('../helpers/responseHandler');

/**
 * Create Purchase Return
 */
exports.createPurchaseReturn = async (req, res, next) => {
  try {
    const { purchaseId, supplierId, items, notes } = req.body;
    // items: [{ productId, variantId, quantity, unitCost }]

    const returnNumber = `PR-${Date.now()}`;
    let totalAmount = 0;
    const returnItemsData = [];

    for (const item of items) {
      const itemTotal = item.quantity * item.unitCost;
      totalAmount += itemTotal;
      returnItemsData.push({
        productId: item.productId,
        variantId: item.variantId || null,
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: itemTotal,
      });
    }

    const purchaseReturn = await prisma.$transaction(async (tx) => {
      // 1. Create Purchase Return record
      const newReturn = await tx.purchaseReturn.create({
        data: {
          returnNumber,
          purchaseId: purchaseId || null,
          supplierId,
          totalAmount,
          status: 'COMPLETED',
          notes,
          items: {
            create: returnItemsData,
          },
        },
        include: { items: true },
      });

      // 2. Adjust Stock (Decrement) and Record Movement
      for (const item of items) {
        let previousQty = 0;
        let newStockQty = 0;

        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          previousQty = variant.stock;
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
          newStockQty = previousQty - item.quantity;
        } else {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          previousQty = product.stock;
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
          newStockQty = previousQty - item.quantity;
        }

        // Create Stock Movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            variantId: item.variantId || null,
            type: 'PURCHASE_RETURN',
            quantity: -item.quantity,
            previousQty,
            newQty: newStockQty,
            reason: `Purchase Return ${returnNumber}`,
            purchaseId: purchaseId || null,
            purchaseReturnId: newReturn.id,
            supplierId,
            performedBy: req.user.id,
          },
        });
      }

      // --- SUPPLIER LEDGER LOGIC ---
      const supplier = await tx.supplier.findUnique({ where: { id: supplierId } });
      const previousBalance = supplier.dueBalance || 0;
      const newBalance = previousBalance - totalAmount;

      // 1. Update Supplier Balance
      await tx.supplier.update({
        where: { id: supplierId },
        data: { dueBalance: newBalance },
      });

      // 2. Create Transaction Record
      await tx.supplierTransaction.create({
        data: {
          supplierId,
          type: 'PURCHASE_RETURN',
          amount: -totalAmount, // Negative for return
          balanceAfter: newBalance,
          referenceId: newReturn.id,
          purchaseReturnId: newReturn.id,
          notes: `Purchase Return ${returnNumber}`,
        },
      });
      // -----------------------------

      return newReturn;
    });

    res.status(201).json({
      success: true,
      data: purchaseReturn,
      message: 'Purchase return created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Purchase Returns
 */
exports.getPurchaseReturns = async (req, res, next) => {
  try {
    const returns = await prisma.purchaseReturn.findMany({
      include: {
        supplier: { select: { name: true } },
        purchase: { select: { purchaseNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: returns,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Purchase Return
 */
exports.getPurchaseReturn = async (req, res, next) => {
  try {
    const { id } = req.params;
    const purchaseReturn = await prisma.purchaseReturn.findUnique({
      where: { id },
      include: {
        supplier: true,
        purchase: true,
        items: {
          include: {
            product: { select: { name: true, images: true } },
            variant: { select: { name: true } },
          },
        },
      },
    });

    if (!purchaseReturn) {
      return errorResponse(res, { statusCode: 404, message: 'Purchase return not found' });
    }

    res.status(200).json({
      success: true,
      data: purchaseReturn,
    });
  } catch (error) {
    next(error);
  }
};
