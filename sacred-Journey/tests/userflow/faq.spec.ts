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
test('FAQ Page Automation', async ({ page }) => {
  console.log('Test started: FAQ Page Automation');
  test.setTimeout(180000);
  
  // Step 1: Login
  console.log('Step 1: Logging in user...');
  await loginUser(page);
  await page.screenshot({ path: 'screenshots/faq_login_done.png' });

  // Step 2: Navigate to FAQ page
  console.log('Step 2: Navigating to FAQ page...');
  await page.getByRole('link', { name: 'FAQ' }).first().click({ force: true });
  await page.waitForLoadState('domcontentloaded');
  console.log('FAQ page loaded.');

  // Step 3: Take screenshot of FAQ page
  await page.screenshot({ path: 'screenshots/faq_page_initial.png', fullPage: true });

  // Step 4: Scroll down to FAQ section
  console.log('Step 3: Scrolling to FAQ section...');
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(500);

  // --- PRODUCT SECTION ---
  console.log('--- PRODUCT SECTION ---');
  console.log('Clicking "Product" category...');
  await page.getByText('Product', { exact: true }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/faq_product_category_clicked.png' });
  
  let questions = page.locator('.faq-question, button[aria-expanded], .accordion-button');
  let count = await questions.count();
  console.log(`Found ${count} questions in Product category.`);

  for (let i = 0; i < count; i++) {
    const qText = await questions.nth(i).innerText();
    console.log(`Opening Question ${i + 1}: ${qText.trim()}`);
    await questions.nth(i).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `screenshots/faq_product_q${i + 1}.png` });
  }

  // --- ORDERS & RETURNS SECTION ---
  console.log('--- ORDERS & RETURNS SECTION ---');
  console.log('Clicking "Orders & Returns" category...');
  await page.getByText('Orders & Returns', { exact: true }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/faq_orders_category_clicked.png' });

  questions = page.locator('.faq-question, button[aria-expanded], .accordion-button');
  count = await questions.count();
  console.log(`Found ${count} questions in Orders & Returns category.`);

  for (let i = 0; i < count; i++) {
    const qText = await questions.nth(i).innerText();
    console.log(`Opening Question ${i + 1}: ${qText.trim()}`);
    await questions.nth(i).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `screenshots/faq_orders_q${i + 1}.png` });
  }

  // --- PAYMENT SECTION ---
  console.log('--- PAYMENT SECTION ---');
  console.log('Clicking "Payment" category...');
  await page.getByText('Payment', { exact: true }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/faq_payments_category_clicked.png' });

  questions = page.locator('.faq-question, button[aria-expanded], .accordion-button');
  count = await questions.count();
  console.log(`Found ${count} questions in Payment category.`);

  for (let i = 0; i < count; i++) {
    const qText = await questions.nth(i).innerText();
    console.log(`Opening Question ${i + 1}: ${qText.trim()}`);
    await questions.nth(i).click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `screenshots/faq_payments_q${i + 1}.png` });
  }

  // 6. After completion, navigate back to Home page
  console.log('Step 4: Returning to home page...');
  await page.goto(BASE_URL);
  await page.screenshot({ path: 'screenshots/faq_final_home.png' });
  console.log('FAQ test completed successfully.');
});
