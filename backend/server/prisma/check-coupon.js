const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const coupon = await prisma.discount.findFirst({
    where: { code: 'WELCOME10' },
  });
  console.log('Coupon in DB:', coupon);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
