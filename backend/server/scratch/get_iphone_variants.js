const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching iphone-15-pro-max-858092...');
  
  const product = await prisma.product.findUnique({
    where: { slug: 'iphone-15-pro-max-858092' },
    include: {
      variants: true
    }
  });

  if (product) {
    console.log('Product found:', product.name);
    console.log('Variants count:', product.variants.length);
    product.variants.forEach((v, i) => {
      console.log(`Variant ${i + 1}:`, v.name);
      console.log('Attributes:', JSON.stringify(v.attributes, null, 2));
    });
  } else {
    console.log('Product not found.');
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
