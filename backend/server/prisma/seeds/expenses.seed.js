const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedExpenses() {
  console.log('🌱 Seeding Expenses...');

  const rentCat = await prisma.expenseCategory.upsert({
    where: { name: 'Rent' },
    update: {},
    create: { name: 'Rent', description: 'Office and Warehouse Rent' }
  });

  const utilityCat = await prisma.expenseCategory.upsert({
    where: { name: 'Utility' },
    update: {},
    create: { name: 'Utility', description: 'Electricity, Water, Internet' }
  });

  let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) {
    console.log('⚠️ No Admin found, skipping expense log creation.');
    return;
  }

  await prisma.expense.create({
    data: {
      title: 'Shop Rent - May',
      categoryId: rentCat.id,
      amount: 15000,
      reference: 'VOUCHER-001',
      recordedById: admin.id,
      notes: 'Rent for current month'
    }
  });

  console.log(`✅ Expenses Seeded!`);
}

if (require.main === module) {
  seedExpenses().catch(console.error).finally(() => prisma.$disconnect());
}

module.exports = seedExpenses;
