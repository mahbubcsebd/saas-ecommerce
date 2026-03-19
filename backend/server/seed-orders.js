const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  const products = await prisma.product.findMany({ include: { variants: true }, take: 5 });

  if (users.length === 0 || products.length === 0) {
    console.log('No users or products found');
    return;
  }

  const normalUser = users.find((u) => u.role === 'USER') || users[0];
  console.log(`Using user: ${normalUser.email}`);

  const product = products[0];
  const variant = product.variants[0];
  const quantity = 1;
  const price = variant ? variant.sellingPrice || product.sellingPrice : product.sellingPrice;
  const total = price * quantity;

  const orderItem = {
    productId: product.id,
    variantId: variant?.id,
    name: product.name,
    unitPrice: price,
    salePrice: price,
    quantity,
    total,
  };

  try {
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-TEST-${Date.now()}`,
        userId: normalUser.id,
        items: { create: [orderItem] },
        subtotal: total,
        total: total + 60,
        shippingCost: 60,
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        status: 'PENDING',
        shippingAddress: {
          name: normalUser.firstName,
          address: '123 Test St',
          city: 'Dhaka',
          phone: '01700000000',
        },
      },
    });
    console.log('✅ Order created:', order.id);
  } catch (e) {
    console.error('❌ Order creation failed:', e);
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
