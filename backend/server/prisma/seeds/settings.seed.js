const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSettings() {
  console.log('🌱 Seeding Settings...');

  // Use valid 24-char hex strings for MongoDB ObjectIDs
  const GENERAL_SETTINGS_ID = '657a8f7e8f7e8f7e8f7e8f71';
  const CURRENCY_SETTINGS_ID = '657a8f7e8f7e8f7e8f7e8f72';

  await prisma.generalSetting.upsert({
    where: { id: GENERAL_SETTINGS_ID },
    update: {},
    create: { 
      id: GENERAL_SETTINGS_ID, 
      siteName: 'Mahbub Shop', 
      tagline: 'Best Deals', 
      logoUrl: '', 
      faviconUrl: '' 
    }
  });

  await prisma.currencySetting.upsert({
    where: { id: CURRENCY_SETTINGS_ID },
    update: {},
    create: { 
      id: CURRENCY_SETTINGS_ID, 
      code: 'BDT', 
      symbol: '৳', 
      symbolPosition: 'LEFT',
      decimalPlaces: 2
    }
  });

  console.log(`✅ Settings Seeded!`);
}

if (require.main === module) {
  seedSettings().catch(console.error).finally(() => prisma.$disconnect());
}

module.exports = seedSettings;
