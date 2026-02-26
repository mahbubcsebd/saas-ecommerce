
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSlides() {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: {
        isActive: true,
        isFeatured: true
      }
    });
    console.log("Found slides:", JSON.stringify(slides, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkSlides();
