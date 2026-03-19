const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSlides() {
  try {
    // Check if any slides exist
    const count = await prisma.heroSlide.count();
    if (count > 0) {
      console.log('Slides already exist.');
    }

    // Create 3 demo slides
    await prisma.heroSlide.createMany({
      data: [
        {
          image:
            'https://images.unsplash.com/photo-1593642702749-b7d2a81675a8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80',
          title: 'New Arrivals',
          subtitle: 'Check out the latest gadgets',
          link: '/shop',
          isFeatured: true,
          isActive: true,
          order: 1,
        },
        {
          image:
            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80',
          title: 'Premium Headphones',
          subtitle: 'Experience sound like never before',
          link: '/category/audio',
          isFeatured: true,
          isActive: true,
          order: 2,
        },
        {
          image:
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80',
          title: 'Smart Wraps',
          subtitle: 'Protect your devices in style',
          link: '/category/accessories',
          isFeatured: true,
          isActive: true,
          order: 3,
        },
      ],
    });
    console.log('Seeded 3 hero slides.');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

seedSlides();
