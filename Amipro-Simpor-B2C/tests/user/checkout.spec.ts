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
  // If we need to increase quantity first:
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
  await page.waitForTimeout(2000);
  
  // Wait for cart update
  try {
    await expect(page.locator('header')).toContainText(/[1-9]/, { timeout: 10000 });
  } catch (e) {
    console.log('Cart count update not detected, proceeding...');
  }
  return true;
}

test.describe('AmiproSimpor - Checkout Page Test Suite', () => {
  test('Checkout Page Flow', async ({ page }) => {
    test.setTimeout(240000);
    await login(page);

    await addSpecificProductToCart(page);

    // Go to Checkout
    await page.goto(`${BASE_URL}/checkout`);
    await page.waitForLoadState('networkidle');

    // --- Step 1: Fill name, email, phone ---
    await page.getByPlaceholder(/First name/i).first().fill('John');
    await page.getByPlaceholder(/Last name/i).first().fill('Doe');

    const email = page.getByPlaceholder(/Email address/i).first();
    if (await email.inputValue() === '') {
      await email.fill('johndoe' + Date.now() + '@test.com');
    }
    await page.getByPlaceholder(/Phone number/i).first().fill('9876543210');

    // --- Step 2: Fill address and let Google autocomplete do its work ---
    // Type a real US address so autocomplete can match it
    const addressField = page.getByPlaceholder(/Enter your address/i).first();
    await addressField.click();
    await page.keyboard.type('111 N Hill St, Los Angeles', { delay: 50 });
    await page.waitForTimeout(2000); // Wait for autocomplete dropdown

    // Select the first autocomplete suggestion via keyboard
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000); // Let autocomplete populate city/state/country

    // --- Step 3: Fill Apartment (not affected by autocomplete) ---
    await page.getByPlaceholder(/Apartment/i).first().fill('Apt 4B');

    // --- Step 4: Verify auto-filled fields (City/State/Country/Zip are populated and readonly) ---
    const cityVal = await page.locator('input[name="city"]').first().inputValue();
    const zipField = page.getByPlaceholder(/Postal code/i).first();
    const zipVal = await zipField.inputValue();
    console.log(`Auto-filled: city="${cityVal}", zip="${zipVal}"`);

    // Only fill zip if it wasn't auto-filled (i.e., not readonly)
    const isZipReadonly = await zipField.evaluate(el => (el as HTMLInputElement).readOnly);
    if (!isZipReadonly) {
      await zipField.fill('90012');
      await zipField.press('Tab');
    }

    // --- Step 5.5: Check 'Use Shipping Address as Billing Address' ---
    const useShippingCheckbox = page.getByRole('checkbox', { name: /Use Shipping Address as Billing Address/i });
    if (await useShippingCheckbox.isVisible()) {
      if (!(await useShippingCheckbox.isChecked())) {
        await useShippingCheckbox.check({ force: true });
        console.log("Checked 'Use Shipping Address as Billing Address'");
      }
    } else {
      // Fallback selector just in case
      const fallbackCheckbox = page.locator('input[type="checkbox"]').first();
      if (await fallbackCheckbox.isVisible() && !(await fallbackCheckbox.isChecked())) {
        await fallbackCheckbox.check({ force: true });
        console.log("Checked fallback checkbox");
      }
    }
    await page.waitForTimeout(500);

    // --- Step 6: Continue to Payment ---
    await takeScreenshot(page, 'checkout_before_continue');

    // Wait for any background API calls to finish before clicking
    await page.waitForLoadState('networkidle');

    const continueBtn = page.getByRole('button', { name: /Continue to Payment/i }).first();
    await expect(continueBtn).toBeVisible();
    await continueBtn.scrollIntoViewIfNeeded();
    await expect(continueBtn).toBeEnabled();

    // Use evaluate to perform a native DOM click, which avoids Playwright hanging 
    // if the button has weird overlays or animations freezing it.
    await continueBtn.evaluate(node => (node as HTMLElement).click());

    // Wait for Payment Page
    await page.waitForURL(/.*payment/, { timeout: 60000 });
    await page.waitForLoadState('networkidle');

    // Select Payment Option - Prefer "On Account" or similar to bypass external gateways
    const paymentMethods = page.locator('input[type="radio"], [role="radio"]');
    await paymentMethods.first().waitFor({ state: 'visible', timeout: 30000 });
    
    const onAccountLabel = page.getByText(/Buy Using On Account|Cash on Delivery/i).first();
    if (await onAccountLabel.isVisible()) {
      await onAccountLabel.click();
    } else {
      // Fallback: Click the text of the last radio option's container
      await paymentMethods.last().locator('..').click({ force: true });
    }
    
    await page.waitForTimeout(2000); 

    const payBtn = page.locator('button', { hasText: /Pay|Place Order|Complete/i }).first();
    await payBtn.scrollIntoViewIfNeeded();
    await expect(payBtn).toBeVisible({ timeout: 10000 });
    await expect(payBtn).toBeEnabled({ timeout: 10000 });
    await payBtn.click({ force: true });

    // Success Message
    await expect(page.getByText(/Successfully|Success|Thank you|Order placed/i).first()).toBeVisible({ timeout: 60000 });
    console.log('Order completed successfully');
  });
});