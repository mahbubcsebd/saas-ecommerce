async function verifyGuestCart() {
  const API_URL = "http://127.0.0.1:8000/api";
  const guestId = "test-guest-" + Date.now();

  try {
    console.log("1. Fetching products to get a valid ID...");
    const prodRes = await fetch(`${API_URL}/products`);
    const prodJson = await prodRes.json();
    if (!prodJson.success || prodJson.data.length === 0) {
      console.log("No products found to test with.");
      return;
    }
    const productId = prodJson.data[0].id;
    console.log(`Using Product ID: ${productId}`);

    console.log("\n2. Adding to cart as Guest...");
    const addRes = await fetch(`${API_URL}/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        quantity: 1,
        guestId
      })
    });
    const addJson = await addRes.json();
    console.log(`Add Status: ${addRes.status}`);
    console.log(`Add Response: ${JSON.stringify(addJson, null, 2)}`);

    if (addJson.success) {
      console.log("\n3. Verifying Cart Contents...");
      const cartRes = await fetch(`${API_URL}/cart?guestId=${guestId}`);
      const cartJson = await cartRes.json();
      console.log(`Cart items count: ${cartJson.data?.items?.length || 0}`);
      if (cartJson.data?.items?.length > 0) {
        console.log("SUCCESS: Guest cart is working!");
      } else {
        console.log("FAILURE: Cart is empty.");
      }
    } else {
      console.log("FAILURE: Could not add item to cart.");
    }

  } catch (error) {
    console.error("Verification failed:", error);
  }
}

verifyGuestCart();
