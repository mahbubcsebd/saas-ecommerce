const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Adding mock reviews...");

  // Find a product and a user
  const product = await prisma.product.findFirst();
  const user = await prisma.user.findFirst();

  if (!product || !user) {
    console.error("No users or products found in the database. Please create a user and a product first.");
    process.exit(1);
  }

  // Add 3 mock reviews with different statuses
  await prisma.review.createMany({
    data: [
      {
        userId: user.id,
        productId: product.id,
        rating: 5,
        comment: 'This product is amazing! Highly recommended.',
        status: 'PENDING',
        isFlagged: false,
      },
      {
        userId: user.id,
        productId: product.id,
        rating: 2,
        comment: 'Not what I expected. The quality is lacking.',
        status: 'REJECTED',
        isFlagged: true,
        adminReply: 'We are sorry to hear that. Please contact support for a refund.',
      },
      {
        userId: user.id,
        productId: product.id,
        rating: 4,
        comment: 'Good value for money.',
        status: 'APPROVED',
        isFlagged: false,
      },
    ]
  });

  console.log("Mock reviews added successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
