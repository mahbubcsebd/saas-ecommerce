const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Searching for variant with image products/asvn1gfivjhkz6xthb83...');
  const variant = await prisma.productVariant.findFirst({
    where: {
      images: {
        has: 'products/asvn1gfivjhkz6xthb83'
      }
    },
    include: {
      product: true
    }
  });

  if (variant) {
    console.log('Found variant:', JSON.stringify(variant, null, 2));
  } else {
    console.log('No variant with that exact image found.');
    // Let's check all product variants in the database
    const allVariantsWithImages = await prisma.productVariant.findMany({
      where: {
        images: {
          isEmpty: false
        }
      }
    });
    console.log('Variants with any images in DB:', allVariantsWithImages);
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
