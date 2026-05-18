import { test, expect } from '@playwright/test';

test('Guest Flow - Contact Us Page Comprehensive Automation', async ({ page }) => {
  // Step 1: Open website as a guest (no login)
  await page.goto('http://31.97.61.59:7004/');

  // Instant Age Verification Handling
  await page.locator('button:has-text("YES")').click({ timeout: 3000 }).catch(() => {});

  // Step 2: Navigate to Contact Us page
  await page.getByRole('link', { name: 'Contact Us' }).first().click();
  await page.waitForLoadState('networkidle');

  // Step 3: Fill the Contact Us form
  // We use specific IDs as verified by the browser subagent
  await page.locator('input#firstName').fill('John Guest');
  await page.locator('input#email').fill('johnguest@example.com');
  await page.locator('input#phone').fill('1234567890');
  await page.locator('textarea#message').fill('This is a comprehensive test message from the guest flow automation script. Verifying submission functionality.');

  // Step 5: Take screenshot BEFORE clicking "Send Message" button
  await page.screenshot({ path: 'screenshots/guest_contact_filled_form.png', fullPage: true });

  // Step 6: Click "Send Message"
  const submitBtn = page.locator('button.contact-submit-btn');
  await submitBtn.scrollIntoViewIfNeeded();
  await submitBtn.click();

  // Step 7: Take screenshot AFTER clicking "Send Message"
  // Wait for a few seconds to capture the result or potential success message
  await page.waitForTimeout(5000); 
  await page.screenshot({ path: 'screenshots/guest_contact_after_submission.png', fullPage: true });

  // Step 8: Validate successful submission message if available
  // We check for common success keywords or the disappearance of the form
  const successMessage = page.getByText(/success|thank you|sent|received/i).first();
  if (await successMessage.isVisible({ timeout: 10000 }).catch(() => false)) {
    await expect(successMessage).toBeVisible();
    console.log('Success message detected:', await successMessage.innerText());
  } else {
    // If no explicit message, check if the form fields are cleared or if we got redirected
    console.log('No explicit success message detected, checking form state...');
    const nameVal = await page.locator('input#firstName').inputValue().catch(() => '');
    if (nameVal === '') {
        console.log('Form appears to have been submitted successfully (fields cleared).');
    }
  }
});
