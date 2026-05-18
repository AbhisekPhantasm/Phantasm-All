import { test, expect } from '@playwright/test';

test.describe('New Arrivals Module - Guest Flow', () => {

  test('Verify New Arrivals navigation and content for all 7 products', async ({ page }, testInfo) => {
    // Increase timeout to 3 minutes because iterating through 7 products takes significant time
    test.setTimeout(180000);

    await test.step('Navigate to Website', async () => {
      console.log('Navigating to http://82.112.230.248:6022/...');
      await page.goto('http://82.112.230.248:6022/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      console.log('Successfully loaded homepage.');
    });

    await test.step('Navigate to New Arrivals Page', async () => {
      console.log('Opening New Arrivals page...');
      const newArrivalsLink = page.getByRole('link', { name: 'New Arrivals' }).first();
      await expect(newArrivalsLink).toBeVisible({ timeout: 20000 });
      await newArrivalsLink.click();

      await expect(page).toHaveURL(/.*new-arrivals/i, { timeout: 20000 });
      
      console.log('Capturing New Arrivals listing page screenshot.');
      const screenshot = await page.screenshot({ path: 'test-results/new-arrivals-listing.png', fullPage: true });
      await testInfo.attach('New Arrivals Listing Page', { body: screenshot, contentType: 'image/png' });
    });

    await test.step('Iterate through 7 products, view details and take screenshots', async () => {
      const viewProductButtons = page.locator('button:has-text("View Product")');
      
      // Wait for at least one product to be visible
      await expect(viewProductButtons.first()).toBeVisible({ timeout: 20000 });
      
      const count = await viewProductButtons.count();
      const limit = Math.min(count, 7); // Handle exactly 7 products as requested

      for (let i = 0; i < limit; i++) {
        await test.step(`Process Product ${i + 1}`, async () => {
          console.log(`Processing New Arrival Product ${i + 1} of ${limit}...`);
          const currentBtn = page.locator('button:has-text("View Product")').nth(i);
          
          await currentBtn.scrollIntoViewIfNeeded();
          await currentBtn.click();

          await page.waitForLoadState('domcontentloaded');
          await page.waitForTimeout(1000); 

          console.log(`Capturing screenshot for Product ${i + 1}.`);
          const screenshot = await page.screenshot({ path: `test-results/new-arrival-product-${i + 1}.png`, fullPage: true });
          await testInfo.attach(`Product ${i + 1} Details`, { body: screenshot, contentType: 'image/png' });

          console.log(`Navigating back to New Arrivals listing.`);
          await page.goBack({ waitUntil: 'domcontentloaded' });
          await expect(page.locator('button:has-text("View Product")').first()).toBeVisible({ timeout: 20000 });
        });
      }
    });

  });
});
