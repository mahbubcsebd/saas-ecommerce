const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const runAllSeeds = require('./index');

async function resetDatabase() {
  console.log('⚠️  WARNING: Resetting Database...');
  
  // 1. Clear self-relations or circular dependencies if any
  try {
    if (prisma.category) {
      await prisma.category.updateMany({ data: { parentId: null } });
      console.log('🔄 Cleared Category parent references');
    }
    if (prisma.chatMessage) {
      await prisma.chatMessage.updateMany({ data: { replyToId: null } });
      console.log('🔄 Cleared ChatMessage reply references');
    }
    if (prisma.user) {
      await prisma.user.updateMany({ data: { createdBy: null } });
      console.log('🔄 Cleared User creator references');
    }
  } catch (e) {
    console.log('⚠️ Note: Pre-reset cleanup skipped or failed: ' + e.message);
  }

  const models = [
    'chatMessage',
    'conversation',
    'notification',
    'aiQuery',
    'wishlist',
    'landingPage',
    'landingPageUnique',
    'staffActivity',
    'backup',
    'newsletterSubscriber',
    'orderPayment',
    'orderItem',
    'order',
    'review',
    'discountUsage',
    'productDiscount',
    'discount',
    'stockMovement',
    'damageReport',
    'purchaseReturnItem',
    'purchaseReturn',
    'purchaseItem',
    'purchase',
    'supplierPayment',
    'supplierTransaction',
    'supplier',
    'shippingRate',
    'shippingZone',
    'generalSetting',
    'currencySetting',
    'expense',
    'expenseCategory',
    'attribute',
    'productVariant',
    'product',
    'category',
    'customRole',
    'customerGroup',
    'user'
  ];

  for (const model of models) {
    if (prisma[model]) {
      try {
        await prisma[model].deleteMany({});
        console.log(`🗑️ Cleared: ${model}`);
      } catch (err) {
        console.log(`⚠️ Failed to clear ${model}: ${err.message}`);
      }
    }
  }

  console.log('\n✅ Database Reset Complete.\n');

  // Run the seeds
  await runAllSeeds();
}

resetDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
