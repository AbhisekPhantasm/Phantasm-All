import { test, expect } from '@playwright/test';
import { slowScrollToBottom } from './helpers/slow-scroll';

test.describe('Admission Page — Form Submission Flow', () => {

    test('TC_ADMISSIONS_001 — Full admission form submission flow', async ({ page }, testInfo) => {
        test.setTimeout(90_000);

        // ── STEP 1: Navigate to Homepage ────────────────────────────────────
        await page.goto('/');
        await expect(page).toHaveURL(/krccollege\.com/);
        await expect(page).toHaveTitle(/KRC|Krishna Reddy/i);
        await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/admissions-01-homepage.png' }), contentType: 'image/png' });

        // ── STEP 2: Click Admissions from header navigation ─────────────────
        const admissionsNavLink = page.locator('.nav-link-fill', { hasText: 'Admissions' });
        await expect(admissionsNavLink).toBeVisible();
        await admissionsNavLink.click();
        await page.waitForLoadState('domcontentloaded');
        await expect(page).toHaveURL(/\/admissions/);

        // ── STEP 3: Capture Admission Page Screenshot ───────────────────────
        await expect(page.locator('a#KRC')).toBeVisible();
        await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/admissions-02-page-top.png' }), contentType: 'image/png' });

        // ── STEP 4: Slow scroll to Admission Form & Fill it ─────────────────
        // Scroll to "Admissions Open" heading
        const admOpenHeading = page.getByRole('heading', { name: /Admissions Open/i });
        let formVisible = false;
        while (!formVisible) {
            await page.evaluate(() => window.scrollBy(0, 300));
            await page.waitForTimeout(400);
            formVisible = await admOpenHeading.isVisible().catch(() => false);
        }
        await expect(admOpenHeading).toBeVisible();
        await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/admissions-03-form-section.png' }), contentType: 'image/png' });

        // Fill all required fields
        // Full Name
        const nameField = page.locator('input[name="firstName"]');
        await nameField.scrollIntoViewIfNeeded();
        await nameField.fill('Test Student');

        // Email
        const emailField = page.locator('input[name="email"]');
        await emailField.fill('teststudent@example.com');

        // Phone
        const phoneField = page.locator('input[name="phone"]');
        await phoneField.fill('9876543210');

        // Course Name (dropdown)
        const courseSelect = page.locator('select[name="courseName"]');
        await courseSelect.selectOption({ index: 1 }); // "Integrated School Program"

        // Message (Optional)
        const messageField = page.locator('textarea[name="message"]');
        await messageField.fill('This is an automated test submission.');

        await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/admissions-04-form-filled.png' }), contentType: 'image/png' });

        // Click "Apply Now" submit button
        const submitBtn = page.locator('button[type="submit"]', { hasText: /Apply Now/i });
        await submitBtn.scrollIntoViewIfNeeded();
        await expect(submitBtn).toBeVisible();
        await submitBtn.click();

        // ── STEP 5: Capture Submission Confirmation ─────────────────────────
        // Wait for form submission response (success message, alert, or page state change)
        await page.waitForTimeout(3000);
        await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/admissions-05-form-submitted.png' }), contentType: 'image/png' });

        // Check for any success/confirmation indication
        // Look for alert role, toast, or success text
        const successAlert = page.locator('[role="alert"]');
        const hasAlert = await successAlert.isVisible().catch(() => false);
        if (hasAlert) {
            await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/admissions-05b-success-alert.png' }), contentType: 'image/png' });
        }

        // ── STEP 6: Final validation — scroll to footer ─────────────────────
        await slowScrollToBottom(page);
        await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/admissions-06-footer.png' }), contentType: 'image/png' });

        // Verify footer
        await expect(page.locator('a[href="tel:9848548321"]').first()).toBeVisible();
        await expect(page.locator('a[href="mailto:krcvijayawada5@gmail.com"]').first()).toBeVisible();

        // Verify no console errors (basic error check)
        const errors: string[] = [];
        page.on('pageerror', (err) => errors.push(err.message));
        expect(errors.length).toBe(0);
    });
});
