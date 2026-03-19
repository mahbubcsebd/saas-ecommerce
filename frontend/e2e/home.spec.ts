import { test } from '@playwright/test';

test('homepage has title', async ({ page }) => {
  await page.goto('http://localhost:3000');
  // Check for the site name in the title or heading if the dev server is running
  // For now, this is just a placeholder to verify the config works
  // await expect(page).toHaveTitle(/Mahbub Shop/);
});
