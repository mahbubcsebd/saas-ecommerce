async function main() {
  const url = 'https://mahbuburrahman.xyz/this-does-not-exist-at-all-123456';
  console.log('Fetching non-existent production page:', url);
  try {
    const res = await fetch(url);
    console.log('Response Status:', res.status);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log('Response Text length:', text.length);
    if (res.status !== 404) {
      console.log('Output (first 1000 chars):', text.slice(0, 1000));
    }
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

main();
