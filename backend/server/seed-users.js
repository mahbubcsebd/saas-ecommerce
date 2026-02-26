const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('🌱 Seeding users with all roles...');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const users = [
    {
      email: 'superadmin@example.com',
      username: 'superadmin',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      phone: '+8801700000001',
    },
    {
      email: 'admin@example.com',
      username: 'admin',
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
      phone: '+8801700000002',
    },
    {
      email: 'manager@example.com',
      username: 'manager',
      firstName: 'Store',
      lastName: 'Manager',
      role: 'MANAGER',
      phone: '+8801700000003',
    },
    {
      email: 'staff@example.com',
      username: 'staff',
      firstName: 'Support',
      lastName: 'Staff',
      role: 'STAFF',
      phone: '+8801700000004',
    },
    {
      email: 'customer@example.com',
      username: 'customer',
      firstName: 'Valued',
      lastName: 'Customer',
      role: 'CUSTOMER',
      phone: '+8801700000005',
    }
  ];

  for (const userData of users) {
    try {
        const user = await prisma.user.upsert({
            where: { email: userData.email },
            update: {
                role: userData.role,
                isActive: true,
                isEmailVerified: true, // Fix login blocker
                password: hashedPassword
            },
            create: {
                ...userData,
                password: hashedPassword,
                isActive: true,
                isEmailVerified: true, // Fix login blocker
                bio: `Seeded ${userData.role}`
            }
        });
        console.log(`✅  ${user.role}: ${user.email} (Password: password123)`);
    } catch (e) {
        console.error(`❌ Failed to seed ${userData.email}:`, e.message);
    }
  }

  console.log('\nUser seeding complete.');
}

seedUsers()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
