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
                totalCost: itemTotal
            });
        }

        // 2. Generate PO Number
        const purchaseNumber = `PO-${Date.now()}`;

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
                        create: purchaseItemsData
                    }
                },
                include: { items: true }
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
                            data: { stock: { increment: item.quantity } }
                        });
                        newStockQty = previousQty + item.quantity;
                    } else {
                        const product = await tx.product.findUnique({ where: { id: item.productId } });
                        previousQty = product.stock;
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { stock: { increment: item.quantity } }
                        });
                        newStockQty = previousQty + item.quantity;
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
                            performedBy: req.user.id
                        }
                    });
                }
            }

            return newPurchase;
        });

        res.status(201).json({
            success: true,
            data: purchase,
            message: 'Purchase recorded successfully'
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
                    _count: { select: { items: true } }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.purchase.count()
        ]);

        res.status(200).json({
            success: true,
            data: purchases,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit))
            }
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
                        variant: { select: { name: true, sku: true } }
                    }
                },
                stockMovements: true
            }
        });

        if (!purchase) {
            return errorResponse(res, { statusCode: 404, message: 'Purchase not found' });
        }

        res.status(200).json({
            success: true,
            data: purchase
        });
    } catch (error) {
        next(error);
    }
};
