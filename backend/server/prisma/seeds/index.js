const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const seedSettings = require('./settings.seed');
const seedShipping = require('./shipping.seed');
const seedUsers = require('./users.seed');
const seedCategories = require('./categories.seed');
const seedSuppliers = require('./suppliers.seed');
const seedProducts = require('./products.seed');
const seedDiscounts = require('./discounts.seed');
const seedExpenses = require('./expenses.seed');
const seedOrders = require('./orders.seed');

async function main() {
  console.log('🚀 Starting Full Database Seeding...\n');

  await seedSettings();
  await seedShipping();
  await seedUsers();
  await seedCategories();
  await seedSuppliers();
  await seedProducts();
  await seedDiscounts();
  await seedExpenses();
  await seedOrders();

  console.log('\n🎉 All Seeders Executed Successfully!');
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = main;
