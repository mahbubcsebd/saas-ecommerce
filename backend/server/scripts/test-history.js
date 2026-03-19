const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const data = await prisma.backup.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1,
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    console.log('Success:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
