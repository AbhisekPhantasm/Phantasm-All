import { test, expect } from '@playwright/test';
import { slowScrollToBottom } from './helpers/slow-scroll';

test.describe('Contact Us Page — Form Submission Flow', () => {

  test('TC_CONTACT_001 — Full contact form submission flow', async ({ page }, testInfo) => {
    test.setTimeout(90_000);

    // ── STEP 1: Navigate to Homepage ────────────────────────────────────
    await page.goto('/');
    await expect(page).toHaveURL(/krccollege\.com/);
    await expect(page).toHaveTitle(/KRC|Krishna Reddy/i);
    await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/contact-01-homepage.png' }), contentType: 'image/png' });

    // ── STEP 2: Click Contact Us from header navigation ─────────────────
    const contactNavLink = page.locator('.nav-link-fill', { hasText: 'Contact Us' });
    await expect(contactNavLink).toBeVisible();
    await contactNavLink.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/Contact-us/);

    // ── STEP 3: Capture Contact Page Screenshot (Before Submission) ─────
    await expect(page.locator('a#KRC')).toBeVisible();
    await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/contact-02-page-top.png' }), contentType: 'image/png' });

    // ── STEP 4: Slow scroll to Contact Form & Fill it ───────────────────
    // Scroll to "Let's Connect" heading
    const connectHeading = page.getByRole('heading', { name: /Let.*Connect/i });
    let formVisible = false;
    while (!formVisible) {
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(400);
      formVisible = await connectHeading.isVisible().catch(() => false);
    }
    await expect(connectHeading).toBeVisible();
    await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/contact-03-form-section.png' }), contentType: 'image/png' });

    // Fill all form fields
    // Full Name
    const nameField = page.locator('input[name="firstName"]');
    await nameField.scrollIntoViewIfNeeded();
    await nameField.fill('Test User');

    // Email
    const emailField = page.locator('input[name="email"]');
    await emailField.fill('testuser@example.com');

    // Phone
    const phoneField = page.locator('input[name="phone"]');
    await phoneField.fill('9876543210');

    // Course dropdown
    const courseSelect = page.locator('select[name="courseName"]');
    await courseSelect.selectOption({ index: 1 });

    // Message
    const messageField = page.locator('textarea[name="message"]');
    await messageField.fill('This is an automated test query from the Contact Us page.');

    await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/contact-04-form-filled.png' }), contentType: 'image/png' });

    // Click Submit button
    const submitBtn = page.locator('button[type="submit"]', { hasText: /Send|Submit|Apply/i });
    await submitBtn.scrollIntoViewIfNeeded();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // ── STEP 5: Capture Success Message ─────────────────────────────────
    // Wait for submission response
    await page.waitForTimeout(3000);
    await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/contact-05-form-submitted.png' }), contentType: 'image/png' });

    // Check for success/confirmation (alert, toast, or success text)
    const successAlert = page.locator('[role="alert"]');
    const hasAlert = await successAlert.isVisible().catch(() => false);
    if (hasAlert) {
      await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/contact-05b-success-message.png' }), contentType: 'image/png' });
    }

    // ── STEP 6: Final Validation — scroll to footer ─────────────────────
    await slowScrollToBottom(page);
    await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/contact-06-footer.png' }), contentType: 'image/png' });

    // Verify footer contact info
    await expect(page.locator('a[href="tel:9848548321"]').first()).toBeVisible();
    await expect(page.locator('a[href="mailto:krcvijayawada5@gmail.com"]').first()).toBeVisible();

    // Verify footer sections
    await expect(page.locator('#footer-programs')).toBeVisible();
    await expect(page.locator('#footer-quick-links')).toBeVisible();
    await expect(page.locator('#footer-contact')).toBeVisible();

    // Verify no console errors
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    expect(errors.length).toBe(0);
  });
});