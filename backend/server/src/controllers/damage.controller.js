const prisma = require('../config/prisma');
const logger = require('../utils/logger');

// @desc    Create a new damage report
// @route   POST /api/v1/inventory/damage
// @access  Private/Admin/Manager
exports.createDamageReport = async (req, res, next) => {
    try {
        const { productId, variantId, quantity, reason, notes } = req.body;

        if (!productId || !quantity || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Please provide productId, quantity, and reason',
            });
        }

        // 1. Fetch the product/variant to verify stock and getting cost price
        let item;
        if (variantId) {
            item = await prisma.productVariant.findUnique({
                where: { id: variantId },
                include: { product: { select: { name: true } } }
            });
            if (!item) return res.status(404).json({ success: false, message: 'Variant not found' });
        } else {
            item = await prisma.product.findUnique({
                where: { id: productId }
            });
            if (!item) return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (item.stock < quantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock. Current stock: ${item.stock}`,
            });
        }

        // Calculate loss amount using cost price (fallback to 0 if not available)
        const costPrice = item.costPrice || 0;
        const lossAmount = quantity * costPrice;

        // 2. Perform transaction: Update stock, Create StockMovement, Create DamageReport
        const result = await prisma.$transaction(async (tx) => {
            // Update stock
            let updatedItem;
            if (variantId) {
                updatedItem = await tx.productVariant.update({
                    where: { id: variantId },
                    data: { stock: { decrement: quantity } }
                });
            } else {
                updatedItem = await tx.product.update({
                    where: { id: productId },
                    data: { stock: { decrement: quantity } }
                });
            }

            // Create StockMovement
            await tx.stockMovement.create({
                data: {
                    productId,
                    variantId: variantId || null,
                    type: 'DAMAGE',
                    quantity: -quantity,
                    previousQty: item.stock,
                    newQty: item.stock - quantity,
                    reason: `Damage Report: ${reason}`,
                    notes,
                    performedBy: req.user?.id || null
                }
            });

            // Create DamageReport
            const report = await tx.damageReport.create({
                data: {
                    productId,
                    variantId: variantId || null,
                    quantity,
                    reason,
                    notes,
                    lossAmount,
                    reportedById: req.user?.id || null
                },
                include: {
                    product: { select: { name: true } },
                    variant: { select: { name: true } }
                }
            });

            return report;
        });

        res.status(201).json({
            success: true,
            data: result,
        });

    } catch (error) {
        logger.error(`Create Damage Report Error: ${error.message}`);
        next(error);
    }
};

// @desc    Get all damage reports
// @route   GET /api/v1/inventory/damage
// @access  Private/Admin/Manager
exports.getDamageReports = async (req, res, next) => {
    try {
        const { reason, productId, startDate, endDate } = req.query;

        const where = {};
        if (reason) where.reason = reason;
        if (productId) where.productId = productId;
        if (startDate || endDate) {
            where.reportedAt = {};
            if (startDate) where.reportedAt.gte = new Date(startDate);
            if (endDate) where.reportedAt.lte = new Date(endDate);
        }

        const reports = await prisma.damageReport.findMany({
            where,
            include: {
                product: { select: { name: true, sku: true } },
                variant: { select: { name: true, sku: true } },
                reportedBy: { select: { firstName: true, lastName: true } }
            },
            orderBy: { reportedAt: 'desc' }
        });

        // Summary calculations
        const summary = reports.reduce((acc, report) => {
            acc.totalQuantity += report.quantity;
            acc.totalLossAmount += report.lossAmount;
            return acc;
        }, { totalQuantity: 0, totalLossAmount: 0 });

        res.status(200).json({
            success: true,
            count: reports.length,
            summary,
            data: reports,
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get damage report summary
// @route   GET /api/v1/inventory/damage/summary
// @access  Private/Admin/Manager
exports.getDamageSummary = async (req, res, next) => {
    try {
        const stats = await prisma.damageReport.groupBy({
            by: ['reason'],
            _sum: {
                quantity: true,
                lossAmount: true
            }
        });

        const totals = stats.reduce((acc, s) => {
            acc.totalQuantity += s._sum.quantity || 0;
            acc.totalLossAmount += s._sum.lossAmount || 0;
            return acc;
        }, { totalQuantity: 0, totalLossAmount: 0 });

        res.status(200).json({
            success: true,
            data: {
                byReason: stats,
                totals
            }
        });
    } catch (error) {
        next(error);
    }
};
