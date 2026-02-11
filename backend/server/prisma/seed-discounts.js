const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('💰 Seeding Discounts...');

  // 1. Clear existing discounts
  try {
      await prisma.discount.deleteMany();
      console.log('🗑️  Cleared existing discounts.');
  } catch (e) {
      console.log('⚠️  No discounts to clear.');
  }

  // 2. Get some IDs for targeting
  const electronicsParams = await prisma.category.findUnique({ where: { slug: 'electronics' } });
  const fashionParams = await prisma.category.findUnique({ where: { slug: 'fashion' } });

  const iphone = await prisma.product.findUnique({ where: { slug: 'iphone-15-pro-max' } });

  const discounts = [
    {
      code: 'SUMMER2026',
      description: 'Summer Sale - 10% Off All Electronics',
      type: 'PERCENTAGE',
      value: 10,
      startDate: new Date(),
      endDate: new Date('2026-12-31'),
      isActive: true,
      categoryId: electronicsParams?.id
    },
    {
      code: 'FLAT50',
      description: 'Flat $50 Off iPhone 15 Pro Max',
      type: 'FLAT',
      value: 50,
      startDate: new Date(),
      isActive: true,
      productId: iphone?.id
    },
    {
      code: 'NIKE20',
      description: '20% Off All Nike Products',
      type: 'PERCENTAGE',
      value: 20,
      startDate: new Date(),
      isActive: true,
      brand: 'Nike' // Ensure we have products with brand 'Nike' or change to 'Apple' for testing
    },
    {
       code: 'APPLE15',
       description: '15% Off All Apple Products',
       type: 'PERCENTAGE',
       value: 15,
       startDate: new Date(),
       isActive: true,
       brand: 'Apple'
    }
  ];

  for (const discount of discounts) {
    if ((discount.categoryId && !electronicsParams) || (discount.productId && !iphone)) {
        console.log(`⚠️  Skipping discount ${discount.code} due to missing target.`);
        continue;
    }

    try {
        await prisma.discount.create({ data: discount });
        console.log(`✅ Created discount: ${discount.code} (${discount.description})`);
    } catch (e) {
        console.error(`❌ Failed to create ${discount.code}:`, e.message);
    }
  }

  console.log('💰 Discount seeding completed!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
