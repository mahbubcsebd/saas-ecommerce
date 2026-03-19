const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting translation seed...');

  // 1. Load strings from frontend
  const stringsPath = path.join(__dirname, '../../../frontend/frontend_strings.json');
  if (!fs.existsSync(stringsPath)) {
    console.error('❌ Error: frontend_strings.json not found at', stringsPath);
    process.exit(1);
  }

  const strings = JSON.parse(fs.readFileSync(stringsPath, 'utf8'));

  // 2. Ensure "en" language exists
  await prisma.language.upsert({
    where: { code: 'en' },
    update: { isActive: true },
    create: {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      isActive: true,
      isRtl: false,
      isDefault: true,
    },
  });

  console.log('✅ Base language "en" ensured.');

  // 3. Upsert translations
  let count = 0;
  for (const [namespace, keys] of Object.entries(strings)) {
    console.log(`📦 Seeding namespace: ${namespace}...`);
    for (const [key, value] of Object.entries(keys)) {
      await prisma.uiTranslation.upsert({
        where: {
          langCode_namespace_key: {
            langCode: 'en',
            namespace,
            key,
          },
        },
        update: { value: String(value) },
        create: {
          langCode: 'en',
          namespace,
          key,
          value: String(value),
          isReviewed: true,
          isAutoTranslated: false,
        },
      });
      count++;
    }
  }

  console.log(`✨ Successfully seeded ${count} translations for "en".`);

  // 4. Optional: If there are other active languages, we could trigger auto-translation
  // but for now let's just do English as requested.
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
