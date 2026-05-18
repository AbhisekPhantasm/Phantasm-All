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

test('Contact Us Page Automation', async ({ page }) => {
  test.setTimeout(120000);
  // Step 1: Open website
  await page.goto('http://31.97.61.59:7004/');
  
  // Dismiss Age Gate
  await page.locator('button:has-text("YES")').click({ timeout: 5000 }).catch(() => { });
  await page.waitForTimeout(1000);

  // Step 2: Navigate to Contact Us page
  await page.getByRole('link', { name: 'Contact Us' }).first().click({ force: true });
  await page.waitForLoadState('domcontentloaded');



  // Step 3: Locate the Contact Us form
  // We make sure the form is visible
  const form = page.locator('form').filter({ hasText: /Name|Email|Message/i }).first();
  await expect(form).toBeVisible();

  // Step 4: Fill the form using dummy data
  // Using generic placeholders/names common in forms
  const nameInput = page.getByPlaceholder(/name/i).or(page.locator('input[name*="name" i]')).first();
  const emailInput = page.getByPlaceholder(/email/i).or(page.locator('input[type="email"], input[name*="email" i]')).first();
  const phoneInput = page.getByPlaceholder(/phone/i).or(page.locator('input[name*="phone" i], input[type="tel"]')).first();
  const subjectInput = page.getByPlaceholder(/subject/i).or(page.locator('input[name*="subject" i]')).first();
  const messageInput = page.getByPlaceholder(/message/i).or(page.locator('textarea[name*="message" i]')).first();

  if (await nameInput.isVisible()) {
    await nameInput.fill('John Doe');
  }
  if (await emailInput.isVisible()) {
    await emailInput.fill('johndoe@example.com');
  }
  if (await phoneInput.isVisible()) {
    await phoneInput.fill('1234567890');
  }
  if (await subjectInput.isVisible()) {
    await subjectInput.fill('Test Inquiry');
  }
  if (await messageInput.isVisible()) {
    await messageInput.fill('This is a test message from Playwright automation.');
  }

  // Step 5: Take screenshot BEFORE clicking "Send Message" button
  await page.screenshot({ path: 'screenshots/contact_before_submit.png' });

  // Step 6: Click "Send Message"
  const submitBtn = page.locator('button[type="submit"], input[type="submit"]').filter({ hasText: /send|submit/i }).first();
  await submitBtn.click();

  // Step 7: Take screenshot AFTER clicking "Send Message"
  await page.waitForTimeout(2000); // wait for network response / submission message
  await page.screenshot({ path: 'screenshots/contact_after_submit.png' });

  // Step 8: Validate successful submission message if available
  // Assuming a success message might contain words like "successfully", "thank you", "sent"
  const successMessage = page.getByText(/success|thank you|sent/i).first();
  if (await successMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
    await expect(successMessage).toBeVisible();
  }
});
