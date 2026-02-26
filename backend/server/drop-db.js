const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Dropping database using Prisma raw command...");
    await prisma.$runCommandRaw({ dropDatabase: 1 });
    console.log("✅ Database dropped successfully!");
  } catch (error) {
    console.error("❌ Failed to drop database:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
