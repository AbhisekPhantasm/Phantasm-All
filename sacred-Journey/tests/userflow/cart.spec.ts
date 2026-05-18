import { test } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://31.97.61.59:7004';

// Navigate safely — no networkidle hang
async function safeGoto(page: any, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
}

// Dismiss age gate ONCE and persist it via localStorage
async function dismissAgeGate(page: any) {
  try {
    const btn = page.locator('button:has-text("YES"), button:has-text("Yes"), button:has-text("I am 21")').first();
    if (await btn.isVisible({ timeout: 4000 })) {
      await btn.click();
      await page.waitForTimeout(1000);
    }
  } catch {}
  // Persist age gate dismissal so it never appears again
  await page.evaluate(() => {
    try {
      localStorage.setItem('ageVerified', 'true');
      localStorage.setItem('age_verified', 'true');
      sessionStorage.setItem('ageVerified', 'true');
    } catch {}
  });
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


async function loginUser(page: any) {
  await safeGoto(page, `${BASE_URL}/auth/login`);
  await dismissAgeGate(page);
  await page.fill('#email', 'abhisek@phantasm.co.in');
  await page.fill('#password', '123456');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
}


test('Cart and Checkout Automation', async ({ page }) => {
  test.setTimeout(180000);
  if (!fs.existsSync('screenshots')) fs.mkdirSync('screenshots', { recursive: true });
  // ── 1. Login ───────────────────────────────────────────────────────────────
  await loginUser(page);
  const afterLoginUrl = page.url();
  console.log('After login URL:', afterLoginUrl);
  await page.screenshot({ path: 'screenshots/after_login.png' });
  // ── 3. Shop → navigate to first product via href ───────────────────────────
  await safeGoto(page, `${BASE_URL}/shop`);
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(1500);

  const productLink = page.locator('a[href*="/product/"]').first();
  const productHref = await productLink.getAttribute('href', { timeout: 10000 }).catch(() => null);
  console.log('Product href:', productHref);

  if (productHref) {
    const fullUrl = productHref.startsWith('http') ? productHref : `${BASE_URL}${productHref}`;
    await safeGoto(page, fullUrl);
  } else {
    await productLink.click({ timeout: 10000 });
    await page.waitForTimeout(3000);
  }
  console.log('Product page URL:', page.url());
  await page.screenshot({ path: 'screenshots/product_page.png' });

  // ── 4. Add to Cart (force to bypass overlay instability) ──────────────────
  const addToCartBtn = page.locator(
    'button:has-text("Add to Cart"), button:has-text("ADD TO CART"), button:has-text("Add To Cart")'
  ).first();

  if (await addToCartBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
    await addToCartBtn.click({ force: true, timeout: 15000 }).catch((e: any) => {
      console.log('Add to Cart error (non-fatal):', e.message?.split('\n')[0]);
    });
    console.log('Add to Cart clicked');
    await page.waitForTimeout(3000);
  } else {
    console.log('Add to Cart not visible — continuing to cart');
  }

  // ── 5. Cart page ──────────────────────────────────────────────────────────
  await safeGoto(page, `${BASE_URL}/cart`);
  await page.screenshot({ path: 'screenshots/cart_page_loaded.png' });
  console.log('Cart URL:', page.url());

  // ── 6. Modify quantity ────────────────────────────────────────────────────
  const qtyInput = page.locator(
    'input[type="number"], input.qty, input[name*="qty"], input[class*="qty"]'
  ).first();
  if (await qtyInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    await qtyInput.click({ clickCount: 3 });
    await qtyInput.fill('2');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/cart_qty_increased.png' });
    console.log('Qty set to 2');
  } else {
    console.log('Qty input not visible, skipping');
  }

  // ── 7. Proceed to Checkout ────────────────────────────────────────────────
  const checkoutBtn = page.locator([
    'a:has-text("Checkout")',
    'button:has-text("Checkout")',
    'a:has-text("Proceed to Checkout")',
    'button:has-text("Proceed to Checkout")',
    '.checkout-button',
  ].join(', ')).first();

  if (await checkoutBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
    await checkoutBtn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(3000);
  } else {
    console.log('Checkout button not found — navigating directly');
    await safeGoto(page, `${BASE_URL}/checkout`);
  }
  await page.screenshot({ path: 'screenshots/checkout_page_loaded.png' });
  console.log('Checkout URL:', page.url());

  // ── 7.5. Debug: List all inputs and iframes ──────────────────────────────
  await page.waitForTimeout(5000); // Wait for dynamic content
  const debugInfo = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input')).map(i => ({
      id: i.id, name: i.name, placeholder: i.placeholder, type: i.type
    }));
    const iframes = Array.from(document.querySelectorAll('iframe')).map(f => f.src);
    return { inputs, iframes };
  });
  console.log('Debug Info (after 5s):', JSON.stringify(debugInfo, null, 2));




  // ── 8. Fill Shipping/Billing Details ──────────────────────────────────────
  await safeFill(page, 'input[placeholder="Enter First Name"]', 'Abhisek');
  await safeFill(page, 'input[placeholder="Enter Last Name"]', 'Test');
  await safeFill(page, 'input[placeholder="Email"]', 'abhisek@phantasm.co.in');
  await safeFill(page, 'input[placeholder="Enter Phone Number"]', '1234567890');
  await safeFill(page, 'input[placeholder*="typing your address"]', '123 Test Lane');
  await safeFill(page, 'input[placeholder="Enter City"]', 'Los Angeles');
  await safeFill(page, 'input[placeholder="Enter State"]', 'California');
  await safeFill(page, 'input[placeholder="Enter Pincode"]', '90001');

  // Tick "Use Shipping Address as Billing Address"
  try {
    const shippingCheckbox = page.locator('input[type="checkbox"]').first();
    if (await shippingCheckbox.isVisible({ timeout: 2000 })) {
      await shippingCheckbox.check({ force: true }).catch(() => {});
      await page.waitForTimeout(1000);
    }
  } catch {}

  // ── 9. Fill Payment Details ───────────────────────────────────────────────
  await safeFill(page, 'input[placeholder="Card Number"]', '4242424242424242');
  await safeFill(page, 'input[placeholder="MM / YY"]', '12/30');
  await safeFill(page, 'input[placeholder="CVV"]', '123');

  // ── 9. Fill Payment Details via NMI iframes ──────────────────────────────
  // NMI test card: 4111111111111111 | Exp: 10/25 | CVV: 999
  console.log('Filling NMI payment iframes...');

  try {
    const ccFrame = page.frameLocator('iframe[src*="elementId=ccnumber"]');
    const ccInput = ccFrame.locator('input').first();
    await ccInput.waitFor({ timeout: 10000 });
    await ccInput.click();
    await ccInput.fill('4111111111111111');
    console.log('Card number filled: 4111111111111111');
  } catch (e: any) { console.log('Card number iframe error:', e.message?.split('\n')[0]); }

  try {
    const expFrame = page.frameLocator('iframe[src*="elementId=ccexp"]');
    const expInput = expFrame.locator('input').first();
    await expInput.waitFor({ timeout: 10000 });
    await expInput.click();
    await expInput.fill('10/29');
    console.log('Expiry filled: 10/29');
  } catch (e: any) { console.log('Expiry iframe error:', e.message?.split('\n')[0]); }

  try {
    const cvvFrame = page.frameLocator('iframe[src*="elementId=cvv"]');
    const cvvInput = cvvFrame.locator('input').first();
    await cvvInput.waitFor({ timeout: 10000 });
    await cvvInput.click();
    await cvvInput.fill('999');
    console.log('CVV filled: 999');
  } catch (e: any) { console.log('CVV iframe error:', e.message?.split('\n')[0]); }

  await page.screenshot({ path: 'screenshots/checkout_payment_filled.png' });

  // ── 10. Age Verification & Terms checkboxes (by ID) ──────────────────────
  try {
    await page.locator('#ageverificationCheck').scrollIntoViewIfNeeded();
    await page.locator('#ageverificationCheck').check({ force: true });
    console.log('Age verification checked');
  } catch (e: any) { console.log('Age check error:', e.message?.split('\n')[0]); }

  try {
    const termsBox = page.locator('#promotionSubscribed');
    await termsBox.scrollIntoViewIfNeeded();
    // Force check via JS in case click doesn't register
    await page.evaluate(() => {
      const el = document.querySelector('#promotionSubscribed') as HTMLInputElement;
      if (el && !el.checked) {
        el.checked = true;
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('click', { bubbles: true }));
      }
    });
    await termsBox.click({ force: true }).catch(() => {});
    console.log('Terms & Conditions checked');
  } catch (e: any) { console.log('Terms check error:', e.message?.split('\n')[0]); }

  await page.waitForTimeout(1000);

  // ── 11. Click Pay Now ────────────────────────────────────────────────────
  const payNow = page.locator('button:has-text("Pay Now")').first();
  if (await payNow.isVisible({ timeout: 8000 }).catch(() => false)) {
    await page.screenshot({ path: 'screenshots/checkout_ready_to_pay.png' });
    console.log('Pay Now visible — clicking...');
    await payNow.scrollIntoViewIfNeeded();
    await payNow.click({ force: true }).catch(() => {});
    await page.waitForTimeout(8000);
    await page.screenshot({ path: 'screenshots/checkout_after_pay.png' });
    console.log('Post-payment URL:', page.url());
  }

  console.log('Cart/Checkout test completed.');

});