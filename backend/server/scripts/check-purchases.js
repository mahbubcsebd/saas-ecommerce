const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const purchases = await prisma.analyticsEvent.findMany({
    where: { eventName: 'purchase' },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log('Recent Purchase Events:');
  console.log(JSON.stringify(purchases, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
