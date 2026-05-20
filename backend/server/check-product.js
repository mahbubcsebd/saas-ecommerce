const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching first 5 published products...');
  const products = await prisma.product.findMany({
    where: { status: 'PUBLISHED' },
    select: { name: true, slug: true },
    take: 5
  });
  console.log('Products:', JSON.stringify(products, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
