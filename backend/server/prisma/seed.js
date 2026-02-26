const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Import modular seed data
const usersData = require('./seed-data/users.data');
const addressesData = require('./seed-data/addresses.data');
const categoriesData = require('./seed-data/categories.data');
const productsData = require('./seed-data/products.data');
const productsExtraData = require('./seed-data/products-extra.data');
const heroSlidesData = require('./seed-data/hero-slides.data');
const discountsData = require('./seed-data/discounts.data');
const settingsData = require('./seed-data/settings.data');
const shippingData = require('./seed-data/shipping.data');
const suppliersData = require('./seed-data/suppliers.data');

// Combine products
const allProductsData = [...productsData, ...productsExtraData];

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
  console.log('🌱 Starting comprehensive database seed for Mahbub Shop...\n');

  // --- 1. Cleanup ---
  const safeDelete = async (modelName) => {
    try {
      if (prisma[modelName]) {
        await prisma[modelName].deleteMany({});
      }
    } catch (e) {
      console.warn(`  ⚠️ Failed to delete ${modelName}: ${e.message}`);
    }
  };

  console.log('🧹 Cleaning up old data...');

  // Specific deletes for self-relations & problematic links
  await safeDelete('landingPage');

  const models = [
    'generalSetting', 'currencySetting', 'contactSetting', 'seoSetting', 'emailSetting', 'appearanceSetting', 'paymentSetting', 'orderSetting',
    'stockMovement', 'discountUsage', 'productDiscount', 'discount',
    'review', 'wishlist', 'invoice', 'returnRequest', 'orderItem', 'order', 'cartItem', 'cart',
    'shippingRate', 'shippingZone', 'purchaseItem', 'purchase', 'supplier',
    'productVariant', 'product', 'heroSlide', 'address', 'session', 'account'
  ];

  for (const model of models) {
      await safeDelete(model);
  }

  // Categories (Hierarchy)
  try {
    if (prisma.category) {
       await prisma.category.deleteMany({ where: { parentId: { not: null } } });
       await prisma.category.deleteMany({});
    }
  } catch (e) {
      console.warn(`  ⚠️ Failed to delete category: ${e.message}`);
  }

  await safeDelete('user');

  console.log('🗑️  Cleanup complete.\n');

  // --- 2. Create Users ---
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123@!', salt);
  const userMap = {};
  const users = [];

  for (const userData of usersData) {
    const user = await prisma.user.create({
      data: { ...userData, password: hashedPassword },
    });
    userMap[userData.email] = user;
    users.push(user);
    console.log(`👤 User: ${user.email} (${user.role})`);
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
  console.log(`📍 Addresses created\n`);

  // --- 4. Create Shipping Zones & Rates ---
  console.log(`🚚 Creating Shipping Configuration...`);
  const zones = [];
  try {
    for (const zoneData of shippingData) {
        const { rates, ...zone } = zoneData;
        const createdZone = await prisma.shippingZone.create({ data: zone });
        zones.push(createdZone);

        if (rates && rates.length > 0) {
        await prisma.shippingRate.createMany({
            data: rates.map(r => ({ ...r, zoneId: createdZone.id }))
        });
        }
    }
    console.log(`🚚 ${zones.length} Shipping Zones created\n`);
  } catch (e) { console.error("❌ Failed Shipping Zones", e.message); }

  // --- 5. Create Suppliers ---
  console.log(`🏭 Creating Suppliers...`);
  const suppliers = [];
  try {
    for (const supplierData of suppliersData) {
        const supplier = await prisma.supplier.create({ data: supplierData });
        suppliers.push(supplier);
    }
    console.log(`🏭 ${suppliers.length} Suppliers created\n`);
  } catch (e) { console.error("❌ Failed Suppliers", e.message); }


  // --- 6. Create Categories ---
  const categoryMap = {};
  console.log(`📂 Creating Categories...`);
  for (const parent of categoriesData) {
    const { children, ...parentData } = parent;
    const createdParent = await prisma.category.create({ data: parentData });
    categoryMap[parent.slug] = createdParent.id;

    // Add fallback for generic matching if needed
    categoryMap[parent.slug.split('-')[0]] = createdParent.id;

    if (children && children.length > 0) {
      for (const child of children) {
        const createdChild = await prisma.category.create({
          data: { ...child, parentId: createdParent.id }
        });
        categoryMap[child.slug] = createdChild.id;
      }
    }
  }
  console.log(`📂 Categories created\n`);

  // --- 7. Create Products ---
  const productMap = {};
  const allProducts = [];
  console.log(`📦 Creating ${allProductsData.length} products...\n`);

  for (const p of allProductsData) {
    const { variants, categorySlug, ...data } = p;
    let categoryId = categoryMap[categorySlug];

    if (!categoryId) {
        if (categorySlug === 'gym-equipment' || categorySlug === 'jerseys') {
             categoryId = categoryMap['sports'];
        }
    }

    if (!categoryId) {
      console.warn(`⚠️  Category '${categorySlug}' not found for ${p.name}`);
      categoryId = Object.values(categoryMap)[0];
    }

    try {
        const createdProduct = await prisma.product.create({
          data: {
            ...data,
            categoryId,
            sku: `PROD-${data.slug.substring(0, 5).toUpperCase()}-${Math.floor(Math.random() * 100000)}`,
            barcode: Math.floor(Math.random() * 1000000000000).toString(),
            stock: variants.length > 0 ? variants.reduce((acc, v) => acc + (v.stock || 20), 0) : 50,
            status: 'PUBLISHED',
            variants: { create: createVariants(p, variants) }
          },
          include: { variants: true }
        });
        productMap[p.slug] = createdProduct.id;
        allProducts.push(createdProduct);

        // Create Initial Stock Movement (Purchase)
        if (users.length > 0 && suppliers.length > 0) {
            await prisma.stockMovement.create({
                data: {
                    productId: createdProduct.id,
                    type: 'PURCHASE',
                    quantity: createdProduct.stock,
                    previousQty: 0,
                    newQty: createdProduct.stock,
                    reason: 'Initial Seeding',
                    performedBy: users[0].id, // Admin
                    supplierId: suppliers[0].id
                }
            });
        }
        console.log(`  ✅ ${createdProduct.name}`);
    } catch(e) {
        console.error(`  ❌ Failed to create product ${p.name}: ${e.message}`);
    }
  }

  // --- 8. Create Discounts ---
  console.log(`\n💰 Creating discounts...\n`);
  try {
      for (const d of discountsData) {
        const { categorySlugs, targetProductSlug, ...data } = d;
        if (categorySlugs) data.categoryIds = categorySlugs.map(slug => categoryMap[slug]).filter(Boolean);
        const discount = await prisma.discount.create({ data });
        if (targetProductSlug && productMap[targetProductSlug]) {
          await prisma.productDiscount.create({
            data: { productId: productMap[targetProductSlug], discountId: discount.id }
          });
        }
        console.log(`  💰 ${discount.code}`);
      }
  } catch (err) {
      console.error("❌ Failed to create discounts:", err.message);
  }

  // --- 9. Create Orders & Reviews ---
  const normalUser = users.find(u => u.role === 'USER') || users[0];
  const orderCount = 5;
  console.log(`\n🛍️  Genearting ${orderCount} dummy orders...`);

  try {
      for (let i = 0; i < orderCount; i++) {
            // Pick random products
            const randomProducts = allProducts.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 1);
            if (randomProducts.length === 0) continue;

            const orderItems = [];
            let subtotal = 0;

            for (const product of randomProducts) {
                 const variant = product.variants[0]; // Simple logic
                 const quantity = Math.floor(Math.random() * 2) + 1;
                 const price = variant ? (variant.sellingPrice || product.sellingPrice) : product.sellingPrice;
                 const total = price * quantity;

                 orderItems.push({
                     productId: product.id,
                     variantId: variant?.id,
                     name: product.name,
                     unitPrice: price,
                     salePrice: price,
                     quantity,
                     total
                 });
                 subtotal += total;

                 // Advanced Review Seeding
                 const numReviews = Math.floor(Math.random() * 4); // 0 to 3 reviews per product
                 for (let r = 0; r < numReviews; r++) {
                     const statuses = ['PENDING', 'APPROVED', 'REJECTED'];
                     const status = statuses[Math.floor(Math.random() * statuses.length)];
                     const comments = [
                         "Great product! Really loved it.",
                         "It's decent, but could be better.",
                         "Worst purchase ever. Do not recommend.",
                         "Exactly as described. Fast shipping too!",
                         "Very disappointed with the quality."
                     ];
                     const rating = Math.floor(Math.random() * 5) + 1; // 1 to 5

                     await prisma.review.create({
                         data: {
                             rating,
                             comment: comments[Math.floor(Math.random() * comments.length)],
                             userId: r % 2 === 0 ? normalUser.id : users[Math.floor(Math.random() * users.length)]?.id || normalUser.id,
                             productId: product.id,
                             status,
                             isFlagged: Math.random() > 0.8, // 20% chance of being flagged
                             adminReply: status === 'REJECTED' ? "We apologize for the inconvenience." : null
                         }
                     });
                 }
            }

            const shippingCost = 60;
            const total = subtotal + shippingCost;

            await prisma.order.create({
                data: {
                    orderNumber: `ORD-SEED-${1000 + i}`,
                    invoiceNumber: `INV-SEED-${1000 + i}`,
                    userId: normalUser.id,
                    items: { create: orderItems },
                    source: 'ONLINE',
                    subtotal,
                    discountAmount: 0,
                    vatAmount: 0,
                    tax: 0,
                    total,
                    shippingCost,
                    paymentMethod: 'COD',
                    paymentStatus: 'PENDING',
                    status: 'PENDING',
                    shippingAddress: {
                        name: normalUser.firstName,
                        address: "123 Seed Street",
                        city: "Dhaka",
                        phone: "01700000000"
                    }
                }
            });
      }
      console.log(`  🛍️ Orders Created`);
  } catch (err) {
      console.error("❌ Failed to create orders:", err.message);
  }

  // --- 10. Hero Slides ---
  try {
    await prisma.heroSlide.createMany({ data: heroSlidesData });
    console.log(`\n🖼️  Hero slides created`);
  } catch (e) { console.error("❌ Failed Hero Slides", e.message); }

  // --- 11. Global Settings ---
  try {
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
  } catch (e) {
      console.error("❌ Failed Settings:", e.message);
  }

  console.log('\n✅ Seed completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
