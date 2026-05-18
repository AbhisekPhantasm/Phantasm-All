import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://82.112.230.248:6022';

async function takeScreenshot(page: Page, name: string) {
  const dir = './screenshots';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
}

async function login(page: Page) {
  await page.goto(`${BASE_URL}/auth/login`);
  await page.locator('#email').fill('abhisek+1@phantasm.co.in');
  await page.locator('input[type="password"]').fill('12345678');
  await page.getByRole('button', { name: /Sign in/i }).click();
  const okButton = page.locator('button:has-text("Ok")').first();
  await okButton.waitFor({ state: 'visible', timeout: 15000 });
  await okButton.click();
  await page.waitForURL(BASE_URL, { timeout: 15000 });
}

test.describe('AmiproSimpor - New Arrivals Page Test Suite', () => {
  test('New Arrivals Flow', async ({ page }) => {
    await login(page);
    
    // 1. Navigate to New Arrivals Page
    await page.goto(`${BASE_URL}/new-arrivals`);
    await expect(page.locator('h1:has-text("New Arrivals")')).toBeVisible();
    await takeScreenshot(page, 'new_arrivals_loaded');

    const products = [
      'DatesUp Kids Cola 250ml',
      'Xuric + Date Syrup 20g',
      'Relaxio+ Date Syrup 20g',
      'FitFuel+ Date Syrup 20g',
      'Fluexera+ Date Syrup 20g',
      'HepaFit+ Date Syrup 20g',
      'ProstFit+ Date Syrup 20g'
    ];

    for (const prod of products) {
      const card = page.locator('div.bg-white').filter({ hasText: prod }).first();
      await expect(card).toBeVisible();
      await card.scrollIntoViewIfNeeded();
      await card.locator('button:has-text("View Product")').click();
      await takeScreenshot(page, `new_arrival_product_${prod.split(' ')[0]}`);
      await page.goto(`${BASE_URL}/new-arrivals`);
    }

    // Newsletter Section
    await page.locator('footer').scrollIntoViewIfNeeded();
    await page.locator('input[placeholder*="email"]').fill('newsletter' + Date.now() + '@test.com');
    await page.locator('button:has-text("Subscribe")').click();
    await takeScreenshot(page, 'new_arrivals_newsletter');
  });
});