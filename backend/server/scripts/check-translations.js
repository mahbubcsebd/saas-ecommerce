const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log("LANGUAGES:", await prisma.language.count());
    console.log("UI TRANSLATIONS:", await prisma.uiTranslation.count());
    console.log("NAMESPACES:", await prisma.translationNamespace.count());

    const namespaces = await prisma.translationNamespace.findMany();
    console.log("NAMESPACE LIST:", namespaces.map(n => n.name));
}
main().catch(console.error).finally(() => prisma.$disconnect());
