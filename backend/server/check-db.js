const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const categories = await prisma.category.count();
  const products = await prisma.product.count();
  const orders = await prisma.order.count();
  const reviews = await prisma.review.count();
  const shippingZones = await prisma.shippingZone.count();
  const suppliers = await prisma.supplier.count();

  console.log({
    users,
    categories,
    products,
    orders,
    reviews,
    shippingZones,
    suppliers
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
