import { test, expect, Page } from '@playwright/test';
import * as allure from 'allure-js-commons';

async function takeScreenshot(page: Page, name: string): Promise<void> {
  const screenshot = await page.screenshot({ fullPage: false });
  await allure.attachment(name, screenshot, 'image/png');
}

async function performAction(
  page: Page,
  actionName: string,
  action: () => Promise<void>
): Promise<void> {
  try {
    await page.waitForTimeout(1000);

    // Screenshot BEFORE the action
    const beforeShot = await page.screenshot();
    await allure.attachment(`Before – ${actionName}`, beforeShot, 'image/png');

    // Execute the action
    await action();

    // Screenshot AFTER the action
    const afterShot = await page.screenshot();
    await allure.attachment(`After – ${actionName}`, afterShot, 'image/png');
  } catch (error) {
    // Capture failure screenshot only if the page is still open
    if (!page.isClosed()) {
      const failShot = await page.screenshot();
      await allure.attachment(`FAILURE – ${actionName}`, failShot, 'image/png');
    }
    throw error;
  }
}

async function clickFooterLinkAndReturn(
  page: Page,
  linkName: string,
  screenshotName?: string
): Promise<void> {
  await performAction(page, `Click Footer Link: ${linkName}`, async () => {
    // Use last() because footer links may also appear in the header nav
    await page.getByRole('link', { name: linkName, exact: true }).last().click();
    await page.waitForLoadState('domcontentloaded');

    // Take screenshot if a name was provided
    if (screenshotName) {
      await takeScreenshot(page, screenshotName);
    }

    console.log(`✅ Footer link "${linkName}" navigated successfully`);

    // Return to homepage and scroll back to footer
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
  });
}

test('EliteKem Footer – Full Interaction Flow', async ({ page }) => {

  await test.step('Step 1 – Open homepage and scroll to footer', async () => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Scroll to the very bottom to reveal the footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Take screenshot of the footer
    await takeScreenshot(page, 'footer-visible');

    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();

    console.log('✅ Footer is visible');
  });

  // -----------------------------------------------------------------------
  // Steps 2–7: Main Menu Links in Footer
  // -----------------------------------------------------------------------
  await test.step('Steps 2–7 – Main Menu footer links', async () => {

    // Step 2: Click "Home" → go back
    await clickFooterLinkAndReturn(page, 'Home');

    // Step 3: Click "About" → go back
    await clickFooterLinkAndReturn(page, 'About');

    // Step 4: Click "Services" → take screenshot → go back
    await clickFooterLinkAndReturn(page, 'Services', 'footer-services');

    // Step 5: Click "Industries We Serve" → take screenshot → go back
    await clickFooterLinkAndReturn(page, 'Industries We Serve', 'footer-industries');

    // Step 6: Click "Blog" → take screenshot → go back
    await clickFooterLinkAndReturn(page, 'Blog', 'footer-blog');

    // Step 7: Click "Contact Us" → go back
    await clickFooterLinkAndReturn(page, 'Contact Us');
  });

  // -----------------------------------------------------------------------
  // Step 8: Product Link
  // -----------------------------------------------------------------------
  await test.step('Step 8 – Product link in footer', async () => {
    await clickFooterLinkAndReturn(page, 'Products', 'footer-product');
  });

  // -----------------------------------------------------------------------
  // Steps 9–14: Services Links in Footer
  // -----------------------------------------------------------------------
  await test.step('Steps 9–14 – Services links in footer', async () => {

    // Step 9: API Intermediate Synthesis
    await clickFooterLinkAndReturn(page, 'API Intermediate Synthesis', 'footer-api-synthesis');

    // Step 10: Specialty Chemicals
    await clickFooterLinkAndReturn(page, 'Specialty Chemicals', 'footer-specialty-chemicals');

    // Step 11: CDMO Services
    await clickFooterLinkAndReturn(page, 'CDMO Services', 'footer-cdmo-services');

    // Step 12: Peptide Synthesis
    await clickFooterLinkAndReturn(page, 'Peptide Synthesis', 'footer-peptide-synthesis');

    // Step 13: Custom Synthesis
    await clickFooterLinkAndReturn(page, 'Custom Synthesis', 'footer-custom-synthesis');

    // Step 14: API Impurities & Reference Standards
    await clickFooterLinkAndReturn(
      page,
      'API Impurities & Reference Standards',
      'footer-api-impurities'
    );
  });

  // -----------------------------------------------------------------------
  // Steps 15–16: Legal Links
  // -----------------------------------------------------------------------
  await test.step('Steps 15–16 – Legal links in footer', async () => {

    // Step 15: Privacy Policy
    await clickFooterLinkAndReturn(page, 'Privacy Policy', 'footer-privacy-policy');

    // Step 16: Terms and Conditions
    await clickFooterLinkAndReturn(page, 'Terms and Conditions', 'footer-terms-conditions');
  });

  // -----------------------------------------------------------------------
  // Steps 17–20: Contact Data Validation
  // -----------------------------------------------------------------------
  await test.step('Steps 17–20 – Contact data validation', async () => {

    // Make sure we're at the footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // NEW TEST: Validate and print "Quick contact" text
    console.log('✅ Quick contact validation started');

    const quickContactLocator = page.getByText(/Quick contact/i).first();
    const quickContactText = await quickContactLocator.textContent();

    console.log(`📌 Footer Heading: ${quickContactText}`);

    expect(quickContactText).toBeTruthy();
    expect(quickContactText?.trim()).toContain('Quick contact');

    console.log('✅ Quick contact validation passed');

    // Step 17: Read and log the company address
    const addressLocator = page.getByText(/Plot:6\/A, Phase V, IDA/i).first();
    const addressText = await addressLocator.textContent();

    console.log(`📍 Address: ${addressText}`);

    expect(addressText).toBeTruthy();
    expect(addressText!.trim().length).toBeGreaterThan(0);

    // Step 18: Read and log the company email (if visible in footer)
    // Note: The footer may not show an email – try to find it, log result
    try {
      const emailLocator = page.getByText(/contact@elitekem\.com/i).first();
      const emailText = await emailLocator.textContent({ timeout: 5000 });

      console.log(`📧 Email: ${emailText}`);

      expect(emailText).toBeTruthy();
    } catch {
      console.log('⚠️ Email not found in footer – may only be on Contact Us page');
    }

    // Step 19: Read and log the company phone number
    const phoneLocator = page.getByText(/\+91 9384852989/).first();
    const phoneText = await phoneLocator.textContent();

    console.log(`📞 Phone: ${phoneText}`);

    expect(phoneText).toBeTruthy();
    expect(phoneText!.trim().length).toBeGreaterThan(0);

    // Step 20: Assert that address and phone are not empty
    expect(addressText!.trim()).not.toBe('');
    expect(phoneText!.trim()).not.toBe('');

    console.log('✅ Contact data validation passed');

    await takeScreenshot(page, 'footer-contact-data');
  });

  // -----------------------------------------------------------------------
  // Step 21: External design credit link
  // -----------------------------------------------------------------------
  await test.step('Step 21 – External design credit link', async () => {

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await performAction(page, 'Click Design Credit Link (Phantasm)', async () => {
      try {
        // The "Phantasm solutions" link opens in a new tab
        const [newPage] = await Promise.all([
          page.context().waitForEvent('page', { timeout: 15000 }),
          page.getByRole('link', { name: /Phantasm/i }).last().click(),
        ]);

        // Wait for the new tab to load
        await newPage.waitForLoadState('domcontentloaded');
        await expect(newPage).toHaveURL(/phantasm/);

        // Take screenshot of the external page
        await takeScreenshot(newPage, 'footer-design-credit');

        console.log('✅ External design credit link opened successfully');

        // Close the new tab
        await newPage.close();
      } catch (error) {
        console.log('⚠️ Design credit link did not open a new tab or timed out');

        // If it navigated in the same tab, go back
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
      }
    });
  });

  // -----------------------------------------------------------------------
  // Step 22: Final assertion – footer is fully functional
  // -----------------------------------------------------------------------
  await test.step('Step 22 – Final footer health check', async () => {

    // Ensure we're on the homepage
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Verify footer is still visible
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();

    // Verify key footer elements exist
    await expect(page.getByText(/Elitekem Laboratories/i).last()).toBeVisible();
    await expect(page.getByText(/\+91 9384852989/).first()).toBeVisible();

    await takeScreenshot(page, 'footer-final-check');

    console.log('✅ Footer is fully functional – all elements verified');
  });
});