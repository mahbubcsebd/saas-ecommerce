const prisma = require('../config/prisma');

// ============================================================
// GET /api/v1/wishlist/admin/analytics
// Summary stats + popular items + customer lists + stock alerts
// ============================================================
exports.getWishlistAnalytics = async (req, res) => {
    try {
        const { page = 1, limit = 15 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // ── 1. KPI Summary ──────────────────────────────────────
        const [totalWishlistItems, uniqueCustomers] = await Promise.all([
            prisma.wishlist.count(),
            prisma.wishlist.groupBy({ by: ['userId'] }).then(r => r.length),
        ]);

        // ── 2. Popular Products (grouped by productId, sorted by count) ──
        const popularRaw = await prisma.wishlist.groupBy({
            by: ['productId'],
            _count: { productId: true },
            orderBy: { _count: { productId: 'desc' } },
            take: 10,
        });

        const popularProductIds = popularRaw.map(p => p.productId);
        const popularProducts = await prisma.product.findMany({
            where: { id: { in: popularProductIds } },
            select: {
                id: true,
                name: true,
                sku: true,
                images: true,
                stock: true,
                sellingPrice: true,
                category: { select: { name: true } },
            },
        });

        // Merge wishlist count with product data
        const popularWithCount = popularRaw.map(item => {
            const product = popularProducts.find(p => p.id === item.productId);
            return {
                ...product,
                wishlistCount: item._count.productId,
            };
        }).filter(p => p.id); // filter out any deleted products

        // ── 3. Out-of-Stock Alerts (wishlisted products with stock <= 0) ──
        const outOfStockAlerts = await prisma.wishlist.findMany({
            where: {
                product: { stock: { lte: 5 } }
            },
            include: {
                product: { select: { id: true, name: true, sku: true, stock: true, images: true } },
            },
            distinct: ['productId'],
        });

        // ── 4. All customer wishlists (paginated) ──
        const [allWishlists, totalCount] = await Promise.all([
            prisma.wishlist.findMany({
                orderBy: { createdAt: 'desc' },
                include: {
                    product: { select: { id: true, name: true, sku: true, images: true, stock: true, sellingPrice: true } },
                    user: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
                skip,
                take: parseInt(limit),
            }),
            prisma.wishlist.count(),
        ]);

        // ── 5. Unique out-of-stock count ──
        const outOfStockCount = await prisma.wishlist.groupBy({
            by: ['productId'],
            where: { product: { stock: { lte: 0 } } },
        }).then(r => r.length);

        return res.status(200).json({
            success: true,
            summary: {
                totalWishlistItems,
                uniqueCustomers,
                outOfStockCount,
            },
            popularProducts: popularWithCount,
            outOfStockAlerts: outOfStockAlerts.map(w => w.product),
            data: allWishlists,
            pagination: {
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(totalCount / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('getWishlistAnalytics error:', error);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
};
