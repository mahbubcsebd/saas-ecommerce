const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedProducts() {
  console.log('🌱 Seeding Products...');

  // Get categories first
  let smartphoneCat = await prisma.category.findUnique({ where: { slug: 'smartphones' } });
  if (!smartphoneCat) {
    smartphoneCat = await prisma.category.create({
      data: { name: 'Smartphones', slug: 'smartphones' }
    });
  }

  const iphone = await prisma.product.upsert({
    where: { slug: 'iphone-15-pro' },
    update: {},
    create: {
      name: 'iPhone 15 Pro Max',
      slug: 'iphone-15-pro',
      description: 'The latest Titanium iPhone.',
      basePrice: 120000,
      sellingPrice: 115000,
      stock: 50,
      categoryId: smartphoneCat.id,
      brand: 'Apple',
      status: 'PUBLISHED',
      sku: 'IP15PM-001',
      barcode: '1234567890',
      variants: {
        create: [
          { name: 'Black - 256GB', sku: 'IP15PM-BLK-256', barcode: 'VAR-IP15PM-BLK', sellingPrice: 115000, stock: 25 },
          { name: 'White - 256GB', sku: 'IP15PM-WHT-256', barcode: 'VAR-IP15PM-WHT', sellingPrice: 115000, stock: 25 }
        ]
      }
    }
  });

  console.log(`✅ Products Seeded! (${iphone.name})`);
  return { iphone };
}

if (require.main === module) {
  seedProducts().catch(console.error).finally(() => prisma.$disconnect());
}

module.exports = seedProducts;
