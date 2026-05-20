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
  console.log('Product:', JSON.stringify(product, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
