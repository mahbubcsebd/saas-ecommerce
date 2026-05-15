const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function seedUsers() {
  console.log('🌱 Seeding Users...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123@!', salt);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@mahbubshop.com' },
    update: {},
    create: {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@mahbubshop.com',
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true
    }
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@mahbubshop.com' },
    update: {},
    create: {
      firstName: 'Demo',
      lastName: 'Customer',
      email: 'customer@mahbubshop.com',
      username: 'customer',
      password: hashedPassword,
      role: 'CUSTOMER',
      isActive: true,
      isEmailVerified: true
    }
  });

  console.log(`✅ Users Seeded! Admin: ${admin.email}, Customer: ${customer.email}`);
  return { admin, customer };
}

// Allow individual execution
if (require.main === module) {
  seedUsers().catch(console.error).finally(() => prisma.$disconnect());
}

module.exports = seedUsers;
