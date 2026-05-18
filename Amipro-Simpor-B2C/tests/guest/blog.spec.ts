import { test, expect } from '@playwright/test';

test.describe('Blog Module - Guest Flow', () => {

  test('Verify Blog navigation, read more, scroll and screenshot for 3 blogs', async ({ page }, testInfo) => {
    // Increase test timeout to 120 seconds because smooth scrolling through 3 separate blogs takes extra time
    test.setTimeout(120000);

    
    await test.step('Navigate to Website', async () => {
      console.log('Navigating to http://82.112.230.248:6022/...');
      await page.goto('http://82.112.230.248:6022/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      console.log('Successfully loaded homepage.');
    });

    await test.step('Navigate to Blog Page', async () => {
      console.log('Opening Blog page...');
      const blogLink = page.getByRole('link', { name: 'Blog' }).first();
      await expect(blogLink).toBeVisible({ timeout: 20000 });
      await blogLink.click();

      await expect(page).toHaveURL(/.*blog/i, { timeout: 20000 });
      
      console.log('Capturing blog listing page screenshot.');
      const screenshot = await page.screenshot({ path: 'test-results/blog-listing-page.png', fullPage: true });
      await testInfo.attach('Blog Listing Page', { body: screenshot, contentType: 'image/png' });
    });

    await test.step('Click Read More, Scroll, and Capture Screenshots for 3 Blogs', async () => {
      // Find the 'Read More' links or buttons
      const readMoreLocator = page.locator('text=/read more/i');
      
      // Wait for at least one to be visible
      await expect(readMoreLocator.first()).toBeVisible({ timeout: 20000 });
      
      const count = await readMoreLocator.count();
      const limit = Math.min(count, 3); // Ensure we only do a maximum of 3

      for (let i = 0; i < limit; i++) {
        await test.step(`Process Blog Post ${i + 1}`, async () => {
          console.log(`Processing Blog Post ${i + 1} of ${limit}...`);
          const currentReadMore = page.locator('text=/read more/i').nth(i);
          
          await currentReadMore.scrollIntoViewIfNeeded();
          await currentReadMore.click();

          await page.waitForLoadState('domcontentloaded');
          await page.waitForTimeout(1000); 

          console.log(`Smooth scrolling Blog Post ${i + 1}...`);
          const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
          for (let y = 0; y < scrollHeight; y += 400) {
            await page.mouse.wheel(0, 400);
            await page.waitForTimeout(200); 
          }
          await page.waitForTimeout(1000); 
          
          for (let y = scrollHeight; y > 0; y -= 400) {
            await page.mouse.wheel(0, -400);
            await page.waitForTimeout(100); 
          }
          await page.waitForTimeout(500); 

          console.log(`Capturing screenshot for Blog Post ${i + 1}.`);
          const screenshot = await page.screenshot({ path: `test-results/blog-post-${i + 1}-fullpage.png`, fullPage: true });
          await testInfo.attach(`Blog Post ${i + 1} Screenshot`, { body: screenshot, contentType: 'image/png' });

          console.log(`Navigating back to blog listing.`);
          await page.goBack({ waitUntil: 'domcontentloaded' });
          await expect(page.locator('text=/read more/i').first()).toBeVisible({ timeout: 20000 });
        });
      }
    });

  });
});
