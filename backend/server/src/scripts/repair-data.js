const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function aggressiveRepair() {
    try {
        console.log('🚧 Aggressive Repair started...');

        // Fields to check and fix
        const fields = [
            'productName', 'quantity', 'unitPrice', 'totalPrice',
            'orderId', 'productId', 'createdAt', 'updatedAt'
        ];

        const updates = fields.map(field => ({
            q: { [field]: null },
            u: { $set: { [field]: field.includes('Price') || field === 'quantity' ? 0 : (field.includes('At') ? new Date() : (field.includes('Id') ? '000000000000000000000000' : 'Unknown')) } },
            multi: true
        }));

        await prisma.$runCommandRaw({
            update: "OrderItem",
            updates: updates
        });

        console.log('✅ Update finished. Syncing soldCounts...');

        // Re-run sync-sold-counts logic (embedded)
        const orders = await prisma.order.findMany({ where: { status: { not: 'CANCELLED' } }, select: { id: true } });
        const validOrderIds = new Set(orders.map(o => o.id));

        // Reset
        await prisma.product.updateMany({ data: { soldCount: 0 } });

        const allItems = await prisma.orderItem.findMany(); // This SHOULD work now!
        const productSales = {};
        allItems.forEach(item => {
            if (validOrderIds.has(item.orderId) && item.productId) {
                productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
            }
        });

        for (const [productId, count] of Object.entries(productSales)) {
            try {
                await prisma.product.update({ where: { id: productId }, data: { soldCount: count } });
            } catch (err) {}
        }

        console.log('✨ Done!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Aggressive Repair failed:', e);
        process.exit(1);
    }
}

aggressiveRepair();
