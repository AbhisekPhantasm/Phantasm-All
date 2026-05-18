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

async function safeFill(page: any, selector: string, value: string) {
  try {
    const el = page.locator(selector).first();
    if (await el.isVisible({ timeout: 5000 })) {
      await el.scrollIntoViewIfNeeded();
      await el.click({ force: true });
      await page.waitForTimeout(500);
      await el.fill(value, { timeout: 5000, force: true }).catch(() => {});
      await page.waitForTimeout(500);
    }
  } catch {}
}

test('Cart and Checkout Guest Flow', async ({ page }) => {
  test.setTimeout(120000);
  page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
  // 1. Home and Age Gate
  await safeGoto(page, BASE_URL);
  await dismissAgeGate(page);
  
  // 2. Add a product to cart (Subagent Flow)
  console.log('Navigating to Shop...');
  await safeGoto(page, `${BASE_URL}/shop`);
  
  console.log('Clicking first product...');
  const firstProduct = page.locator('a[href*="/product/"]').first();
  await firstProduct.waitFor({ timeout: 15000 });
  await firstProduct.click();
  await page.waitForTimeout(3000);

  console.log('Clicking Add To Cart...');
  const addToCartBtn = page.locator('text="Add To Cart"').first();
  await addToCartBtn.waitFor({ state: 'visible', timeout: 15000 });
  await addToCartBtn.click({ force: true });
  
  // Wait for cart sidebar to appear and item to be added
  await page.waitForTimeout(5000); 

  // 3. Navigate to Checkout
  console.log('Navigating to Checkout...');
  await safeGoto(page, `${BASE_URL}/checkout`);
  await page.waitForTimeout(3000); 
  
  const currentUrl = page.url();
  console.log('Current URL (should be checkout):', currentUrl);
  
  await page.screenshot({ path: 'screenshots/guest-checkout-01-initial.png', fullPage: true });

  await safeFill(page, 'input[placeholder="Enter First Name"]', 'Guest');
  await safeFill(page, 'input[placeholder="Enter Last Name"]', 'User');
  await safeFill(page, 'input[placeholder="Email"]', 'guest@example.com');
  await safeFill(page, 'input[placeholder="Enter Phone Number"]', '9876543210');
  await safeFill(page, 'input[placeholder*="typing your address"]', '456 Guest Way');
  await safeFill(page, 'input[placeholder="Enter City"]', 'San Francisco');
  await safeFill(page, 'input[placeholder="Enter State"]', 'California');
  await safeFill(page, 'input[placeholder="Enter Pincode"]', '94105');
  
  // NMI Payment
  try {
    const ccFrame = page.frameLocator('iframe[src*="elementId=ccnumber"]');
    await ccFrame.locator('input').first().fill('4111111111111111');
    const expFrame = page.frameLocator('iframe[src*="elementId=ccexp"]');
    await expFrame.locator('input').first().fill('10/29');
    const cvvFrame = page.frameLocator('iframe[src*="elementId=cvv"]');
    await cvvFrame.locator('input').first().fill('999');
  } catch {}

  await page.locator('#ageverificationCheck').check({ force: true }).catch(() => {});
  await page.locator('#promotionSubscribed').check({ force: true }).catch(() => {});
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/guest-checkout-02-filled.png', fullPage: true });
});
