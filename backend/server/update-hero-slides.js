const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateSlides() {
  try {
    const update = await prisma.heroSlide.updateMany({
      data: { isFeatured: true },
    });
    console.log(`Updated ${update.count} slides to be featured.`);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

updateSlides();
