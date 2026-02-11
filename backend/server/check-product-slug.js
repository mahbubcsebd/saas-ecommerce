const http = require('http');

function fetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

async function checkSlug() {
  const slug = 'iphone-15-pro-max'; // Known slug from seed
  const url = `http://127.0.0.1:8000/api/products/${slug}`;

  console.log(`Checking URL: ${url}`);
  try {
    const res = await fetch(url);
    console.log(`HTTP Status: ${res.status}`);
    if (res.body.success) {
      console.log('✅ Product Found:', res.body.data.name);
      console.log('📊 Stock:', res.body.data.stock);
      if (res.body.data.variants && res.body.data.variants.length > 0) {
          console.log('🎨 Variants Stock:', res.body.data.variants.map(v => `${v.name}: ${v.stock}`).join(', '));
      }
    } else {
      console.log('❌ Error:', res.body.message || res.body);
    }
  } catch (e) {
    console.error('Request Failed:', e.message);
  }
}

checkSlug();
