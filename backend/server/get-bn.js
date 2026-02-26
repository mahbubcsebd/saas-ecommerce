const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function getBN() {
  try {
    const t = await prisma.uiTranslation.findMany({ where: { langCode: 'bn' } });
    fs.writeFileSync('bn-test.json', JSON.stringify(t, null, 2));
    console.log('Done');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
getBN();
