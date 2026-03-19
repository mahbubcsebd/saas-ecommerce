const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const recentEvents = await prisma.analyticsEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log('Recent Analytics Events:');
  console.log(JSON.stringify(recentEvents, null, 2));

  const count = await prisma.analyticsEvent.count();
  console.log('Total Events in DB:', count);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
