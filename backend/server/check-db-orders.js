const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, username: true }
  });

  const orders = await prisma.order.findMany({
    select: { id: true, userId: true, orderNumber: true, total: true, source: true }
  });

  const result = {
    users,
    orders,
    ordersWithNoUser: orders.filter(o => !o.userId).length,
    userIdsInOrders: [...new Set(orders.map(o => o.userId).filter(Boolean))]
  };

  fs.writeFileSync('db-check-results.json', JSON.stringify(result, null, 2));
  console.log("Results written to db-check-results.json");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
