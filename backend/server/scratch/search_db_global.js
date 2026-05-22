const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Searching all collections for asvn1gfivjhkz6xthb83...');
  
  // 1. Search Products
  const products = await prisma.product.findMany({
    where: {
      images: {
        has: 'products/asvn1gfivjhkz6xthb83'
      }
    }
  });
  if (products.length > 0) {
    console.log('Found in Product images:', products.map(p => ({ id: p.id, name: p.name, slug: p.slug })));
  }

  // 2. Search Categories
  const categories = await prisma.category.findMany({
    where: {
      image: 'products/asvn1gfivjhkz6xthb83'
    }
  });
  if (categories.length > 0) {
    console.log('Found in Category image:', categories.map(c => ({ id: c.id, name: c.name })));
  }

  // 3. Search ProductVariants
  const variants = await prisma.productVariant.findMany({
    where: {
      images: {
        has: 'products/asvn1gfivjhkz6xthb83'
      }
    }
  });
  if (variants.length > 0) {
    console.log('Found in ProductVariant images:', variants.map(v => ({ id: v.id, name: v.name })));
  }

  console.log('Search completed.');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
