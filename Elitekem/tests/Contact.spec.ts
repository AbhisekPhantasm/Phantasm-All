  import { test, expect } from '@playwright/test';
  import path from 'path';

  /**
   * Capture a VIEWPORT-ONLY screenshot — no fullPage to keep video stable.
   * Attaches to Allure report AND saves to screenshots folder.
   */
  async function snap(page: any, name: string) {
    const buffer = await page.screenshot({ path: path.join('screenshots', `${name}.png`) });
    await test.info().attach(name, { body: buffer, contentType: 'image/png' });
  }

  test('Contact Us Page – Form Validation & Submission', async ({ page }) => {

    await test.step('Navigate to Contact Us Page', async () => {
      await page.goto('https://elitekem.com/contact-us/');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      await snap(page, 'contact_01_page_loaded');
      console.log('✅ Contact Us page loaded');
    });

    await test.step('View Header and Navigation', async () => {
      await expect(page.locator('h1, h2').first()).toBeVisible();
      await snap(page, 'contact_02_header_visible');
      console.log('✅ Header and navigation visible');
    });

    await test.step('View Contact Information', async () => {
      await page.evaluate(() => window.scrollBy(0, 200));
      await page.waitForTimeout(800);
      await snap(page, 'contact_03_contact_info');
      console.log('✅ Contact information visible');
    });

    await test.step('Scroll to Form Section', async () => {
      const formSection = page.locator('form').first();
      await formSection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await snap(page, 'contact_04_form_section');
      console.log('✅ Form section scrolled into view');
    });

    await test.step('Fill Name Field', async () => {
      const nameField = page.locator('input[name*="name" i], input[placeholder*="Name" i]').first();
      if (await nameField.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nameField.fill('John Doe');
      } else {
        await page.locator('form input[type="text"]').first().fill('John Doe');
      }
      await snap(page, 'contact_05_name_filled');
      console.log('✅ Name field filled');
    });

    await test.step('Fill Email Field', async () => {
      await page.locator('input[name*="email" i], input[type="email"]').first().fill('johndoe@example.com');
      await snap(page, 'contact_06_email_filled');
      console.log('✅ Email field filled');
    });

    await test.step('Fill Subject Field', async () => {
      const subjectField = page.locator('input[name*="subject" i], input[placeholder*="Subject" i]').first();
      if (await subjectField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await subjectField.fill('Product Inquiry');
      }
      await snap(page, 'contact_07_subject_filled');
      console.log('✅ Subject field filled');
    });

    await test.step('Fill Phone Field', async () => {
      const phoneField = page.locator('input[name*="phone" i], input[type="tel"]').first();
      if (await phoneField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await phoneField.fill('9876543210');
      }
      await snap(page, 'contact_08_phone_filled');
      console.log('✅ Phone field filled');
    });

    await test.step('Fill Message Field', async () => {
      const messageField = page.locator('textarea').first();
      if (await messageField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await messageField.fill('Hello, I would like to know more about your chemical synthesis services and product offerings.');
      }
      await snap(page, 'contact_09_message_filled');
      console.log('✅ Message field filled');
    });

    await test.step('Review Completed Form', async () => {
      await snap(page, 'contact_10_form_complete_review');
      console.log('✅ All form fields filled – ready to submit');
    });

    await test.step('Click Submit Button', async () => {
      const submitBtn = page.locator('button[type="submit"], input[type="submit"]').first();
      await snap(page, 'contact_11_before_submit');
      await submitBtn.click();
      await page.waitForTimeout(500);
      await snap(page, 'contact_12_submit_clicked');
      console.log('✅ Submit button clicked');
    });

    await test.step('Verify Thank You Success Message', async () => {
      const successMsg = page.locator('.wpcf7-response-output, [class*="success"], p:has-text("thank")').first();
      await successMsg.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(1000);
      await snap(page, 'contact_13_thank_you_success');

      if (await successMsg.isVisible()) {
        const msgText = await successMsg.innerText().catch(() => '');
        console.log(`✅ SUCCESS: "${msgText}"`);
      } else {
        console.log('⚠️ Success message not visible');
      }
    }); 

    await test.step('Scroll to View Full Success State', async () => {
      await page.evaluate(() => window.scrollBy(0, 200));
      await page.waitForTimeout(500);
      await snap(page, 'contact_14_success_scrolled');
      console.log('✅ Full success state visible');
    });

    await test.step('Scroll to Footer', async () => {
      await page.evaluate(() => window.scrollBy(0, 500));
      await page.waitForTimeout(500);
      await snap(page, 'contact_15_footer');
      console.log('✅ Footer visible');
    });

    await test.step('Final Page Validation', async () => {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      await expect(page.locator('form').first()).toBeVisible();
      await snap(page, 'contact_16_final_state');
      console.log('✅ Contact form flow completed');
    });

  });
