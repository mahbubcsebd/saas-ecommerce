const products = require('./prisma/seed-data/products.data.js');

const slugs = {};
const duplicates = [];

products.forEach((p, index) => {
  if (slugs[p.slug]) {
    duplicates.push({ slug: p.slug, index });
  } else {
    slugs[p.slug] = true;
  }
});

console.log('Total products:', products.length);
console.log('Duplicate slugs:', duplicates);

const featured = products.filter(p => p.isFeatured).map(p => p.slug);
const newArrival = products.filter(p => p.isNewArrival).map(p => p.slug);

console.log('Featured count:', featured.length);
console.log('New Arrival count:', newArrival.length);
