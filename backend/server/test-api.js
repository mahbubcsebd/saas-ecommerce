const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:8000/api/v1/products?limit=5&status=all');
    console.log('Success:', res.data.success);
    console.log('Count:', res.data.data.length);
    console.log('First Product:', res.data.data[0]?.name);

    const searchRes = await axios.get(
      'http://localhost:8000/api/v1/products?search=sony&limit=5&status=all'
    );
    console.log('Search Success:', searchRes.data.success);
    console.log('Search Count:', searchRes.data.data.length);
  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Response Data:', err.response.data);
    }
  }
}

test();
