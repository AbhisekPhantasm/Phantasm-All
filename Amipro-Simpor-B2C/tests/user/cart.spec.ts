import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://82.112.230.248:6022';

async function takeScreenshot(page: Page, name: string) {
  const dir = './screenshots';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
}

async function login(page: Page) {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`${BASE_URL}/auth/login`);
  
  const emailInp = page.locator('input[type="email"], input[name="email"], #email').first();
  await emailInp.fill('abhisek+1@phantasm.co.in');
  
  const passInp = page.locator('input[type="password"], input[name="password"]').first();
  await passInp.fill('12345678');
  
  await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first().click();
  
  // Handle optional "Ok" popup
  const okButton = page.locator('button:has-text("Ok")').first();
  try {
    if (await okButton.isVisible({ timeout: 5000 })) {
      await okButton.click();
    }
  } catch (e) {
    // Ignore if not found
  }
  
  // Ensure we are on the home page or redirected
  await page.waitForTimeout(2000);
  if (page.url().includes('login')) {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  }
}

async function addSpecificProductToCart(page: Page) {
  // Navigate directly to a known product page to avoid shop grid click issues
  await page.goto(`${BASE_URL}/product/prostfit-date-syrup-20g`);
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for the 'Add To Cart' button to be sure it's an available product
  // Ensure quantity is at least 1 to enable the Add To Cart button
  const increaseQty = page.getByRole('button', { name: /Increase quantity/i }).first();
  const addToCart = page.getByRole('button', { name: /Add To Cart/i }).first();
  
  await addToCart.scrollIntoViewIfNeeded();

  // Aggressively try to enable the button by clicking "+" 
  await expect(async () => {
    const isEnabled = await addToCart.isEnabled();
    if (!isEnabled) {
      await increaseQty.click({ force: true });
    }
    await expect(addToCart).toBeEnabled({ timeout: 3000 });
  }).toPass({ timeout: 15000, intervals: [1000] });

  await addToCart.click();
  
  // Wait for AJAX/Network to settle
  await page.waitForTimeout(3000);
  return true;
}

test.describe('AmiproSimpor - Cart Page Test Suite', () => {
  test('Cart Page Flow', async ({ page }) => {
    await login(page);

    await addSpecificProductToCart(page);

    // Go to Cart
    await page.goto(`${BASE_URL}/cart`);
    await page.waitForLoadState('networkidle');

    // Check Heading
    await expect(page.getByRole('heading', { name: /Shopping Cart/i })).toBeVisible({ timeout: 15000 });
    await takeScreenshot(page, 'cart_page_loaded');

    // Quantity Interaction
    const increaseBtn = page.getByLabel('Increase quantity').first();
    if (await increaseBtn.isVisible()) {
      await increaseBtn.click();
      await page.waitForTimeout(2000);
      console.log('Increased quantity');
    }

    // Checkout
    const checkoutBtn = page.getByRole('button', { name: /Proceed to Checkout/i }).first();
    await checkoutBtn.click();
    await page.waitForURL(/.*checkout/, { timeout: 15000 });
    await takeScreenshot(page, 'cart_to_checkout');
  });
});