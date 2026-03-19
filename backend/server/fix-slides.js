const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateSlides() {
  try {
    const result = await prisma.heroSlide.updateMany({
      where: {},
      data: {
        isFeatured: true,
        isActive: true,
      },
    });
    console.log(`Updated ${result.count} slides to be Featured and Active.`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

updateSlides();
