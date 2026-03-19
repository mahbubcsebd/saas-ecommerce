const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function robustSync() {
  try {
    console.log('🚀 Starting Robust Sync...');

    // 1. Get all OrderItem IDs using runCommandRaw to avoid parsing issues
    const rawItems = await prisma.$runCommandRaw({
      find: 'OrderItem',
      projection: { _id: 1, orderId: 1, productId: 1, quantity: 1 },
    });

    const items = rawItems.cursor.firstBatch.concat(rawItems.cursor.nextBatch || []);
    console.log(`📦 Analyzed ${items.length} raw items from MongoDB`);

    // 2. Map Valid Orders
    const orders = await prisma.order.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: { id: true },
    });
    const validOrderIds = new Set(orders.map((o) => o.id));

    const productSales = {};

    // 3. Process raw items
    items.forEach((item) => {
      const orderId = item.orderId?.$oid || item.orderId;
      const productId = item.productId?.$oid || item.productId;
      const quantity = item.quantity || 0;

      if (validOrderIds.has(orderId) && productId) {
        productSales[productId] = (productSales[productId] || 0) + quantity;
      }
    });

    // 4. Update products
    await prisma.product.updateMany({ data: { soldCount: 0 } });
    let updatedCount = 0;
    for (const [productId, count] of Object.entries(productSales)) {
      try {
        await prisma.product.update({
          where: { id: productId },
          data: { soldCount: count },
        });
        updatedCount++;
      } catch (err) {}
    }

    console.log(`✨ Successfully synced ${updatedCount} products!`);
    process.exit(0);
  } catch (e) {
    console.error('❌ Robust Sync failed:', e);
    process.exit(1);
  }
}

robustSync();
