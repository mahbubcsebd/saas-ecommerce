const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed for Mahbub Shop...');

  // --- 1. Clean up existing data ---
  try {
    // Delete in order of dependency (child first)
    await prisma.stockMovement.deleteMany();
    await prisma.discountUsage.deleteMany();
    await prisma.productDiscount.deleteMany();
    await prisma.discount.deleteMany();
    await prisma.review.deleteMany();
    await prisma.wishlist.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.cart.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
    // Delete categories - might need to loop if self-referencing check fails,
    // but deleteMany usually handles it if cascading isn't blocked by DB constraints.
    // MongoDB usually okay.
    await prisma.category.deleteMany();
    await prisma.address.deleteMany();
    await prisma.user.deleteMany();
    await prisma.heroSlide.deleteMany();

    console.log('🗑️  Cleared existing data.');
  } catch (e) {
    console.log('⚠️  Data clear failed or empty (expected on first run):', e.message);
  }

  // --- 2. Create Users ---
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123@!', salt);

  const admin = await prisma.user.create({
    data: {
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@example.com',
      username: 'sysadmin',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      bio: 'System Administrator',
      phone: '+8801700000000',
    },
  });

  const customer = await prisma.user.create({
    data: {
      firstName: 'Mahbub',
      lastName: 'User',
      email: 'user@example.com',
      username: 'mahbub_user',
      password: hashedPassword,
      role: 'USER',
      isActive: true,
      phone: '+8801900000000',
      addresses: {
        create: {
          type: 'Home',
          name: 'Mahbub User',
          phone: '+8801900000000',
          street: '123 Digital Road',
          city: 'Dhaka',
          zipCode: '1212',
          country: 'Bangladesh',
          isDefault: true
        }
      }
    },
  });

  console.log(`👤 Users created: Admin(${admin.email}), Customer(${customer.email})`);

  // --- 3. Create Categories & Subcategories ---
  // Structure: Parent -> Children
  const categoriesStructure = [
    {
      name: 'Electronics', slug: 'electronics', icon: 'Cpu', isHomeShown: true, order: 1,
      children: [
        { name: 'Smartphones', slug: 'smartphones', icon: 'Smartphone' },
        { name: 'Laptops', slug: 'laptops', icon: 'Laptop' },
        { name: 'Headphones', slug: 'headphones', icon: 'Headphones' },
        { name: 'Cameras', slug: 'cameras', icon: 'Camera' }
      ]
    },
    {
      name: 'Fashion', slug: 'fashion', icon: 'Shirt', isHomeShown: true, order: 2,
      children: [
        { name: 'Men', slug: 'men-fashion', icon: 'User' },
        { name: 'Women', slug: 'women-fashion', icon: 'UserCheck' },
        { name: 'Kids', slug: 'kids-fashion', icon: 'Baby' },
        { name: 'Shoes', slug: 'shoes', icon: 'Footprints' }
      ]
    },
    {
      name: 'Home & Living', slug: 'home-living', icon: 'Home', isHomeShown: true, order: 3,
      children: [
        { name: 'Furniture', slug: 'furniture', icon: 'Armchair' },
        { name: 'Decor', slug: 'home-decor', icon: 'Image' },
        { name: 'Kitchen', slug: 'kitchen', icon: 'Utensils' }
      ]
    },
    {
      name: 'Sports', slug: 'sports', icon: 'Dumbbell', isHomeShown: false, order: 4,
      children: [
        { name: 'Gym Equipment', slug: 'gym-equipment', icon: 'Dumbbell' },
        { name: 'Jerseys', slug: 'jerseys', icon: 'Shirt' }
      ]
    }
  ];

  const categoryMap = {}; // slug -> id

  for (const parent of categoriesStructure) {
    const { children, ...parentData } = parent;
    const createdParent = await prisma.category.create({ data: parentData });
    categoryMap[parent.slug] = createdParent.id;
    console.log(`📂 Category created: ${parent.name}`);

    if (children && children.length > 0) {
      for (const child of children) {
        const createdChild = await prisma.category.create({
          data: {
            ...child,
            parentId: createdParent.id
          }
        });
        categoryMap[child.slug] = createdChild.id;
      }
    }
  }

  // --- 4. Define Products (20 items) ---

  // Helper to generate variants
  const createVariants = (p, variantsData) => {
    if (!variantsData || variantsData.length === 0) return [];
     return variantsData.map(v => ({
        name: v.name,
        sku: v.sku || `${p.slug.substring(0,6)}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        barcode: v.barcode || Math.floor(Math.random() * 1000000000).toString(),
        basePrice: v.price || p.basePrice,
        sellingPrice: v.price || p.sellingPrice,
        stock: v.stock || 20,
        attributes: v.attributes,
        images: v.images && v.images.length > 0 ? v.images : p.images
     }));
  };

  // 20+ Products
  const productsData = [
    // --- Electronics: Smartphones ---
    {
      name: "iPhone 15 Pro Max",
      slug: "iphone-15-pro-max",
      basePrice: 1199.99,
      sellingPrice: 1199.99,
      description: "The ultimate iPhone with Titanium design and A17 Pro chip.",
      categorySlug: 'smartphones',
      brand: "Apple",
      tags: ["iphone", "apple", "5g", "titanium"],
      isNewArrival: true,
      isFeatured: true,
      images: ["https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=800"],
      variants: [
        { name: "Natural Titanium / 256GB", price: 1199.99, stock: 15, attributes: { "Color": "Natural Titanium", "Storage": "256GB" } },
        { name: "Blue Titanium / 512GB", price: 1399.99, stock: 8, attributes: { "Color": "Blue Titanium", "Storage": "512GB" } }
      ]
    },
    {
      name: "Samsung Galaxy S24 Ultra",
      slug: "samsung-s24-ultra",
      basePrice: 1299.99,
      sellingPrice: 1249.99,
      categorySlug: 'smartphones',
      brand: "Samsung",
      description: "Galaxy AI is here. Welcome to the era of mobile AI.",
      images: ["https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&q=80&w=800"],
      variants: [
        { name: "Titanium Gray / 512GB", price: 1249.99, stock: 10, attributes: { "Color": "Titanium Gray", "Storage": "512GB" } }
      ]
    },
    {
      name: "Google Pixel 8 Pro",
      slug: "pixel-8-pro",
      basePrice: 999.00,
      sellingPrice: 899.00,
      categorySlug: 'smartphones',
      brand: "Google",
      description: "The pro-level phone from Google with advanced AI cameras.",
      images: ["https://images.unsplash.com/photo-1695421590506-c87cb71a1795?auto=format&fit=crop&q=80&w=800"],
      variants: [
        { name: "Bay / 128GB", price: 899.00, stock: 25, attributes: { "Color": "Bay Blue", "Storage": "128GB" } }
      ]
    },
    // --- Electronics: Laptops ---
    {
      name: "MacBook Pro 16 M3 Max",
      slug: "macbook-pro-16-m3",
      basePrice: 3499.00,
      sellingPrice: 3499.00,
      categorySlug: 'laptops',
      brand: "Apple",
      description: "Mind-blowing performance with the M3 Max chip.",
      isFeatured: true,
      images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&q=80&w=800"],
      variants: [
        { name: "Space Black / 1TB / 36GB", price: 3499.00, stock: 5, attributes: { "Color": "Space Black", "Ram": "36GB" } }
      ]
    },
    {
      name: "Dell XPS 15",
      slug: "dell-xps-15",
      basePrice: 2100.00,
      sellingPrice: 1999.00,
      categorySlug: 'laptops',
      brand: "Dell",
      description: "High performance creator laptop with 4K OLED display.",
      images: ["https://images.unsplash.com/photo-1593642632823-8f78536788c6?auto=format&fit=crop&q=80&w=800"],
      variants: [
         { name: "Platinum Silver / 32GB", price: 1999.00, stock: 12, attributes: { "Color": "Silver", "Ram": "32GB" } }
      ]
    },
     // --- Electronics: Headphones ---
    {
      name: "Sony WH-1000XM5",
      slug: "sony-wh-1000xm5",
      basePrice: 399.00,
      sellingPrice: 348.00,
      categorySlug: 'headphones',
      brand: "Sony",
      description: "Industry leading noise canceling headphones.",
      images: ["https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=800"],
      variants: [
        { name: "Black", stock: 50, attributes: { "Color": "Black" } },
        { name: "Silver", stock: 30, attributes: { "Color": "Silver" } }
      ]
    },
    {
       name: "AirPods Pro (2nd Gen)",
       slug: "airpods-pro-2",
       basePrice: 249.00,
       sellingPrice: 239.00,
       categorySlug: 'headphones',
       brand: "Apple",
       description: "Rich audio. Magical noise cancellation.",
       images: ["https://images.unsplash.com/photo-1606841837239-c5a1a4a07afe?auto=format&fit=crop&q=80&w=800"],
       variants: [ { name: "White", stock: 100, attributes: { "Color": "White" } } ]
    },

    // --- Fashion: Men ---
    {
      name: "Classic Denim Jacket",
      slug: "classic-denim-jacket",
      basePrice: 89.00,
      sellingPrice: 79.00,
      categorySlug: 'men-fashion',
      brand: "Levis",
      description: "A timeless classic for your wardrobe.",
      images: ["https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&q=80&w=800"],
      variants: [
        { name: "Blue / L", stock: 20, attributes: { "Color": "Blue", "Size": "L" } },
        { name: "Blue / XL", stock: 15, attributes: { "Color": "Blue", "Size": "XL" } }
      ]
    },
    {
      name: "Oxford Cotton Shirt",
      slug: "oxford-cotton-shirt",
      basePrice: 45.00,
      sellingPrice: 45.00,
      categorySlug: 'men-fashion',
      brand: "Uniqlo",
      description: "Comfortable and breathable 100% cotton shirt.",
      images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800"],
      variants: [
         { name: "White / M", stock: 30, attributes: { "Color": "White", "Size": "M" } },
         { name: "Blue / L", stock: 25, attributes: { "Color": "Blue", "Size": "L" } }
      ]
    },
    // --- Fashion: Women ---
    {
      name: "Floral Summer Dress",
      slug: "floral-summer-dress",
      basePrice: 59.00,
      sellingPrice: 49.00,
      categorySlug: 'women-fashion',
      brand: "Zara",
      description: "Lightweight and airy, perfect for summer.",
      images: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800"],
      variants: [
        { name: "Red Floral / S", stock: 20, attributes: { "Pattern": "Red Floral", "Size": "S" } }
      ]
    },
    {
       name: "High Waist Skinny Jeans",
       slug: "high-waist-skinny-jeans",
       basePrice: 49.00,
       sellingPrice: 49.00,
       categorySlug: 'women-fashion',
       brand: "HM",
       description: "Stretchy comfortable jeans.",
       images: ["https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=800"],
       variants: [ { name: "Black / 28", stock: 40, attributes: { "Color": "Black", "Waist": "28" } } ]
    },

    // --- Fashion: Shoes ---
    {
      name: "Nike Air Jordan 1",
      slug: "nike-air-jordan-1",
      basePrice: 180.00,
      sellingPrice: 180.00,
      categorySlug: 'shoes',
      brand: "Nike",
      description: "The sneaker that started it all.",
      isFeatured: true,
      images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800"],
      variants: [ { name: "Chicago / US 10", stock: 5, attributes: { "Color": "Red/White", "Size": "US 10" } } ]
    },
    {
      name: "Adidas Ultraboost",
      slug: "adidas-ultraboost",
      basePrice: 160.00,
      sellingPrice: 140.00,
      categorySlug: 'shoes',
      brand: "Adidas",
      description: "Energy returning boost technology.",
      images: ["https://images.unsplash.com/photo-1587563871167-1ee9c731aef4?auto=format&fit=crop&q=80&w=800"],
      variants: [ { name: "Black / US 9", stock: 20, attributes: { "Color": "Black", "Size": "US 9" } } ]
    },

     // --- Home & Living: Furniture ---
    {
      name: "Eames Lounge Chair Replica",
      slug: "eames-lounge-chair",
      basePrice: 850.00,
      sellingPrice: 850.00,
      categorySlug: 'furniture',
      brand: "Luxury Home",
      description: "Mid-century modern style lounge chair with ottoman.",
      images: ["https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=800"],
      variants: [ { name: "Walnut / Black Leather", stock: 3, attributes: { "Wood": "Walnut", "Material": "Leather" } } ]
    },
    {
      name: "Minimalist Coffee Table",
      slug: "minimalist-coffee-table",
      basePrice: 120.00,
      sellingPrice: 99.00,
      categorySlug: 'furniture',
      brand: "Ikea Style",
      description: "Simple wooden coffee table for modern living rooms.",
      images: ["https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&q=80&w=800"],
      variants: [ { name: "Oak", stock: 15, attributes: { "Wood": "Oak" } } ]
    },

    // --- Home & Living: Decor ---
    {
      name: "Ceramic Flower Vase",
      slug: "ceramic-flower-vase",
      basePrice: 35.00,
      sellingPrice: 29.00,
      categorySlug: 'home-decor',
      brand: "Artisan",
      description: "Handcrafted ceramic vase.",
      images: ["https://images.unsplash.com/photo-1581783342308-f792ca11df53?auto=format&fit=crop&q=80&w=800"],
      variants: [ { name: "White Matte", stock: 50, attributes: { "Color": "White" } } ]
    },
    {
      name: "Wall Art Abstract",
      slug: "wall-art-abstract",
      basePrice: 60.00,
      sellingPrice: 60.00,
      categorySlug: 'home-decor',
      brand: "Gallery",
      description: "Large abstract canvas print.",
      images: ["https://images.unsplash.com/photo-1582201942988-13e60e4556ee?auto=format&fit=crop&q=80&w=800"],
      variants: [ { name: "24x36 Inch", stock: 10, attributes: { "Size": "24x36" } } ]
    },

    // --- Sports ---
    {
       name: "Adjustable Dumbbell Set",
       slug: "adjustable-dumbbell-set",
       basePrice: 200.00,
       sellingPrice: 180.00,
       categorySlug: 'gym-equipment',
       brand: "PowerBlock",
       description: "Space saving adjustable dumbbells 5-50 lbs.",
       images: ["https://images.unsplash.com/photo-1638531751811-12c858be16ea?auto=format&fit=crop&q=80&w=800"],
       variants: [ { name: "Pair", stock: 15, attributes: { "Type": "Pair" } } ]
    },
    {
       name: "Yoga Mat Pro",
       slug: "yoga-mat-pro",
       basePrice: 40.00,
       sellingPrice: 35.00,
       categorySlug: 'gym-equipment',
       brand: "Lululemon",
       description: "Non-slip yoga mat for superior grip.",
       images: ["https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&q=80&w=800"],
       variants: [ { name: "Purple", stock: 60, attributes: { "Color": "Purple" } } ]
    },
    {
       name: "Football Jersey Home Kit",
       slug: "football-jersey-home",
       basePrice: 90.00,
       sellingPrice: 90.00,
       categorySlug: 'jerseys',
       brand: "Nike",
       description: "Official team jersey for the 2025/26 season.",
       images: ["https://images.unsplash.com/photo-1521747116042-5a810fda9664?auto=format&fit=crop&q=80&w=800"],
       variants: [ { name: "L", stock: 100, attributes: { "Size": "L" } } ]
    },
    // --- Additional Electronics: Smartphones ---
    {
      name: "OnePlus 12",
      slug: "oneplus-12",
      basePrice: 799.00,
      sellingPrice: 749.00,
      categorySlug: 'smartphones',
      brand: "OnePlus",
      description: "Flagship killer with 120Hz AMOLED display.",
      images: ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=800"],
      variants: [ { name: "Glacial White / 256GB", price: 749.00, stock: 20, attributes: { "Color": "Glacial White", "Storage": "256GB" } } ]
    },
    {
      name: "Xiaomi 14 Pro",
      slug: "xiaomi-14-pro",
      basePrice: 899.00,
      sellingPrice: 849.00,
      categorySlug: 'smartphones',
      brand: "Xiaomi",
      isNewArrival: true,
      description: "Premium flagship with Leica cameras.",
      images: ["https://images.unsplash.com/photo-1592286927505-b7e7857fe7c1?auto=format&fit=crop&q=80&w=800"],
      variants: [ { name: "Titanium Black / 512GB", price: 849.00, stock: 15, attributes: { "Color": "Titanium Black", "Storage": "512GB" } } ]
    },
    // --- Additional Electronics: Laptops ---
    {
      name: "Lenovo ThinkPad X1 Carbon",
      slug: "thinkpad-x1-carbon",
      basePrice: 1899.00,
      sellingPrice: 1799.00,
      categorySlug: 'laptops',
      brand: "Lenovo",
      description: "Business ultrabook with legendary keyboard.",
      images: ["https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=800"],
      variants: [ { name: "Black / 16GB", price: 1799.00, stock: 18, attributes: { "Color": "Black", "Ram": "16GB" } } ]
    },
    {
      name: "ASUS ROG Zephyrus G14",
      slug: "asus-rog-g14",
      basePrice: 1699.00,
      sellingPrice: 1599.00,
      categorySlug: 'laptops',
      brand: "ASUS",
      description: "Compact gaming laptop with AMD Ryzen.",
      images: ["https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&q=80&w=800"],
      variants: [ { name: "Moonlight White / 32GB", price: 1599.00, stock: 10, attributes: { "Color": "White", "Ram": "32GB" } } ]
    },
    // --- Additional Fashion ---
    {
      name: "Premium Cotton T-Shirt",
      slug: "premium-cotton-tshirt",
      basePrice: 35.00,
      sellingPrice: 29.00,
      categorySlug: 'men-fashion',
      brand: "Uniqlo",
      description: "Soft premium cotton, perfect fit.",
      images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800"],
      variants: [
        { name: "White / M", stock: 50, attributes: { "Color": "White", "Size": "M" } },
        { name: "Black / L", stock: 45, attributes: { "Color": "Black", "Size": "L" } }
      ]
    },
    {
      name: "Women Floral Dress",
      slug: "women-floral-dress",
      basePrice: 89.00,
      sellingPrice: 79.00,
      categorySlug: 'women-fashion',
      brand: "Zara",
      isNewArrival: true,
      description: "Elegant floral print summer dress.",
      images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800"],
      variants: [ { name: "Blue / S", stock: 25, attributes: { "Color": "Blue", "Size": "S" } } ]
    },
    {
      name: "Kids Cartoon Hoodie",
      slug: "kids-cartoon-hoodie",
      basePrice: 45.00,
      sellingPrice: 39.00,
      categorySlug: 'kids-fashion',
      brand: "GAP Kids",
      description: "Warm and comfy hoodie with fun prints.",
      images: ["https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=800"],
      variants: [ { name: "Red / 8Y", stock: 40, attributes: { "Color": "Red", "Size": "8Y" } } ]
    },
    // --- Additional Home & Kitchen ---
    {
      name: "Stainless Steel Cookware Set",
      slug: "cookware-set-steel",
      basePrice: 250.00,
      sellingPrice: 229.00,
      categorySlug: 'kitchen',
      brand: "Cuisinart",
      description: "Professional 10-piece cookware set.",
      images: ["https://images.unsplash.com/photo-1584990347449-39b4aa8e8b7a?auto=format&fit=crop&q=80&w=800"],
      variants: [ { name: "10 Piece Set", stock: 12, attributes: { "Type": "10 Pieces" } } ]
    },
    {
      name: "Digital Air Fryer",
      slug: "digital-air-fryer",
      basePrice: 120.00,
      sellingPrice: 99.00,
      categorySlug: 'kitchen',
      brand: "Ninja",
      isFeatured: true,
      description: "Healthy cooking with little to no oil.",
      images: ["https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&q=80&w=800"],
      variants: [ { name: "5.5L Black", stock: 30, attributes: { "Capacity": "5.5L", "Color": "Black" } } ]
    },
    // --- Additional Electronics: Cameras ---
    {
      name: "Canon EOS R6 Mark II",
      slug: "canon-eos-r6-ii",
      basePrice: 2499.00,
      sellingPrice: 2399.00,
      categorySlug: 'cameras',
      brand: "Canon",
      description: "Professional mirrorless camera with 24MP sensor.",
      images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800"],
      variants: [ { name: "Body Only", stock: 8, attributes: { "Type": "Body" } } ]
    }
  ];

  const productIds = {};

  console.log(`📦 Creating ${productsData.length} products...`);

  for (const p of productsData) {
      const { variants, categorySlug, ...data } = p;
      const categoryId = categoryMap[categorySlug];

      if (!categoryId) {
        console.warn(`⚠️  Category slug '${categorySlug}' not found for product '${p.name}'. Skipping.`);
        continue;
      }

      const createdProduct = await prisma.product.create({
          data: {
              ...data,
              categoryId: categoryId,
              sku: `PROD-${data.slug.substring(0, 5).toUpperCase()}-${Math.floor(Math.random() * 100000)}`,
              barcode: Math.floor(Math.random() * 1000000000000).toString(),
              stock: variants.length > 0 ? variants.reduce((acc, v) => acc + v.stock, 0) : 10,
              status: 'PUBLISHED',
              variants: {
                  create: createVariants(p, variants)
              }
          }
      });
      productIds[p.slug] = createdProduct.id;
      console.log(`✅ Product created: ${createdProduct.name}`);
  }

  // --- 5. Create Discounts ---
  // Schema: code, type(PERCENTAGE|FLAT|...), applicableOn(PRODUCT|CATEGORY|BRAND|CART...), value, etc.

  const discountData = [
      {
          name: "Flash Sale Electronics",
          code: "TECH10",
          description: "10% Off all Electronics",
          type: "PERCENTAGE",
          applicableOn: "CATEGORY",
          value: 10,
          categoryIds: [categoryMap['electronics']],
          startDate: new Date(),
          endDate: new Date('2030-12-31'),
          isActive: true
      },
      {
          name: "Launch Special",
          code: "LAUNCH50",
          description: "Flat $50 off iPhone 15 Pro Max",
          type: "FLAT",
          applicableOn: "PRODUCT",
          value: 50,
          startDate: new Date(),
          isActive: true,
          targetProductSlug: 'iphone-15-pro-max'
      },
      {
          name: "New User Bonus",
          code: "NEWUSER",
          description: "Flat $20 Off Cart > $200",
          type: "FLAT",
          applicableOn: "CART",
          value: 20,
          minOrderValue: 200,
          startDate: new Date(),
          isActive: true
      },
      {
        name: "Fashion Week",
        code: "STYLE25",
        description: "25% Off Fashion Category",
        type: "PERCENTAGE",
        applicableOn: "CATEGORY",
        value: 25,
        categoryIds: [categoryMap['fashion']], // Affects all children too if logic handles it, or explicit IDs
        startDate: new Date(),
        isActive: true
      }
  ];

  for (const d of discountData) {
      const { targetProductSlug, ...data } = d;

      const discount = await prisma.discount.create({
          data: data
      });

      if (targetProductSlug && productIds[targetProductSlug]) {
          await prisma.productDiscount.create({
              data: {
                  productId: productIds[targetProductSlug],
                  discountId: discount.id
              }
          });
      }
      console.log(`💰 Discount created: ${discount.code}`);
  }

  // --- 6. Create Hero Slides ---
  await prisma.heroSlide.createMany({
      data: [
          {
              image: "https://images.unsplash.com/photo-1621330387607-b27a3c7943d1?auto=format&fit=crop&q=80&w=1600",
              title: "New Arrivals",
              subtitle: "Experience the latest tech.",
              link: "/category/electronics",
              order: 1,
              isActive: true
          },
          {
              image: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=1600",
              title: "Winter Collection",
              subtitle: "Fashion that speaks.",
              link: "/category/fashion",
              order: 2,
              isActive: true
          },
          {
            image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=1600",
            title: "Home Makeover",
            subtitle: "Redefine your living space.",
            link: "/category/home-living",
            order: 3,
            isActive: true
        }
      ]
  });
  console.log(`🖼️  Hero slides created`);

  console.log('✅ Seeding verified and completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
