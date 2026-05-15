const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDiscounts() {
  console.log('🌱 Seeding Discounts...');

  const discount = await prisma.discount.upsert({
    where: { code: 'WELCOME50' },
    update: {},
    create: {
      name: 'Welcome Bonus',
      code: 'WELCOME50',
      type: 'FLAT',
      applicableOn: 'CART',
      value: 50,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      isActive: true,
      usageLimit: 100,
      minOrderValue: 500
    }
  });

  console.log(`✅ Discounts Seeded! (${discount.code})`);
  return discount;
}

if (require.main === module) {
  seedDiscounts().catch(console.error).finally(() => prisma.$disconnect());
}

module.exports = seedDiscounts;
