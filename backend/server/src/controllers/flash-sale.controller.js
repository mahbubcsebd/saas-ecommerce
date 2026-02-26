const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── CREATE ──────────────────────────────────────────────────────────────────
exports.createFlashSale = async (req, res) => {
    try {
        const { name, description, startDate, endDate, isActive, products } = req.body;

        if (!name) return res.status(400).json({ success: false, message: 'Name is required.' });
        if (!startDate || !endDate) return res.status(400).json({ success: false, message: 'Start and End dates are required.' });

        // Create FlashSale with FlashSaleProducts
        const flashSale = await prisma.flashSale.create({
            data: {
                name,
                description,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isActive: isActive !== undefined ? isActive : true,
                products: {
                    create: (products || []).map(p => ({
                        productId: p.productId,
                        discountType: p.discountType || 'PERCENTAGE',
                        discountValue: parseFloat(p.discountValue),
                        salePrice: parseFloat(p.salePrice),
                        stockLimit: p.stockLimit ? parseInt(p.stockLimit) : 0
                    }))
                }
            },
            include: { products: true }
        });

        res.status(201).json({ success: true, data: flashSale });
    } catch (error) {
        console.error('FlashSale Create Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── READ (ALL) ──────────────────────────────────────────────────────────────
exports.getAllFlashSales = async (req, res) => {
    try {
        const { search, status } = req.query;
        const now = new Date();

        let where = {};
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        if (status === 'active') {
            where.isActive = true;
            where.startDate = { lte: now };
            where.endDate = { gte: now };
        } else if (status === 'upcoming') {
            where.startDate = { gt: now };
        } else if (status === 'expired') {
            where.endDate = { lt: now };
        }

        const sales = await prisma.flashSale.findMany({
            where,
            include: {
                _count: { select: { products: true } }
            },
            orderBy: { startDate: 'desc' }
        });

        res.json({ success: true, data: sales });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── READ (SINGLE) ───────────────────────────────────────────────────────────
exports.getFlashSale = async (req, res) => {
    try {
        const { id } = req.params;
        const sale = await prisma.flashSale.findUnique({
            where: { id },
            include: {
                products: {
                    include: { product: { select: { name: true, basePrice: true, images: true, category: { select: { name: true } } } } }
                }
            }
        });

        if (!sale) return res.status(404).json({ success: false, message: 'Flash sale not found.' });
        res.json({ success: true, data: sale });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── UPDATE ──────────────────────────────────────────────────────────────────
exports.updateFlashSale = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, startDate, endDate, isActive, products } = req.body;

        // Transaction to ensure atomicity
        const updated = await prisma.$transaction(async (tx) => {
            // 1. Update FlashSale info
            const sale = await tx.flashSale.update({
                where: { id },
                data: {
                    ...(name && { name }),
                    ...(description !== undefined && { description }),
                    ...(startDate && { startDate: new Date(startDate) }),
                    ...(endDate && { endDate: new Date(endDate) }),
                    ...(isActive !== undefined && { isActive }),
                }
            });

            // 2. Update products if provided
            if (products) {
                // Delete existing ones
                await tx.flashSaleProduct.deleteMany({ where: { flashSaleId: id } });
                // Create new ones
                await tx.flashSaleProduct.createMany({
                    data: products.map(p => ({
                        flashSaleId: id,
                        productId: p.productId,
                        discountType: p.discountType || 'PERCENTAGE',
                        discountValue: parseFloat(p.discountValue),
                        salePrice: parseFloat(p.salePrice),
                        stockLimit: p.stockLimit ? parseInt(p.stockLimit) : 0
                    }))
                });
            }

            return tx.flashSale.findUnique({
                where: { id },
                include: { products: true }
            });
        });

        res.json({ success: true, data: updated });
    } catch (error) {
        console.error('FlashSale Update Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── DELETE ──────────────────────────────────────────────────────────────────
exports.deleteFlashSale = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.flashSale.delete({ where: { id } });
        res.json({ success: true, message: 'Flash sale deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─── TOGGLE ──────────────────────────────────────────────────────────────────
exports.toggleFlashSale = async (req, res) => {
    try {
        const { id } = req.params;
        const sale = await prisma.flashSale.findUnique({ where: { id } });
        if (!sale) return res.status(404).json({ success: false, message: 'Flash sale not found.' });

        const updated = await prisma.flashSale.update({
            where: { id },
            data: { isActive: !sale.isActive }
        });

        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
