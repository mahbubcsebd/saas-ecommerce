// Additional products to ensure we have > 40 items
module.exports = [
  // --- Electronics: Cameras ---
  {
    name: 'Sony Alpha a7 IV',
    slug: 'sony-alpha-a7-iv',
    basePrice: 2498.0,
    sellingPrice: 2498.0,
    categorySlug: 'cameras',
    brand: 'Sony',
    description: 'Benchmark for full-frame mirrorless cameras.',
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800',
    ],
    variants: [{ name: 'Body Only', stock: 12, attributes: { Type: 'Body' } }],
  },
  {
    name: 'Fujifilm X-T5',
    slug: 'fujifilm-x-t5',
    basePrice: 1699.0,
    sellingPrice: 1699.0,
    categorySlug: 'cameras',
    brand: 'Fujifilm',
    description: 'Classic dial operation with modern tech.',
    images: [
      'https://images.unsplash.com/photo-1519638831568-d9897f54ed69?auto=format&fit=crop&q=80&w=800',
    ],
    variants: [{ name: 'Silver', stock: 15, attributes: { Color: 'Silver' } }],
  },

  // --- Fashion: Shoes ---
  {
    name: 'Adidas Ultraboost Light',
    slug: 'adidas-ultraboost-light',
    basePrice: 190.0,
    sellingPrice: 180.0,
    categorySlug: 'shoes',
    brand: 'Adidas',
    description: 'Lightest Ultraboost ever made.',
    images: [
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=800',
    ],
    variants: [
      { name: 'Core Black / US 9', stock: 20, attributes: { Color: 'Black', Size: 'US 9' } },
    ],
  },
  {
    name: 'Converse Chuck 70',
    slug: 'converse-chuck-70',
    basePrice: 90.0,
    sellingPrice: 85.0,
    categorySlug: 'shoes',
    brand: 'Converse',
    description: 'The classic sneaker re-crafted.',
    images: [
      'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&q=80&w=800',
    ],
    variants: [
      { name: 'Parchment / US 8', stock: 50, attributes: { Color: 'Cream', Size: 'US 8' } },
    ],
  },

  // --- Home: Kitchen ---
  {
    name: 'KitchenAid Artisan Stand Mixer',
    slug: 'kitchenaid-artisan-mixer',
    basePrice: 449.0,
    sellingPrice: 399.0,
    categorySlug: 'kitchen',
    brand: 'KitchenAid',
    isFeatured: true,
    description: 'The iconic stand mixer for baking.',
    images: [
      'https://images.unsplash.com/photo-1594385263532-d7c4c857da7d?auto=format&fit=crop&q=80&w=800',
    ],
    variants: [{ name: 'Empire Red', stock: 8, attributes: { Color: 'Red' } }],
  },
  {
    name: 'Nespresso Vertuo',
    slug: 'nespresso-vertuo',
    basePrice: 199.0,
    sellingPrice: 179.0,
    categorySlug: 'kitchen',
    brand: 'Nespresso',
    description: 'Versatile coffee maker for 5 cup sizes.',
    images: [
      'https://images.unsplash.com/photo-1621858009772-9a05cb3d95b5?auto=format&fit=crop&q=80&w=800',
    ],
    variants: [{ name: 'Matte Black', stock: 25, attributes: { Color: 'Black' } }],
  },

  // --- Sports ---
  {
    name: 'Wilson NBA Official Basketball',
    slug: 'wilson-nba-ball',
    basePrice: 150.0,
    sellingPrice: 130.0,
    categorySlug: 'sports', // Parent category fallback if child not exact
    brand: 'Wilson',
    description: 'Official game ball of the NBA.',
    images: [
      'https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&q=80&w=800',
    ],
    variants: [{ name: 'Size 7', stock: 40, attributes: { Size: '7' } }],
  },
  {
    name: 'Yonex Badminton Racket',
    slug: 'yonex-badminton-racket',
    basePrice: 120.0,
    sellingPrice: 110.0,
    categorySlug: 'sports',
    brand: 'Yonex',
    description: 'High tension graphite racket.',
    images: [
      'https://images.unsplash.com/photo-1626245025736-6eik7231456?auto=format&fit=crop&q=80&w=800',
    ],
    variants: [{ name: 'Voltric Z-Force', stock: 15, attributes: { Model: 'Voltric' } }],
  },

  // --- Fashion: Accessories ---
  {
    name: 'Ray-Ban Aviator Classic',
    slug: 'ray-ban-aviator',
    basePrice: 160.0,
    sellingPrice: 160.0,
    categorySlug: 'men-fashion',
    brand: 'Ray-Ban',
    description: 'Timeless pilot style.',
    images: [
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800',
    ],
    variants: [{ name: 'Gold / Green', stock: 20, attributes: { Color: 'Gold' } }],
  },

  // --- Electronics: Gaming ---
  {
    name: 'PlayStation 5 Console',
    slug: 'ps5-console',
    basePrice: 499.0,
    sellingPrice: 499.0,
    categorySlug: 'electronics',
    brand: 'Sony',
    isFeatured: true,
    description: 'Play Has No Limits.',
    images: [
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=800',
    ],
    variants: [{ name: 'Disc Edition', stock: 10, attributes: { Edition: 'Disc' } }],
  },
  {
    name: 'Xbox Series X',
    slug: 'xbox-series-x',
    basePrice: 499.0,
    sellingPrice: 480.0,
    categorySlug: 'electronics',
    brand: 'Microsoft',
    description: 'Power your dreams.',
    images: [
      'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?auto=format&fit=crop&q=80&w=800',
    ],
    variants: [{ name: '1TB', stock: 12, attributes: { Storage: '1TB' } }],
  },
  {
    name: 'Nintendo Switch OLED',
    slug: 'nintendo-switch-oled',
    basePrice: 349.0,
    sellingPrice: 349.0,
    categorySlug: 'electronics',
    brand: 'Nintendo',
    description: '7-inch OLED screen.',
    images: [
      'https://images.unsplash.com/photo-1612404730960-5c71579fca11?auto=format&fit=crop&q=80&w=800',
    ],
    variants: [{ name: 'White', stock: 25, attributes: { Color: 'White' } }],
  },

  // --- More Furniture ---
  {
    name: 'Ergonomic Office Chair',
    slug: 'ergonomic-office-chair',
    basePrice: 299.0,
    sellingPrice: 249.0,
    categorySlug: 'furniture',
    brand: 'Herman Miller Style',
    description: 'Comfort for long work hours.',
    images: [
      'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&q=80&w=800',
    ],
    variants: [{ name: 'Black Mesh', stock: 20, attributes: { Color: 'Black' } }],
  },
];
