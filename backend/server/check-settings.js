const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function checkSettings() {
  try {
    const general = await prisma.generalSetting.findFirst();
    const currency = await prisma.currencySetting.findFirst();
    const languages = await prisma.language.findMany();
    const bnTranslationsCount = await prisma.uiTranslation.count({ where: { langCode: 'bn' } });
    const enTranslationsCount = await prisma.uiTranslation.count({ where: { langCode: 'en' } });

    const results = {
      general,
      currency,
      languages,
      translations: {
        en: enTranslationsCount,
        bn: bnTranslationsCount,
      },
    };

    fs.writeFileSync('settings-results.json', JSON.stringify(results, null, 2));
    console.log('Results written to settings-results.json');
  } catch (error) {
    console.error('Error checking settings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSettings();
