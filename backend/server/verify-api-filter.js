const http = require('http');

const url = 'http://127.0.0.1:8000/api/products?category=electronics';

console.log('🧪 Verifying API Filter: Fetching products for "electronics"...');

http
  .get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.success) {
          console.log(`✅ API Success: Found ${json.data.length} products`);
          json.data.forEach((p) => {
            console.log(` - ${p.name} (${p.category.name})`);
          });

          // Assert: We should find smartphones, laptops etc.
          const hasSubcats = json.data.some((p) => p.category.name !== 'Electronics');
          if (hasSubcats) {
            console.log('✅ SUCCESS: Products from subcategories found!');
          } else {
            console.log('⚠️ WARNING: Only direct category products found (or none). Check data.');
          }
        } else {
          console.log('❌ API Failed:', json);
        }
      } catch (e) {
        console.log('❌ Parse Error:', e.message);
      }
    });
  })
  .on('error', (e) => {
    console.log('❌ Request Error:', e.message);
  });
