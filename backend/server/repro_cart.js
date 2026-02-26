// Built-in fetch in Node 18+

const API_URL = 'http://localhost:8000/api';

async function test() {
    try {
        console.log("1. Logging in...");
        // Login with a known user (assuming seed data or creating one)
        // I will try to login as admin@example.com (default seed)
        // If that fails, I'll register one.
        let token = null;

        const loginRes = await fetch(`${API_URL}/auth/login`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ email: 'user@example.com', password: 'password123@!' })
        });

        const loginData = await loginRes.json();
        if (loginData.success) {
            token = loginData.data.accessToken;
            console.log("Login successful. Token acquired.");
        } else {
            console.log("Login failed:", loginData.message);
            return;
        }

        // 2. Get a product
        const prodRes = await fetch(`${API_URL}/products`);
        const prodJson = await prodRes.json();

        if (!prodJson.data || prodJson.data.length === 0) {
            console.log("No products found to test with.");
            return;
        }

        const productId = prodJson.data[0].id;
        console.log("Testing with Product ID:", productId);

        // 3. Add to cart (Authenticated)
        const guestId = "test-guest-" + Date.now();
        console.log("Testing Add to Cart (Auth + Guest: " + guestId + ")...");

        const res = await fetch(`${API_URL}/cart/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                guestId,
                productId,
                quantity: 1
            })
        });

        const data = await res.json();
        console.log("Response Status:", res.status);
        console.log("Response Body:", JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("Test failed:", error);
    }
}

test();
