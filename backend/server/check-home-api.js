const http = require('http');

const url = 'http://127.0.0.1:8000/api/homeCategoryWiseProduct';

http
  .get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.success) {
          console.log('✅ API Success');
          console.log(`Total Categories: ${json.data.length}`);
          json.data.forEach((cat) => {
            console.log(
              `📂 ${cat.categoryName} (${cat.categorySlug}) - ${cat.products.length} products`
            );
            cat.products
              .slice(0, 3)
              .forEach((p) =>
                console.log(
                  `   - ${p.name} (isFeatured: ${p.isFeatured}, isNewArrival: ${p.isNewArrival})`
                )
              );
          });
        } else {
          console.log('❌ API Failed:', json);
        }
      } catch (e) {
        console.log('❌ Parse Error:', e.message);
        console.log('Raw Data:', data.substring(0, 200));
      }
    });
  })
  .on('error', (e) => {
    console.log('❌ Request Error:', e.message);
  });
