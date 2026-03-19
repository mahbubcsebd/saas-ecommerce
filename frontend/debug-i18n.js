async function debugI18n() {
  const API_URL = 'http://127.0.0.1:8000/api';

  try {
    console.log('--- LANGUAGES ---');
    const resLang = await fetch(`${API_URL}/translations/versions`);
    const jsonLang = await resLang.json();
    console.log('Active Language Versions:', jsonLang.data);

    console.log('\n--- PRODUCTS ---');
    const resProd = await fetch(`${API_URL}/products`);
    const jsonProd = await resProd.json();
    if (jsonProd.success && jsonProd.data.length > 0) {
      const product = jsonProd.data[0];
      console.log(`Product: ${product.name}`);
      console.log(`Translations: ${JSON.stringify(product.translations.map((t) => t.langCode))}`);
    }

    console.log('\n--- CATEGORIES ---');
    const resCat = await fetch(`${API_URL}/categories`);
    const jsonCat = await resCat.json();
    if (jsonCat.success && jsonCat.data.length > 0) {
      const cat = jsonCat.data[0];
      console.log(`Category: ${cat.name}`);
      console.log(`Translations: ${JSON.stringify(cat.translations.map((t) => t.langCode))}`);
    }
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugI18n();
