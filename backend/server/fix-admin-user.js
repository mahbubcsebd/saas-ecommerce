const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function fixUser() {
  const email = 'admin@example.com';
  const password = 'password123@!';

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { username: email }]
      }
    });

    if (!user) {
      console.log('User not found. Creating admin user...');
      // Logic to create if needed, but we know it exists
    } else {
      console.log('User found. Updating...');

      const hashedPassword = await bcrypt.hash(password, 12);

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          status: 'ACTIVE',
          role: 'ADMIN',
          password: hashedPassword,
          emailVerificationToken: null,
          emailVerificationTokenExpiry: null
        }
      });

      console.log('User updated successfully:');
      console.log('Email Verified:', updatedUser.isEmailVerified);
      console.log('Status:', updatedUser.status);
      console.log('Role:', updatedUser.role);
    }
  } catch (error) {
    console.error('Error fixing user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUser();
