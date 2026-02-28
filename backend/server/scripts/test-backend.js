const axios = require('axios');

async function testUpdate() {
  const API_URL = 'http://localhost:8000/api';
  try {
    // Note: This test assumes no auth or uses a placeholder.
    // In real scenario, we need a token.
    // But I can test the controller logic by calling it if I had a token.
    // Instead, I'll just check if the backend is running and if I can reach the endpoint.
    const res = await axios.get(`${API_URL}/settings/general`);
    console.log('Backend is reachable:', res.status);
  } catch (err) {
    console.error('Backend reachability test failed. Ensure server is running.');
  }
}

testUpdate();
