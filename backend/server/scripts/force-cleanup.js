const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up ALL data to fix orphans...');

  // 1. Delete dependents of Product
  console.log('1. Deleting dependent data...');
  await prisma.stockMovement.deleteMany({});
  await prisma.discountUsage.deleteMany({});
  await prisma.productDiscount.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.wishlist.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.cartItem.deleteMany({});
  await prisma.productVariant.deleteMany({});

  // 2. Delete Products (Must be done before Categories)
  console.log('2. Deleting Products...');
  await prisma.product.deleteMany({});

  // 3. Delete Categories (Iterative loop)
  console.log("3. Deleting Categories (Iterative leaf-first)...");

  let count = await prisma.category.count();
  let loops = 0;

  while (count > 0 && loops < 20) {
      console.log(`   Loop ${loops + 1}: ${count} categories remaining...`);
      try {
          // Attempt to delete leaf nodes
          const result = await prisma.category.deleteMany({
              where: {
                  children: {
                      none: {}
                  }
              }
          });
          console.log(`      Deleted ${result.count} leaf categories.`);

          if (result.count === 0) {
              console.log("      No leaves found? Detaching relations...");
              await prisma.category.updateMany({
                  data: { parentId: null }
              });
              await prisma.category.deleteMany({});
              break;
          }
      } catch (e) {
          console.log(`      Error in loop: ${e.message}`);
           await prisma.category.updateMany({
              data: { parentId: null }
          });
          await prisma.category.deleteMany({});
          break;
      }
      count = await prisma.category.count();
      loops++;
  }

  // 4. Delete others if needed
  console.log('4. Deleting Users, Addresses, Slides, Discounts...');
  await prisma.discount.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.cart.deleteMany({});
  await prisma.address.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.heroSlide.deleteMany({});

  const finalCount = await prisma.category.count();
  console.log(`✅ All data cleared. Categories remaining: ${finalCount}`);

  console.log("Please run 'node prisma/seed.js' immediately after this to repopulate.");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
