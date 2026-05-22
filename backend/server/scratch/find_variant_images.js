const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Searching for any variant with images...');
  const variants = await prisma.productVariant.findMany({
    where: {
      images: {
        isEmpty: false
      }
    },
    include: {
      product: true
    }
  });

  if (variants.length === 0) {
    console.log('No variants with images found in Prisma database.');
    // Let's print all variants regardless
    const allVariants = await prisma.productVariant.findMany({
      take: 10
    });
    console.log('Some variants in DB:', allVariants.map(v => ({ id: v.id, name: v.name, images: v.images })));
  } else {
    console.log(`Found ${variants.length} variants with images:`);
    variants.forEach(v => {
      console.log(`Variant ID: ${v.id}, Name: ${v.name}, Product Slug: ${v.product.slug}`);
      console.log(`DB raw images:`, v.images);
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
