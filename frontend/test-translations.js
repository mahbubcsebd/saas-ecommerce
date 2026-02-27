async function testProductTranslations() {
  const API_URL = "http://127.0.0.1:8000/api";

  try {
    console.log("Fetching /products...");
    const res = await fetch(`${API_URL}/products`);
    const json = await res.json();

    if (json.success && json.data.length > 0) {
      const product = json.data[0];
      console.log(`Product: ${product.name}`);
      console.log(`Translations present: ${!!product.translations}`);
      if (product.translations) {
        console.log(`Translations count: ${product.translations.length}`);
        console.log(`Available languages: ${product.translations.map(t => t.langCode).join(', ')}`);
      }
    console.log("\nFetching /categories...");
    const resCat = await fetch(`${API_URL}/categories`);
    const jsonCat = await resCat.json();

    if (jsonCat.success && jsonCat.data.length > 0) {
      const cat = jsonCat.data[0];
      console.log(`Category: ${cat.name}`);
      console.log(`Translations present: ${!!cat.translations}`);
      if (cat.translations) {
        console.log(`Translations count: ${cat.translations.length}`);
        console.log(`Available languages: ${cat.translations.map(t => t.langCode).join(', ')}`);
      }
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testProductTranslations();
