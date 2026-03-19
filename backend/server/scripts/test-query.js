const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const slugs = ['electronics', 'fashion'];
  console.log('Testing slugs:', slugs);

  const categories = await prisma.category.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true },
  });

  console.log('Found Categories:', categories);
  const categoryIds = categories.map((c) => c.id);
  console.log('Category IDs:', categoryIds);

  const products = await prisma.product.findMany({
    where: {
      status: 'PUBLISHED',
      categoryId: { in: categoryIds },
    },
    select: { name: true, categoryId: true, category: true },
  });

  console.log(`Found ${products.length} products.`);
  products.forEach((p) => console.log(`- ${p.name} (${p.categoryId})`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
