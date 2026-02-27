const contentTranslationService = require('./backend/server/src/services/contentTranslation.service');
const prisma = require('./backend/server/src/config/prisma');

async function triggerTranslations() {
  const langCode = 'bn'; // Bengali
  console.log(`Triggering translations for ${langCode}...`);

  try {
    // Check if lang exists
    const lang = await prisma.language.findUnique({ where: { code: langCode } });
    if (!lang) {
        console.log(`Language ${langCode} not found, creating it...`);
        await prisma.language.create({
            data: {
                name: 'Bengali',
                code: 'bn',
                isActive: true
            }
        });
    }

    await contentTranslationService.autoTranslateAllContent(langCode);
    console.log("Translation trigger finished!");
  } catch (error) {
    console.error("Translation trigger failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

triggerTranslations();
