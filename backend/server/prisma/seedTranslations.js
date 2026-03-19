const { PrismaClient } = require('@prisma/client');
const contentTranslationService = require('../src/services/contentTranslation.service');

const prisma = new PrismaClient();

async function seedTranslations() {
  console.log('🌍 Starting translation seeding...');

  try {
    // Check if Bengali language exists
    const bengaliLang = await prisma.language.findUnique({
      where: { code: 'bn' },
    });

    if (!bengaliLang) {
      console.log('❌ Bengali language not found. Please add it first.');
      console.log('Run: Add Bengali language via admin panel or seed script');
      return;
    }

    console.log('✅ Bengali language found:', bengaliLang.name);

    // Get all categories
    const categories = await prisma.category.findMany({
      include: { translations: true },
    });

    console.log(`📦 Found ${categories.length} categories`);

    // Translate each category
    for (const category of categories) {
      const existingTranslation = category.translations.find((t) => t.langCode === 'bn');

      if (existingTranslation) {
        console.log(`⏭️  Skipping ${category.name} - already translated`);
        continue;
      }

      try {
        console.log(`🔄 Translating: ${category.name}...`);
        await contentTranslationService.autoTranslateCategory(category.id, 'bn');
        console.log(`✅ Translated: ${category.name}`);
      } catch (error) {
        console.error(`❌ Error translating ${category.name}:`, error.message);
      }
    }

    console.log('🎉 Translation seeding completed!');
  } catch (error) {
    console.error('❌ Error during translation seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTranslations();
