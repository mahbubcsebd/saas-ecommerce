const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const predefinedAttributes = [
  {
    name: 'color',
    label: 'Color',
    values: [
      'Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Orange', 'Purple',
      'Pink', 'Brown', 'Gray', 'Navy', 'Beige', 'Gold', 'Silver'
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
