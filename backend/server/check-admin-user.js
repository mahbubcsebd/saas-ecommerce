const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const email = 'admin@example.com';
  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
            { email: email },
            { username: email }
        ]
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        isEmailVerified: true,
        password: true
      }
    });

    if (user) {
      console.log(JSON.stringify(user, null, 2));
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
