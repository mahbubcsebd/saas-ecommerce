const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRoles() {
  console.log('Starting role migration...');
  try {
    // RAW MongoDB update to bypass Prisma Enum validation
    const result = await prisma.$runCommandRaw({
      update: 'User',
      updates: [
        {
          q: { role: 'USER' },
          u: { $set: { role: 'CUSTOMER' } },
          multi: true,
        },
        {
          q: { role: 'SUPERADMIN' },
          u: { $set: { role: 'SUPER_ADMIN' } },
          multi: true,
        },
        {
          q: { role: 'MODERATOR' },
          u: { $set: { role: 'MANAGER' } },
          multi: true,
        },
      ],
    });
    console.dir(result, { depth: null });
    console.log('Role migration completed.');
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

fixRoles();
