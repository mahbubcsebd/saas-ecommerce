const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const translations = [
    {
      langCode: 'ja',
      namespace: 'common',
      key: 'footerTagline',
      value: 'プレミアム製品のワンストップ・デスティネーション。',
    },
    { langCode: 'ja', namespace: 'common', key: 'aboutUs', value: '私たちについて' },
    { langCode: 'ja', namespace: 'common', key: 'termsConditions', value: '利用規約' },

    // Also ensuring EN exists in case they don't
    {
      langCode: 'en',
      namespace: 'common',
      key: 'footerTagline',
      value: 'Your one-stop destination for premium products.',
    },
    { langCode: 'en', namespace: 'common', key: 'aboutUs', value: 'About Us' },
    { langCode: 'en', namespace: 'common', key: 'termsConditions', value: 'Terms and Conditions' },
  ];

  console.log('🌱 Seeding footer ja/en translations...');

  for (const t of translations) {
    await prisma.uiTranslation.upsert({
      where: {
        langCode_namespace_key: {
          langCode: t.langCode,
          namespace: t.namespace,
          key: t.key,
        },
      },
      update: { value: t.value },
      create: {
        langCode: t.langCode,
        namespace: t.namespace,
        key: t.key,
        value: t.value,
        isReviewed: true,
      },
    });
  }

  console.log('✅ Footer translations seeded!');
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
