import { test, expect } from '@playwright/test';

const BASE_URL = 'http://31.97.61.59:7004';

async function safeGoto(page: any, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
}

async function dismissAgeGate(page: any) {
  try {
    const btn = page.locator('button:has-text("YES"), button:has-text("Yes"), button:has-text("I am 21")').first();
    if (await btn.isVisible({ timeout: 5000 })) {
      await btn.click();
      await page.waitForTimeout(1000);
    }
  } catch {}
}

test('About Page Guest Flow', async ({ page }) => {
  await safeGoto(page, `${BASE_URL}/about`);
  await dismissAgeGate(page);
  await page.screenshot({ path: 'screenshots/guest-about-01-initial.png', fullPage: true });
  
  const viewProducts = page.locator('button:has-text("View Products"), a:has-text("View Products")').first();
  if (await viewProducts.isVisible()) {
    await viewProducts.scrollIntoViewIfNeeded();
    await viewProducts.click({ force: true });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/guest-about-02-view-products.png', fullPage: true });
  }
});
