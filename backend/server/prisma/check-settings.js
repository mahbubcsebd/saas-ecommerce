const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.generalSetting.findFirst();
  console.log('Current Settings:', settings);

  if (!settings) {
    console.log('No settings found. Creating default...');
    await prisma.generalSetting.create({
      data: {
        siteName: 'Mahbub Shop',
        shopType: 'GADGET', // Default
      },
    });
  } else {
    // Toggle or ensure it's set
    console.log(`Current Shop Type: ${settings.shopType}`);

    // User seems to want to see a change. Let's force it to CLOTHING to test,
    // or just ensure it is set if it was null (though default should handle it).
    // If user asked "show kortese na", maybe they want to see the OTHER one?
    // Or maybe the migration didn't backfill?

    // Let's set it to 'CLOTHING' to show the Aarong style as requested/discussed.
    const updated = await prisma.generalSetting.update({
      where: { id: settings.id },
      data: { shopType: 'CLOTHING' },
    });
    console.log('Updated Settings:', updated);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
