const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCategories() {
  console.log('🌱 Seeding Categories...');

  const electronics = await prisma.category.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
      isActive: true
    }
  });

  const smartphone = await prisma.category.upsert({
    where: { slug: 'smartphones' },
    update: {},
    create: {
      name: 'Smartphones',
      slug: 'smartphones',
      parentId: electronics.id,
      isActive: true
    }
  });

  const clothing = await prisma.category.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: {
      name: 'Clothing',
      slug: 'clothing',
      isActive: true
    }
  });

  console.log(`✅ Categories Seeded!`);
  return { electronics, smartphone, clothing };
}

if (require.main === module) {
  seedCategories().catch(console.error).finally(() => prisma.$disconnect());
}

module.exports = seedCategories;
