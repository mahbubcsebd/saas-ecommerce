const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updatedUser = await prisma.user.update({
    where: { email: 'admin@example.com' },
    data: { role: 'SUPER_ADMIN' },
  });
  console.log(`User ${updatedUser.email} role updated to: ${updatedUser.role}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
