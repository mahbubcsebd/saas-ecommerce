async function testLogin() {
    try {
        const response = await fetch('http://localhost:8000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'superadmin@example.com',
                password: 'password123'
            })
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
