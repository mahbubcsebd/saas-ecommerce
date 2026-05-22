const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const predefinedAttributes = [
  {
    name: 'color',
    label: 'Color',
    values: [
      'Red:#EF4444',
      'Blue:#3B82F6',
      'Green:#10B981',
      'Black:#000000',
      'White:#FFFFFF',
      'Yellow:#FBBF24',
      'Orange:#F97316',
      'Purple:#8B5CF6',
      'Pink:#EC4899',
      'Brown:#78350F',
      'Gray:#6B7280',
      'Navy:#1E3A8A',
      'Beige:#F5F5DC',
      'Gold:#FFD700',
      'Silver:#C0C0C0'
    ],
  },
  {
    name: 'size',
    label: 'Size',
    values: [
      'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
      '28', '30', '32', '34', '36', '38', '40', '42'
    ],
  },
  {
    name: 'storage',
    label: 'Storage',
    values: ['64GB', '128GB', '256GB', '512GB', '1TB', '2TB'],
  },
  {
    name: 'weight',
    label: 'Weight',
    values: ['100g', '250g', '500g', '1kg', '2kg', '5kg'],
  },
  {
    name: 'style',
    label: 'Style',
    values: ['Casual', 'Formal', 'Vintage', 'Modern', 'Sporty'],
  },
  {
    name: 'pattern',
    label: 'Pattern',
    values: ['Solid', 'Striped', 'Checkered', 'Printed', 'Camouflage', 'Floral'],
  },
  {
    name: 'material',
    label: 'Material',
    values: ['Cotton', 'Polyester', 'Leather', 'Silk', 'Wool', 'Denim'],
  }
];

async function seedAttributes() {
  console.log('🌱 Seeding predefined attributes...');

  for (const attr of predefinedAttributes) {
    await prisma.attribute.upsert({
      where: { name: attr.name },
      update: {
        label: attr.label,
        values: attr.values,
      },
      create: {
        name: attr.name,
        label: attr.label,
        values: attr.values,
      },
    });
    console.log(`✅ Seeded/Upserted attribute: ${attr.label}`);
  }
}

if (require.main === module) {
  seedAttributes()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

module.exports = seedAttributes;
