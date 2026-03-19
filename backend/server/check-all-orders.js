const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany();
  fs.writeFileSync('all-orders-debug.json', JSON.stringify(orders, null, 2));
  console.log('Written to all-orders-debug.json');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
