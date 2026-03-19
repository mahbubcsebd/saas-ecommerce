const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSlides() {
  try {
    const slides = await prisma.heroSlide.findMany({});
    console.log('Total slides:', slides.length);
    slides.forEach((s) => {
      console.log(`ID: ${s.id}`);
      console.log(`Title: ${s.title}`);
      console.log(`Image: ${s.image}`);
      console.log(`Active: ${s.isActive}`);
      console.log(`Featured: ${s.isFeatured}`);
      console.log('---');
    });
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSlides();
