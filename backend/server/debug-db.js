const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Debugging DB Content...');

  // 1. Check Categories
  const categories = await prisma.category.findMany({
    where: { isHomeShown: true, parentId: null },
  });
  console.log(`\n📂 Categories (isHomeShown: true, top-level): ${categories.length}`);
  categories.forEach((c) => console.log(`   - ${c.name} (id: ${c.id})`));

  // 2. Check Products
  const products = await prisma.product.findMany();
  console.log(`\nbox Products Total: ${products.length}`);

  const featured = products.filter((p) => p.isFeatured);
  console.log(`   - Featured: ${featured.length}`);
  const newArrival = products.filter((p) => p.isNewArrival);
  console.log(`   - New Arrival: ${newArrival.length}`);

  // 3. Check Association for first category
  if (categories.length > 0) {
    const cat = categories[0];
    const children = await prisma.category.findMany({ where: { parentId: cat.id } });
    const ids = [cat.id, ...children.map((c) => c.id)];

    console.log(`\nChecking products for ${cat.name} (IDs: ${ids.length})`);

    const catProducts = await prisma.product.findMany({
      where: {
        categoryId: { in: ids },
        OR: [{ isFeatured: true }, { isNewArrival: true }],
      },
    });
    console.log(`   - Found ${catProducts.length} matching products`);
    catProducts.forEach((p) => console.log(`     -> ${p.name}`));
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
