const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSuppliers() {
  console.log('🌱 Seeding Suppliers...');

  const supplier = await prisma.supplier.create({
    data: {
      name: 'Tech Wholesalers BD',
      contactPerson: 'Mr. Rahim',
      email: 'rahim@techwholesale.bd',
      phone: '01800000000',
      address: 'Motijheel, Dhaka',
      isActive: true,
      dueBalance: 0
    }
  });

  console.log(`✅ Suppliers Seeded! (${supplier.name})`);
  return supplier;
}

if (require.main === module) {
  seedSuppliers().catch(console.error).finally(() => prisma.$disconnect());
}

module.exports = seedSuppliers;
