async function main() {
  const url = 'http://localhost:5000/api/products/macbook-m5-pro-566088';
  console.log('Fetching API for macbook-m5-pro-566088:', url);
  try {
    const res = await fetch(url);
    console.log('Response Status:', res.status);
    const data = await res.json();
    console.log('Response images:', data.data?.images);
    console.log('Response variants:', data.data?.variants);
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}
main();
