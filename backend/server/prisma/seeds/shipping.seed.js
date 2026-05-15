const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedShipping() {
  console.log('🌱 Seeding Shipping Zones & Rates...');

  // Delete existing to avoid duplicates in seed
  await prisma.shippingRate.deleteMany({});
  await prisma.shippingZone.deleteMany({});

  const dhakaZone = await prisma.shippingZone.create({
    data: {
      name: 'Inside Dhaka',
      regions: ['Dhaka'],
      isActive: true,
      rates: {
        create: [
          { method: 'Standard Delivery', flatRate: 60, calculationType: 'FLAT', isActive: true },
          { method: 'Express Delivery', flatRate: 120, calculationType: 'FLAT', isActive: true }
        ]
      }
    }
  });

  const outsideDhakaZone = await prisma.shippingZone.create({
    data: {
      name: 'Outside Dhaka',
      regions: ['All BD'],
      isActive: true,
      rates: {
        create: [
          { method: 'Standard Delivery', flatRate: 120, calculationType: 'FLAT', isActive: true }
        ]
      }
    }
  });

  console.log(`✅ Shipping Config Seeded!`);
  return { dhakaZone, outsideDhakaZone };
}

if (require.main === module) {
  seedShipping().catch(console.error).finally(() => prisma.$disconnect());
}

module.exports = seedShipping;
