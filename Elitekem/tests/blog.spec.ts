import { test, expect, Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import * as path from 'path';

async function takeScreenshot(page: Page, name: string): Promise<void> {
  const screenshotPath = path.join('screenshots', `${name}.png`);
  const screenshot = await page.screenshot({ path: screenshotPath, fullPage: false });
  await allure.attachment(name, screenshot, 'image/png');
}

async function performAction(
  page: Page,
  actionName: string,
  action: () => Promise<void>
): Promise<void> {
  try {
    await page.waitForTimeout(1000);
    const beforeShot = await page.screenshot();
    await allure.attachment(`Before – ${actionName}`, beforeShot, 'image/png');
    await action();
    const afterShot = await page.screenshot();
    await allure.attachment(`After – ${actionName}`, afterShot, 'image/png');
  } catch (error) {
    if (!page.isClosed()) {
      const failShot = await page.screenshot();
      await allure.attachment(`FAILURE – ${actionName}`, failShot, 'image/png');
    }
    throw error;
  }
}

test('EliteKem Blog Page – Full Interaction Flow', async ({ page }) => {
  await test.step('Step 1 – Open blog page and verify it loads', async () => {
    await page.goto('/blog/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/blog/);
    await expect(page).toHaveTitle(/Elitekem|Blog|Insights/i);
    await takeScreenshot(page, 'blog-page-loaded');
    console.log('✅ Blog page loaded successfully');
  });

  await test.step('Step 2 – Verify at least 3 blog cards are visible', async () => {
    const readMoreLinks = page.getByRole('link', { name: 'Read More' });
    await readMoreLinks.first().waitFor({ state: 'visible', timeout: 15000 });
    const count = await readMoreLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);
    console.log(`✅ Found ${count} blog cards on the page`);
    await takeScreenshot(page, 'blog-listing');
  });

  await test.step('Step 3 – Blog 1 interaction', async () => {
    await performAction(page, 'Click Read More – Blog 1', async () => {
      await page.getByRole('link', { name: 'Read More' }).nth(0).click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/blog-page/);
      await takeScreenshot(page, 'blog-1-detail');
      console.log('✅ Blog 1 detail page loaded');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await page.goto('/blog/');
      await page.waitForLoadState('domcontentloaded');
    });
  });

  await test.step('Step 4 – Blog 2 interaction', async () => {
    await performAction(page, 'Click Read More – Blog 2', async () => {
      await page.getByRole('link', { name: 'Read More' }).nth(1).click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/blog-page/);
      await takeScreenshot(page, 'blog-2-detail');
      console.log('✅ Blog 2 detail page loaded');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await page.goto('/blog/');
      await page.waitForLoadState('domcontentloaded');
    });
  });

  await test.step('Step 5 – Blog 3 interaction', async () => {
    await performAction(page, 'Click Read More – Blog 3', async () => {
      await page.getByRole('link', { name: 'Read More' }).nth(2).click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/blog-page/);
      await takeScreenshot(page, 'blog-3-detail');
      console.log('✅ Blog 3 detail page loaded');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      await page.goto('/blog/');
      await page.waitForLoadState('domcontentloaded');
    });
  });

  await test.step('Step 6 – Final validation of blog listing', async () => {
    const readMoreLinks = page.getByRole('link', { name: 'Read More' });
    const count = await readMoreLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < 3; i++) {
      await expect(readMoreLinks.nth(i)).toBeVisible();
    }
    await takeScreenshot(page, 'blog-listing-final');
    console.log('✅ All 3 blog cards are still accessible on the listing page');
  });
});
