const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Manual Bengali translations for existing categories
const manualTranslations = {
  Women: 'মহিলা',
  'Home & Living': 'হোম এবং লিভিং',
  Category: 'ক্যাটাগরি',
  Sports: 'ক্রীড়া',
  Electronics: 'ইলেকট্রনিক্স',
  Fashion: 'ফ্যাশন',
  Kitchen: 'রান্নাঘর',
  Kids: 'শিশু',
  'Gym Equipment': 'জিম সরঞ্জাম',
  sdf: 'sdf', // Keep as is
  Smartphones: 'স্মার্টফোন',
  Laptops: 'ল্যাপটপ',
  Headphones: 'হেডফোন',
  Cameras: 'ক্যামেরা',
  Shoes: 'জুতা',
  Decor: 'সাজসজ্জা',
  Jerseys: 'জার্সি',
  Furniture: 'আসবাবপত্র',
  dsfd: 'dsfd', // Keep as is
};

async function seedManualTranslations() {
  console.log('🌍 Starting manual translation seeding...');

  try {
    // Check if Bengali language exists
    const bengaliLang = await prisma.language.findUnique({
      where: { code: 'bn' },
    });

    if (!bengaliLang) {
      console.log('❌ Bengali language not found. Creating it...');
      await prisma.language.create({
        data: {
          code: 'bn',
          name: 'Bengali',
          nativeName: 'বাংলা',
          flag: '🇧🇩',
          isActive: true,
        },
      });
      console.log('✅ Bengali language created');
    } else {
      console.log('✅ Bengali language found:', bengaliLang.name);
    }

    // Get all categories
    const categories = await prisma.category.findMany({
      include: { translations: true },
    });

    console.log(`📦 Found ${categories.length} categories`);

    let created = 0;
    let skipped = 0;

    // Create translations for each category
    for (const category of categories) {
      const existingTranslation = category.translations.find((t) => t.langCode === 'bn');

      if (existingTranslation) {
        console.log(`⏭️  Skipping ${category.name} - already translated`);
        skipped++;
        continue;
      }

      const bengaliName = manualTranslations[category.name] || category.name;

      try {
        await prisma.categoryTranslation.create({
          data: {
            categoryId: category.id,
            langCode: 'bn',
            name: bengaliName,
            description: category.description ? `${category.description} (Bengali)` : null,
            isAutoTranslated: false,
          },
        });
        console.log(`✅ Created translation: ${category.name} → ${bengaliName}`);
        created++;
      } catch (error) {
        console.error(`❌ Error creating translation for ${category.name}:`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log('🎉 Manual translation seeding completed!');
  } catch (error) {
    console.error('❌ Error during translation seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedManualTranslations();
