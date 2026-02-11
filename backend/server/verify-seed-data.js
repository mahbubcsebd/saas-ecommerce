const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findFirst({
    where: { slug: 'iphone-15-pro-max' },
    include: { variants: true }
  });

  if (!product) {
    console.error('❌ Product not found!');
    return;
  }

  console.log('✅ Found Product:', product.name);
  console.log('📊 Status:', product.status);
  console.log('📝 Specifications:', product.specifications);
  console.log('🔍 SEO Meta Title:', product.metaTitle);
  console.log('🎨 Variants:', product.variants.map(v => `${v.name} (${v.price})`).join(', '));

  const totalProducts = await prisma.product.count();
  console.log(`📊 Total Products in DB: ${totalProducts}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
