import { test, expect } from '@playwright/test';

const BASE_URL = 'http://31.97.61.59:7004';

async function safeGoto(page: any, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
}

async function dismissAgeGate(page: any) {
  try {
    const btn = page.locator('button.age-modal-btn', { hasText: 'YES' });
    if (await btn.isVisible({ timeout: 5000 })) {
      await btn.click();
      await page.waitForTimeout(1000);
    }
  } catch {}
}

async function loginUser(page: any) {
  await safeGoto(page, `${BASE_URL}/auth/login`);
  await dismissAgeGate(page);
  await page.fill('#email', 'abhisek@phantasm.co.in');
  await page.fill('#password', '123456');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
}

test('About Page User Flow - After Login', async ({ page }) => {
  await loginUser(page);

  await safeGoto(page, `${BASE_URL}/about`);
  await page.screenshot({ path: 'screenshots/user-about-01-initial.png', fullPage: true });
  
  const viewProducts = page.locator('button:has-text("View Products"), a:has-text("View Products")').first();
  if (await viewProducts.isVisible()) {
    await viewProducts.scrollIntoViewIfNeeded();
    await viewProducts.click({ force: true });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/user-about-02-view-products.png', fullPage: true });
  }
});
