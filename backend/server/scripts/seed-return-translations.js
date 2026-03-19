const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const translations = [
    // Return Request Page
    { namespace: 'returns', key: 'requestReturn', value: 'Request a Return' },
    { namespace: 'returns', key: 'backToOrder', value: 'Back to Order' },
    { namespace: 'returns', key: 'deliveredOn', value: 'Delivered on' },
    { namespace: 'returns', key: 'importantInfo', value: 'Important Information' },
    { namespace: 'returns', key: 'selectItems', value: 'Select Items to Return' },
    { namespace: 'returns', key: 'reason', value: 'Reason for Return' },
    { namespace: 'returns', key: 'refundMethod', value: 'Refund Method' },
    { namespace: 'returns', key: 'originalPayment', value: 'Original Payment Method' },
    { namespace: 'returns', key: 'comments', value: 'Comments (Optional)' },
    {
      namespace: 'returns',
      key: 'commentsPlaceholder',
      value: 'Please provide more details about the issue...',
    },
    { namespace: 'returns', key: 'totalRefund', value: 'Total Refund Estimate' },
    { namespace: 'returns', key: 'submitRequest', value: 'Submit Request' },
    { namespace: 'returns', key: 'noItemsReturnable', value: 'No Items Returnable' },
    {
      namespace: 'returns',
      key: 'noItemsReturnableDesc',
      value: 'All items from this order have already been returned or are ineligible.',
    },
    {
      namespace: 'returns',
      key: 'policyNotice',
      value:
        'Please select the items you wish to return. Each item will be reviewed by our team. Refunds are processed to the original payment method after the items reach our warehouse.',
    },

    // Reasons
    { namespace: 'returns', key: 'reasonDefective', value: 'Item is defective/damaged' },
    { namespace: 'returns', key: 'reasonWrongItem', value: 'Received the wrong item' },
    { namespace: 'returns', key: 'reasonNotAsDescribed', value: 'Item not as described' },
    { namespace: 'returns', key: 'reasonNoLongerNeeded', value: 'No longer needed' },
    { namespace: 'returns', key: 'reasonBetterPrice', value: 'Found a better price elsewhere' },
    { namespace: 'returns', key: 'reasonOther', value: 'Other' },

    // Statuses (already exist mostly, but for returns specifically)
    { namespace: 'returns', key: 'requestedOn', value: 'Requested on' },
    { namespace: 'returns', key: 'rmaId', value: 'RMA ID' },
    { namespace: 'returns', key: 'returnPolicy', value: 'Return Policy' },
  ];

  console.log('🌱 Seeding return translations...');

  for (const t of translations) {
    await prisma.uiTranslation.upsert({
      where: {
        langCode_namespace_key: {
          langCode: 'en',
          namespace: t.namespace,
          key: t.key,
        },
      },
      update: { value: t.value },
      create: {
        langCode: 'en',
        namespace: t.namespace,
        key: t.key,
        value: t.value,
        isReviewed: true,
      },
    });
  }

  console.log('✅ Return translations seeded!');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
