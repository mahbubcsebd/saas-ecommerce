const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching all product variants...');
  const variants = await prisma.productVariant.findMany({});
  console.log(`Found ${variants.length} total variants.`);

  let updatedCount = 0;

  for (const variant of variants) {
    const attrs = variant.attributes;
    
    // Check if attributes is empty or []
    const isEmpty = !attrs || (Array.isArray(attrs) && attrs.length === 0) || (typeof attrs === 'object' && Object.keys(attrs).length === 0);

    if (isEmpty && variant.name) {
      console.log(`Processing empty variant attributes for: "${variant.name}" (SKU: ${variant.sku})`);
      
      const parts = variant.name.split('-').map(s => s.trim());
      if (parts.length > 0 && parts[0] !== '') {
        const parsedAttrs = [];
        parts.forEach((part, index) => {
          if (index === 0) {
            parsedAttrs.push({ type: 'Color', value: part });
          } else if (index === 1) {
            const isStorage = /gb|tb|mb/i.test(part);
            parsedAttrs.push({ type: isStorage ? 'Storage' : 'Size', value: part });
          } else {
            parsedAttrs.push({ type: `Option ${index + 1}`, value: part });
          }
        });

        console.log(`Updating attributes to:`, JSON.stringify(parsedAttrs));
        
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: {
            attributes: parsedAttrs
          }
        });
        
        updatedCount++;
      }
    }
  }

  console.log(`Successfully migrated ${updatedCount} product variants.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
