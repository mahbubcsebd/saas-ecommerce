async function main() {
  const url = 'https://api.mahbuburrahman.xyz/api/products/iphone-15-pro-max-858092';
  console.log('Fetching production API:', url);
  try {
    const res = await fetch(url);
    console.log('Response Status:', res.status);
    const data = await res.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

main();
