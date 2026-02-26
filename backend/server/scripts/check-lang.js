const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log("LANGUAGES:");
    console.log(await prisma.language.findMany());
    console.log("UI TRANSLATIONS COUNT:");
    console.log(await prisma.uiTranslation.count());
    console.log("GENERAL SETTINGS REMOVED FROM THIS SCRIPT");
}
main().catch(console.error).finally(() => prisma.$disconnect());
