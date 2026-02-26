const prisma = require('./src/config/prisma');

async function seedLanguages() {
    console.log('🌱 Seeding Languages...');

    const languages = [
        {
            code: 'en',
            name: 'English',
            nativeName: 'English',
            flag: '🇺🇸',
            isDefault: true,
            isActive: true,
            isRtl: false
        },
        {
            code: 'bn',
            name: 'Bengali',
            nativeName: 'বাংলা',
            flag: '🇧🇩',
            isDefault: false,
            isActive: true,
            isRtl: false
        }
    ];

    for (const lang of languages) {
        const exists = await prisma.language.findUnique({
            where: { code: lang.code }
        });

        if (!exists) {
            await prisma.language.create({ data: lang });
            console.log(`✅ Created language: ${lang.name}`);
        } else {
            console.log(`ℹ️ Language already exists: ${lang.name}`);
        }
    }

    console.log('✅ Language seeding completed.');
}

seedLanguages()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
