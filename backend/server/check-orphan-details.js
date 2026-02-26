const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orphanOrders = await prisma.order.findMany({
    where: {
      userId: null,
    },
    select: {
        id: true,
        orderNumber: true,
        guestInfo: true,
        walkInName: true,
        walkInPhone: true
    }
  });

  console.log(JSON.stringify(orphanOrders, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
