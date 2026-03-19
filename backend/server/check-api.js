const http = require('http');

function fetch(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ error: 'Invalid JSON', raw: data });
          }
        });
      })
      .on('error', reject);
  });
}

async function checkApi() {
  const baseUrl = 'http://127.0.0.1:8000/api';

  console.log('--- Checking /api/products ---');
  try {
    const products = await fetch(`${baseUrl}/products`);
    console.log(`Products Status: ${products.success ? 'OK' : 'FAIL'}`);
    console.log(`Products Count: ${products.count}`);
    if (products.data && products.data.length > 0) {
      console.log('Sample:', products.data[0].name, '- Status:', products.data[0].status);
    }
  } catch (e) {
    console.error('Procuts API Error:', e.message);
  }

  try {
    const cats = await fetch(`${baseUrl}/categories`);
    console.log(`Categories Status: ${cats.success ? 'OK' : 'FAIL'}`);
    console.log(`Categories Count: ${cats.data ? cats.data.length : 0}`);
  } catch (e) {
    console.error('Categories API Error:', e.message);
  }
}

checkApi();
