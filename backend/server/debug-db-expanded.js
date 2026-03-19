const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Expanded Debugging...');

  // 1. Check ALL Categories
  const categories = await prisma.category.findMany();
  console.log(`\nTotal Categories: ${categories.length}`);

  categories.forEach((c) => {
    if (!c.parentId) {
      console.log(`ROOT: ${c.name} | isHomeShown: ${c.isHomeShown} | id: ${c.id}`);
    }
  });

  // 2. Try to update one to TRUE
  try {
    const electronics = categories.find((c) => c.slug === 'electronics');
    if (electronics) {
      console.log(`\nAttempting to set isHomeShown=true for ${electronics.name}...`);
      await prisma.category.update({
        where: { id: electronics.id },
        data: { isHomeShown: true },
      });
      console.log('Update success!');
    }
  } catch (e) {
    console.error('Update failed:', e.message);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
