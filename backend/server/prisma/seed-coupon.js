const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const coupon = await prisma.discount.upsert({
    where: { code: 'WELCOME10' },
    update: {
      isActive: true,
      usageLimit: 1000,
      minOrderValue: 500,
    },
    create: {
      name: 'Welcome Discount',
      code: 'WELCOME10',
      type: 'PERCENTAGE',
      applicableOn: 'CART',
      value: 10,
      description: '10% off for new users',
      isActive: true,
      startDate: new Date(),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      usageLimit: 1000,
      minOrderValue: 500,

      // Default empty arrays for array fields to avoid null issues if schema requires them
      categoryIds: [],
      brandNames: [],
      allowedCountries: [],
      excludedProducts: [],
      allowedUserIds: [],
    },
  });
  console.log('Coupon created:', coupon);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
