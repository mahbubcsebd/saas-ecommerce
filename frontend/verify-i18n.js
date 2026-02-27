async function verifyI18n() {
  const API_URL = "http://127.0.0.1:8000/api";
  const locale = 'bn';

  try {
    console.log(`--- TESTING WITH x-lang: ${locale} ---`);

    console.log("\n--- PRODUCTS ---");
    const resProd = await fetch(`${API_URL}/products`, {
        headers: { 'x-lang': locale }
    });
    const jsonProd = await resProd.json();
    if (jsonProd.success && jsonProd.data.length > 0) {
      const product = jsonProd.data[0];
      console.log(`Product Name: ${product.name}`);
      console.log(`Translated: ${product.isTranslated ? 'YES' : 'NO'}`);
    }

    console.log("\n--- CATEGORIES ---");
    const resCat = await fetch(`${API_URL}/categories`, {
        headers: { 'x-lang': locale }
    });
    const jsonCat = await resCat.json();
    if (jsonCat.success && jsonCat.data.length > 0) {
      const cat = jsonCat.data[0];
      console.log(`Category Name: ${cat.name}`);
      console.log(`Translated: ${cat.isTranslated ? 'YES' : 'NO'}`);
    }

    console.log("\n--- HOME CATEGORY WISE PRODUCTS ---");
    const resHome = await fetch(`${API_URL}/homeCategoryWiseProduct`, {
        headers: { 'x-lang': locale }
    });
    const jsonHome = await resHome.json();
    if (jsonHome.success && jsonHome.data.length > 0) {
      const item = jsonHome.data[0];
      console.log(`Home Category: ${item.categoryName}`);
      if (item.products && item.products.length > 0) {
          console.log(`First Home Product: ${item.products[0].name}`);
      }
    }

  } catch (error) {
    console.error("Verification failed:", error);
  }
}

verifyI18n();
