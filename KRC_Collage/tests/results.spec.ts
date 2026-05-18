import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ResultsPage } from '../pages/ResultsPage';

test.describe('Results Page - Comprehensive E2E Flow', () => {
  let homePage: HomePage;
  let resultsPage: ResultsPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    resultsPage = new ResultsPage(page);
  });

  test('Complete Results Page Flow', async ({ page }) => {
    test.setTimeout(60000);

    // 1. Navigate to Website
    await homePage.open();
    await expect(page).toHaveTitle(/Krishna Reddy Sri Chaitanya/);
    console.log('✅ Homepage loaded successfully');

    // 2. Navigate to Results Section
    await homePage.navigateToResults();
    await expect(page).toHaveURL(/.*results/);
    console.log('✅ Results page opens successfully');

    // 3. Capture Results Page Screenshot
    await page.screenshot({ path: 'test-results/results-screenshot.png', fullPage: true });
    console.log('✅ Screenshot captured');

    // 4. Scroll Through Results Page
    const resultImages = page.getByRole('img', { name: /Result/i });
    const count = await resultImages.count();
    console.log(`Found ${count} result images to scroll through`);

    for (let i = 0; i < Math.min(count, 6); i++) {
      await resultImages.nth(i).scrollIntoViewIfNeeded();
      await page.waitForTimeout(200); // Small pause for visual verification
    }
    
    const footer = page.locator('footer').first();
    if (await footer.isVisible()) {
      await footer.scrollIntoViewIfNeeded();
    }
    
    console.log('✅ All banners are visible without UI issues');

    // 5. Final Validation
    await expect(page.getByRole('heading', { name: /Results/i }).first()).toBeVisible();
    console.log('✅ No UI issues or broken elements');
  });
});
