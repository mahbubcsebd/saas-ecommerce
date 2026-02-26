const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findBadData() {
    console.log('🔍 Searching for problematic OrderItems...');

    // Attempt to fetch in small batches to narrow down
    const count = await prisma.orderItem.count();
    console.log(`Total OrderItems: ${count}`);

    for (let i = 0; i < count; i++) {
        try {
            await prisma.orderItem.findMany({
                take: 1,
                skip: i
            });
        } catch (err) {
            console.error(`❌ Found error at index ${i}`);
            console.error(err);
            // We can't easily "see" the raw data here if it fails parsing,
            // but we know skip: i is where it fails.
        }
    }
}

async function syncSoldCountRaw() {
    try {
        console.log('🔄 Starting soldCount sync (Raw Query Mode)...');

        // Reset
        await prisma.product.updateMany({ data: { soldCount: 0 } });

        // Use Raw query to bypass Prisma schema validation for fetching
        // Note: Prisma MongoDB doesn't support $queryRaw for find yet in some versions,
        // but we can try $runCommandRaw if needed.
        // However, let's try to fetch Order and Items using findMany but avoiding the culprit if possible.

        const orders = await prisma.order.findMany({
             where: { status: { not: 'CANCELLED' } },
             select: { id: true }
        });
        const validOrderIds = new Set(orders.map(o => o.id));

        // If findMany on OrderItem fails, we'll try to use the Order Items relation from Order side
        // But that also uses OrderItem model.

        const productSales = {};
        for (const order of orders) {
            try {
                // Try fetching items for this specific order
                const items = await prisma.orderItem.findMany({
                    where: { orderId: order.id }
                });

                items.forEach(item => {
                    if (item.productId) {
                        productSales[item.productId] = (productSales[item.productId] || 0) + item.quantity;
                    }
                });
            } catch (err) {
                console.warn(`⚠️ Skipping corrupted items for Order ${order.id}`);
            }
        }

        const productIds = Object.keys(productSales);
        let updatedCount = 0;
        for (const productId of productIds) {
            try {
                await prisma.product.update({
                    where: { id: productId },
                    data: { soldCount: productSales[productId] }
                });
                updatedCount++;
            } catch (err) {}
        }

        console.log(`✨ Successfully synced ${updatedCount} products`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Final Sync failure:', error);
        process.exit(1);
    }
}

syncSoldCountRaw();
