const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Import modular seed data
const usersData = require('./seed-data/users.data');
const addressesData = require('./seed-data/addresses.data');
const categoriesData = require('./seed-data/categories.data');
const productsData = require('./seed-data/products.data');
const heroSlidesData = require('./seed-data/hero-slides.data');
const discountsData = require('./seed-data/discounts.data');
const settingsData = require('./seed-data/settings.data');

// Variant creation helper
const createVariants = (p, variantsData) => {
  if (!variantsData || variantsData.length === 0) return [];
  return variantsData.map(v => ({
    name: v.name,
    sku: v.sku || `${p.slug.substring(0,6).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    barcode: v.barcode || Math.floor(Math.random() * 1000000000).toString(),
    basePrice: v.price || p.basePrice,
    sellingPrice: v.price || p.sellingPrice,
    stock: v.stock || 20,
    attributes: v.attributes,
    images: v.images && v.images.length > 0 ? v.images : p.images
  }));
};

async function main() {
  console.log('🌱 Starting comprehensive database seed...\n');

  // --- 1. Cleanup ---
  // Helper for safe deletion
  const safeDelete = async (modelName) => {
    try {
      if (prisma[modelName]) {
        await prisma[modelName].deleteMany({});
        // console.log(`  Deleted ${modelName}`);
      }
    } catch (e) {
      console.warn(`  ⚠️ Failed to delete ${modelName}: ${e.message}`);
    }
  };

  // --- 1. Cleanup ---
  console.log('🧹 Cleaning up old data...');
  await safeDelete('generalSetting');
  await safeDelete('currencySetting');
  await safeDelete('contactSetting');
  await safeDelete('seoSetting');
  await safeDelete('emailSetting');
  await safeDelete('appearanceSetting');
  await safeDelete('paymentSetting');
  await safeDelete('orderSetting');

  await safeDelete('stockMovement');
  await safeDelete('discountUsage');
  await safeDelete('productDiscount');
  await safeDelete('discount');
  await safeDelete('review');
  await safeDelete('wishlist');
  await safeDelete('orderItem');
  await safeDelete('order');
  await safeDelete('cartItem');
  await safeDelete('cart');
  await safeDelete('productVariant');
  await safeDelete('product');

  // Special handling for Category (Hierarchy)
  try {
    if (prisma.category) {
       // Delete children first
       await prisma.category.deleteMany({ where: { parentId: { not: null } } });
       // Delete parents (roots)
       await prisma.category.deleteMany({});
       // console.log('  Deleted category');
    }
  } catch (e) {
      console.warn(`  ⚠️ Failed to delete category: ${e.message}`);
  }

  await safeDelete('address');
  await safeDelete('user');
  await safeDelete('heroSlide');
  console.log('🗑️  Cleanup complete.\n');

  // --- 2. Create Users ---
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123@!', salt);
  const userMap = {};

  for (const userData of usersData) {
    const user = await prisma.user.create({
      data: { ...userData, password: hashedPassword },
    });
    userMap[userData.email] = user;
    console.log(`👤 User: ${user.email}`);
  }

  // --- 3. Create Addresses ---
  for (const addressData of addressesData) {
    const { userEmail, ...address } = addressData;
    const user = userMap[userEmail];
    if (user) {
      await prisma.address.create({
        data: { ...address, userId: user.id },
      });
    }
  }
  console.log(`📍 ${addressesData.length} addresses created\n`);

  // --- 4. Create Categories ---
  const categoryMap = {};
  for (const parent of categoriesData) {
    const { children, ...parentData } = parent;
    const createdParent = await prisma.category.create({ data: parentData });
    categoryMap[parent.slug] = createdParent.id;
    console.log(`📂 ${parent.name}`);

    if (children && children.length > 0) {
      for (const child of children) {
        const createdChild = await prisma.category.create({
          data: { ...child, parentId: createdParent.id }
        });
        categoryMap[child.slug] = createdChild.id;
      }
    }
  }
  console.log();

  // --- 5. Create Products ---
  const productMap = {};
  console.log(`📦 Creating ${productsData.length} products...\n`);

  for (const p of productsData) {
    const { variants, categorySlug, ...data } = p;
    const categoryId = categoryMap[categorySlug];

    if (!categoryId) {
      console.warn(`⚠️  Category '${categorySlug}' not found for ${p.name}`);
      continue;
    }

    const createdProduct = await prisma.product.create({
      data: {
        ...data,
        categoryId,
        sku: `PROD-${data.slug.substring(0, 5).toUpperCase()}-${Math.floor(Math.random() * 100000)}`,
        barcode: Math.floor(Math.random() * 1000000000000).toString(),
        stock: variants.length > 0 ? variants.reduce((acc, v) => acc + (v.stock || 20), 0) : 10,
        status: 'PUBLISHED',
        variants: { create: createVariants(p, variants) }
      }
    });
    productMap[p.slug] = createdProduct.id;
    console.log(`  ✅ ${createdProduct.name}`);
  }

  // --- 6. Create Discounts ---
  console.log(`\n💰 Creating discounts...\n`);
  for (const d of discountsData) {
    const { categorySlugs, targetProductSlug, ...data } = d;

    // Resolve category IDs
    if (categorySlugs) {
      data.categoryIds = categorySlugs.map(slug => categoryMap[slug]).filter(Boolean);
    }

    const discount = await prisma.discount.create({ data });

    // Link to product if specified
    if (targetProductSlug && productMap[targetProductSlug]) {
      await prisma.productDiscount.create({
        data: {
          productId: productMap[targetProductSlug],
          discountId: discount.id
        }
      });
    }
    console.log(`  💰 ${discount.code}`);
  }

  // --- 7. Create Hero Slides ---
  await prisma.heroSlide.createMany({ data: heroSlidesData });
  console.log(`\n🖼️  ${heroSlidesData.length} hero slides created`);

  console.log('\n✅ Seed completed!');
  console.log(`   - ${Object.keys(userMap).length} users`);
  console.log(`   - ${addressesData.length} addresses`);
  console.log(`   - ${Object.keys(categoryMap).length} categories`);
  console.log(`   - ${productsData.length} products`);
  console.log(`   - ${discountsData.length} discounts`);
  console.log(`   - ${heroSlidesData.length} hero slides\n`);

  // --- 8. Create Global Settings ---
  console.log(`⚙️  Seeding Global Settings...`);
  await prisma.generalSetting.create({ data: settingsData.general });
  await prisma.currencySetting.create({ data: settingsData.currency });
  await prisma.contactSetting.create({ data: settingsData.contact });
  await prisma.seoSetting.create({ data: settingsData.seo });
  await prisma.emailSetting.create({ data: settingsData.email });
  await prisma.appearanceSetting.create({ data: settingsData.appearance });
  await prisma.paymentSetting.create({ data: settingsData.payment });
  await prisma.orderSetting.create({ data: settingsData.order });
  console.log(`   - Settings created`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
