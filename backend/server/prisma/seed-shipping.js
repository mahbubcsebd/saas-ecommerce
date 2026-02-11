
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Clear existing generic BD zones to verify clean state
  // (Optional, but good for testing specific logic)
  // await prisma.shippingZone.deleteMany({}); // Dangerous in prod, using upsert/update instead

  // 2. Create "Inside Dhaka" Zone
  const dhakaZone = await prisma.shippingZone.upsert({
    where: { id: "65c3de1b9f1b2c001c8e1a01" }, // Using a fixed ObjectID-like string or just finding by name if schema allows unique name
    // Since ID is auto ObjectId, we can't force it easily unless mapped.
    // Let's find by name or create
    create: {
        name: "Inside Dhaka",
        countries: ["BD"],
        regions: ["Dhaka"], // We will match this against 'city'
        priority: 10,
        rates: {
            create: {
                method: "Standard Delivery",
                carrier: "Pathao/RedX",
                calculationType: "FLAT",
                flatRate: 80,
                estimatedDays: "2-3"
            }
        }
    },
    update: {
        countries: ["BD"],
        regions: ["Dhaka"],
        priority: 10
        // We assume rates exist or we'd upsert them too, but for seeding this is fine
    }
  });

  // 3. Create "Outside Dhaka" Zone
  // This will match "BD" but have NO specific regions, so it catches everything else
  // Priority lower than Dhaka
  const outsideZone = await prisma.shippingZone.upsert({
    where: { id: "65c3de1b9f1b2c001c8e1a02" },
    create: {
        name: "Outside Dhaka",
        countries: ["BD"],
        regions: [], // Empty means "All remaining in country"
        priority: 1,
        rates: {
            create: {
                method: "Standard Delivery",
                carrier: "Pathao/RedX",
                calculationType: "FLAT",
                flatRate: 120,
                estimatedDays: "3-5"
            }
        }
    },
    update: {
        countries: ["BD"],
        regions: [],
        priority: 1
    }
  });

  console.log("Seeded Shipping Zones:", { dhakaZone, outsideZone });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
