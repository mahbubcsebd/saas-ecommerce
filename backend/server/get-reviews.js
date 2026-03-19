const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reviews = await prisma.review.findMany({
    include: {
      user: { select: { firstName: true, email: true } },
      product: { select: { name: true } },
    },
  });
  console.log(`Found ${reviews.length} reviews:`);
  console.log(JSON.stringify(reviews, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
