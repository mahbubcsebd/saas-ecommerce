const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Verifying Categories ---');
  const categories = await prisma.category.findMany();
  console.log(categories.map((c) => ({ name: c.name, slug: c.slug, id: c.id })));

  console.log('\n--- Verifying Products (Sample) ---');
  const products = await prisma.product.findMany({ take: 3 });
  products.forEach((p) => {
    console.log(`Product: ${p.name}`);
    console.log(`- Slug: ${p.slug}`);
    console.log(`- Category (String): ${p.category}`);
    console.log(`- CategoryId (Relation): ${p.categoryId}`);
    console.log(`- Status: ${p.status}`);
    console.log('---');
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
