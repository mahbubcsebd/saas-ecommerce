const prisma = require('./backend/server/src/config/prisma');

async function checkTranslationContent() {
  try {
    const cats = await prisma.category.findMany({
        where: { name: 'Electronics' },
        include: { translations: true }
    });

    console.log("--- Category: Electronics ---");
    cats.forEach(c => {
        console.log(`Translations: ${JSON.stringify(c.translations, null, 2)}`);
    });

    const prods = await prisma.product.findMany({
        take: 5,
        include: { translations: true }
    });

    console.log("\n--- Sample Products ---");
    prods.forEach(p => {
        console.log(`Product: ${p.name}`);
        console.log(`Translations count: ${p.translations.length}`);
        if (p.translations.length > 0) {
            console.log(`Translation data: ${JSON.stringify(p.translations[0])}`);
        }
    });

  } catch (error) {
    console.error("Check failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTranslationContent();
