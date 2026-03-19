const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  try {
    // We use raw mongo command to see what's actually there since prisma is failing to parse
    const settings = await prisma.integrationSetting.findMany();
    console.log('Current settings (if readable):', settings);
  } catch (err) {
    console.error(
      'Prisma read failed, attempting to fix directly via raw commands or just deleting and recreating if it is a single settings record.'
    );
    // Since it's MongoDB, we can try to find and update
    // But Prisma's findFirst is failing.
  }

  // Let's try to just update it to something valid if it exists
  try {
    const count = await prisma.integrationSetting.count();
    if (count > 0) {
      console.log('Setting exists, updating to clear any malformed data...');
      // We'll try to get the ID by finding all but catching error?
      // Actually, we can use a raw command to find the ID.
      const raw = await prisma.$runCommandRaw({
        find: 'IntegrationSetting',
        limit: 1,
      });

      if (raw.cursor && raw.cursor.firstBatch && raw.cursor.firstBatch.length > 0) {
        const doc = raw.cursor.firstBatch[0];
        const id = doc._id.$oid;
        console.log('Found ID:', id);

        await prisma.integrationSetting.update({
          where: { id: id },
          data: {
            googleAnalyticsId: ['G-XXXXXXXXXX'], // Placeholder to fix type
            googleTagManagerId: ['GTM-5KRV6KLW'],
            facebookPixelId: [],
          },
        });
        console.log('Fixed!');
      }
    }
  } catch (err) {
    console.error('Fix failed:', err);
  }
}

fix().finally(() => prisma.$disconnect());
