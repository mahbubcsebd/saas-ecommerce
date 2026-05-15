const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedOrders() {
  console.log('🌱 Seeding Orders...');

  const customer = await prisma.user.findUnique({ where: { email: 'customer@mahbubshop.com' } });
  const product = await prisma.product.findUnique({ where: { slug: 'iphone-15-pro' } });

  if (!customer || !product) {
    console.log('⚠️ Missing customer or product, skipping orders seed.');
    return;
  }

  const order = await prisma.order.create({
    data: {
      orderNumber: 'ORD-' + Math.floor(Math.random() * 1000000),
      source: 'ONLINE',
      userId: customer.id,
      subtotal: product.sellingPrice,
      shippingCost: 60,
      total: product.sellingPrice + 60,
      dueAmount: 0,
      paymentStatus: 'PAID',
      status: 'DELIVERED',
      paymentMethod: 'ONLINE',
      shippingAddress: {
        name: customer.firstName,
        address: 'Dhaka',
        phone: '01700000000'
      },
      items: {
        create: [
          {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            unitPrice: product.sellingPrice,
            totalPrice: product.sellingPrice
          }
        ]
      }
    }
  });

  console.log(`✅ Orders Seeded! (${order.orderNumber})`);
}

if (require.main === module) {
  seedOrders().catch(console.error).finally(() => prisma.$disconnect());
}

module.exports = seedOrders;
