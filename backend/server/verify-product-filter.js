const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Verifying Product Filter Logic...');

  // 1. Get 'electronics' category
  const electronics = await prisma.category.findUnique({
    where: { slug: 'electronics' },
    include: { children: true }
  });

  if (!electronics) {
    console.log('❌ Electronics category not found');
    return;
  }

  console.log(`Found Category: ${electronics.name} (${electronics.id})`);
  console.log(`Children: ${electronics.children.length}`);
  electronics.children.forEach(c => console.log(` - ${c.name} (${c.id})`));

  // 2. Simulate current controller logic (Direct ID match only)
  const currentLogicProducts = await prisma.product.findMany({
    where: {
      categoryId: { in: [electronics.id] },
      status: 'PUBLISHED'
    }
  });
  console.log(`\nCurrent Logic (Direct ID): Found ${currentLogicProducts.length} products`);

  // 3. Simulate FIXED logic (Recursive)
  // Fetch all categories including children (for deep nesting, we might need more, but let's assume 1 level for now or use recursive fetch)
  // For the fix, we should probably fetch children IDs.

  const categoryIds = [electronics.id, ...electronics.children.map(c => c.id)];

  const fixedLogicProducts = await prisma.product.findMany({
    where: {
      categoryId: { in: categoryIds },
      status: 'PUBLISHED'
    }
  });
  console.log(`Fixed Logic (ID + Children): Found ${fixedLogicProducts.length} products`);
  fixedLogicProducts.forEach(p => console.log(` * ${p.name} (CatID: ${p.categoryId})`));

}

main().finally(() => prisma.$disconnect());
