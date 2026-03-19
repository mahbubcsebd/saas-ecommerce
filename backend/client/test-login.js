const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

async function testLogin() {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'superadmin@example.com',
        password: 'password123',
      }),
    });

    if (!response.ok) {
      console.log('Status:', response.status);
      const text = await response.text();
      console.log('Response:', text);
      return;
    }

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();
