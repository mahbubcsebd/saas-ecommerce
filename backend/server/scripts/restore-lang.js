const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    await prisma.language.updateMany({ data: { isDefault: false } });
    const en = await prisma.language.update({ where: { code: 'en' }, data: { isDefault: true } });
    console.log("Set English as default:", en);
    const langs = await prisma.language.findMany();
    console.log("Current languages:", langs);
}
main().catch(console.error).finally(() => prisma.$disconnect());
