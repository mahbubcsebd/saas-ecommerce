// Products seed data - 30 products across all categories
module.exports = [
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
    isFeatured: true,
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
    isFeatured: true,
    images: ["https://images.unsplash.com/photo-1695421590506-c87cb71a1795?auto=format&fit=crop&q=80&w=800"],
    variants: [
      { name: "Bay / 128GB", price: 899.00, stock: 25, attributes: { "Color": "Bay Blue", "Storage": "128GB" } }
    ]
  },
  {
    name: "OnePlus 12",
    slug: "oneplus-12",
    basePrice: 799.00,
    sellingPrice: 749.00,
    categorySlug: 'smartphones',
    brand: "OnePlus",
    description: "Flagship killer with 120Hz AMOLED display.",
    isFeatured: true,
    images: ["https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=800"],
    variants: [{ name: "Glacial White / 256GB", price: 749.00, stock: 20, attributes: { "Color": "Glacial White", "Storage": "256GB" }}]
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
    variants: [{ name: "Titanium Black / 512GB", price: 849.00, stock: 15, attributes: { "Color": "Titanium Black", "Storage": "512GB" }}]
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
      { name: "Space Black / 1TB / 36GB", price: 3499.00, stock: 5, attributes: { "Color": "Space Black", "Ram": "36GB" }}
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
      { name: "Platinum Silver / 32GB", price: 1999.00, stock: 12, attributes: { "Color": "Silver", "Ram": "32GB" }}
    ]
  },
  {
    name: "Lenovo ThinkPad X1 Carbon",
    slug: "thinkpad-x1-carbon",
    basePrice: 1899.00,
    sellingPrice: 1799.00,
    categorySlug: 'laptops',
    brand: "Lenovo",
    description: "Business ultrabook with legendary keyboard.",
    isFeatured: true,
    images: ["https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&q=80&w=800"],
    variants: [{ name: "Black / 16GB", price: 1799.00, stock: 18, attributes: { "Color": "Black", "Ram": "16GB" }}]
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
    variants: [{ name: "Moonlight White / 32GB", price: 1599.00, stock: 10, attributes: { "Color": "White", "Ram": "32GB" }}]
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
    isFeatured: true,
    images: ["https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=800"],
    variants: [
      { name: "Black", stock: 50, attributes: { "Color": "Black" }},
      { name: "Silver", stock: 30, attributes: { "Color": "Silver" }}
    ]
  },
  {
    name: "AirPods Pro (2nd Gen)",
    slug: "airpods-pro-2",
    basePrice: 249.00,
    sellingPrice: 249.00,
    categorySlug: 'headphones',
    brand: "Apple",
    description: "Adaptive Audio with Active Noise Cancellation.",
    images: ["https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?auto=format&fit=crop&q=80&w=800"],
    variants: [{ name: "White / USB-C", stock: 100, attributes: { "Color": "White" }}]
  },

  // --- Electronics: Cameras ---
  {
    name: "Canon EOS R6 Mark II",
    slug: "canon-eos-r6-ii",
    basePrice: 2499.00,
    sellingPrice: 2399.00,
    categorySlug: 'cameras',
    brand: "Canon",
    description: "Professional mirrorless camera with 24MP sensor.",
    images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800"],
    variants: [{ name: "Body Only", stock: 8, attributes: { "Type": "Body" }}]
  },

  // --- Fashion: Men ---
  {
    name: "Classic Denim Jacket",
    slug: "classic-denim-jacket",
    basePrice: 89.00,
    sellingPrice: 79.00,
    categorySlug: 'men-fashion',
    brand: "Levi's",
    description: "Timeless denim jacket for every occasion.",
    isFeatured: true,
    images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800"],
    variants: [
      { name: "Blue / M", stock: 30, attributes: { "Color": "Blue", "Size": "M" }},
      { name: "Blue / L", stock: 25, attributes: { "Color": "Blue", "Size": "L" }}
    ]
  },
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
      { name: "White / M", stock: 50, attributes: { "Color": "White", "Size": "M" }},
      { name: "Black / L", stock: 45, attributes: { "Color": "Black", "Size": "L" }}
    ]
  },

  // --- Fashion: Women ---
  {
    name: "Summer Floral Dress",
    slug: "summer-floral-dress",
    basePrice: 120.00,
    sellingPrice: 99.00,
    categorySlug: 'women-fashion',
    brand: "H&M",
    description: "Light and breezy summer dress with floral prints.",
    isNewArrival: true,
    images: ["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=800"],
    variants: [{ name: "Floral / S", stock: 20, attributes: { "Pattern": "Floral", "Size": "S" }}]
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
    variants: [{ name: "Blue / S", stock: 25, attributes: { "Color": "Blue", "Size": "S" }}]
  },

  // --- Fashion: Kids ---
  {
    name: "Kids Cartoon Hoodie",
    slug: "kids-cartoon-hoodie",
    basePrice: 45.00,
    sellingPrice: 39.00,
    categorySlug: 'kids-fashion',
    brand: "GAP Kids",
    description: "Warm and comfy hoodie with fun prints.",
    images: ["https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&q=80&w=800"],
    variants: [{ name: "Red / 8Y", stock: 40, attributes: { "Color": "Red", "Size": "8Y" }}]
  },

  // --- Fashion: Shoes ---
  {
    name: "Nike Air Max 2024",
    slug: "nike-air-max-2024",
    basePrice: 180.00,
    sellingPrice: 160.00,
    categorySlug: 'shoes',
    brand: "Nike",
    description: "Next-gen comfort with Air Max technology.",
    isFeatured: true,
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800"],
    variants: [{ name: "Black / US 10", stock: 15, attributes: { "Color": "Black", "Size": "US 10" }}]
  },

  // --- Home & Living: Furniture ---
  {
    name: "Modern Sofa 3-Seater",
    slug: "modern-sofa-3seater",
    basePrice: 599.00,
    sellingPrice: 549.00,
    categorySlug: 'furniture',
    brand: "IKEA",
    description: "Contemporary sofa with soft cushions.",
    isFeatured: true,
    images: ["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800"],
    variants: [{ name: "Gray / 3-Seater", stock: 8, attributes: { "Color": "Gray" }}]
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
    variants: [{ name: "Oak", stock: 15, attributes: { "Wood": "Oak" }}]
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
    variants: [{ name: "White Matte", stock: 50, attributes: { "Color": "White" }}]
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
    variants: [{ name: "24x36 Inch", stock: 10, attributes: { "Size": "24x36" }}]
  },

  // --- Home & Living: Kitchen ---
  {
    name: "Stainless Steel Cookware Set",
    slug: "cookware-set-steel",
    basePrice: 250.00,
    sellingPrice: 229.00,
    categorySlug: 'kitchen',
    brand: "Cuisinart",
    description: "Professional 10-piece cookware set.",
    images: ["https://images.unsplash.com/photo-1584990347449-39b4aa8e8b7a?auto=format&fit=crop&q=80&w=800"],
    variants: [{ name: "10 Piece Set", stock: 12, attributes: { "Type": "10 Pieces" }}]
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
    variants: [{ name: "5.5L Black", stock: 30, attributes: { "Capacity": "5.5L", "Color": "Black" }}]
  },

  // --- Sports: Gym Equipment ---
  {
    name: "Adjustable Dumbbell Set",
    slug: "adjustable-dumbbell-set",
    basePrice: 200.00,
    sellingPrice: 180.00,
    categorySlug: 'gym-equipment',
    brand: "PowerBlock",
    description: "Space saving adjustable dumbbells 5-50 lbs.",
    isFeatured: true,
    images: ["https://images.unsplash.com/photo-1638531751811-12c858be16ea?auto=format&fit=crop&q=80&w=800"],
    variants: [{ name: "Pair", stock: 15, attributes: { "Type": "Pair" }}]
  },
  {
    name: "Yoga Mat Pro",
    slug: "yoga-mat-pro",
    basePrice: 40.00,
    sellingPrice: 35.00,
    categorySlug: 'gym-equipment',
    brand: "Lululemon",
    description: "Non-slip yoga mat for superior grip.",
    isNewArrival: true,
    images: ["https://images.unsplash.com/photo-1545247181-516773cae754?auto=format&fit=crop&q=80&w=800"],
    variants: [{ name: "Purple", stock: 60, attributes: { "Color": "Purple" }}]
  },

  // --- Sports: Jerseys ---
  {
    name: "Football Jersey Home Kit",
    slug: "football-jersey-home",
    basePrice: 90.00,
    sellingPrice: 90.00,
    categorySlug: 'jerseys',
    brand: "Nike",
    description: "Official team jersey for the 2025/26 season.",
    isFeatured: true,
    images: ["https://images.unsplash.com/photo-1521747116042-5a810fda9664?auto=format&fit=crop&q=80&w=800"],
    variants: [{ name: "L", stock: 100, attributes: { "Size": "L" }}]
  },

  // --- Additional: Smartwatch ---
  {
    name: "Apple Watch Series 9",
    slug: "apple-watch-series-9",
    basePrice: 429.00,
    sellingPrice: 399.00,
    categorySlug: 'smartphones',
    brand: "Apple",
    isNewArrival: true,
    isFeatured: true,
    description: "Advanced health and fitness tracking.",
    images: ["https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=800"],
    variants: [{ name: "Midnight / 45mm", stock: 20, attributes: { "Color": "Midnight", "Size": "45mm" }}]
  },

  // --- Additional: Tablet ---
  {
    name: "iPad Pro 12.9",
    slug: "ipad-pro-129",
    basePrice: 1099.00,
    sellingPrice: 1099.00,
    categorySlug: 'laptops',
    brand: "Apple",
    isFeatured: true,
    description: "Ultimate iPad experience with M2 chip.",
    images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=800"],
    variants: [{ name: "Space Gray / 256GB", stock: 12, attributes: { "Color": "Space Gray", "Storage": "256GB" }}]
  },
];
