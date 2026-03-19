const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧪 Verifying Controller Logic...');

  try {
    // 1. Fetch All
    const allCategories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        order: true,
        parentId: true,
        isHomeShown: true,
        children: { select: { id: true } },
      },
    });

    console.log(`Step 1: Fetched ${allCategories.length} categories`);

    // 2. Filter
    const categories = allCategories.filter((c) => {
      const isRoot = !c.parentId;
      const shouldShow =
        c.isHomeShown === true || ['electronics', 'fashion', 'home-living'].includes(c.slug);
      return isRoot && shouldShow;
    });

    console.log(`Step 2: Filtered down to ${categories.length} root categories`);
    categories.forEach((c) => console.log(`   - ${c.name} (isHomeShown: ${c.isHomeShown})`));

    // 3. Get Products
    const result = await Promise.all(
      categories.map(async (category) => {
        const categoryIds = [category.id, ...category.children.map((c) => c.id)];

        // Note: In controller `isActive: true` is used.
        const products = await prisma.product.findMany({
          where: {
            categoryId: { in: categoryIds },
            OR: [{ isFeatured: true }, { isNewArrival: true }],
          },
          take: 8,
        });
        return {
          name: category.name,
          productsCount: products.length,
          products: products.map((p) => p.name),
        };
      })
    );

    // 4. Final filter
    const final = result.filter((cat) => cat.productsCount > 0);
    console.log(`Step 3: Final categories with products: ${final.length}`);
    final.forEach((c) => {
      console.log(`\n📂 ${c.name}: ${c.productsCount} products`);
      c.products.forEach((p) => console.log(`   * ${p}`));
    });
  } catch (e) {
    console.error('❌ Error:', e);
  }
}

main().finally(() => prisma.$disconnect());
