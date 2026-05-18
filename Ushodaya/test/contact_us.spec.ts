import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('Contact Us Page Comprehensive QA Scenario', async ({ page }, testInfo) => {
  const pageName = 'Contact Us Page';
  const url = 'https://ushodaya.phantasm.solutions/contact-us/';
  const homeUrl = 'https://ushodaya.phantasm.solutions/';
  const bugs: any[] = [];

  const logBug = (issue: string, expected: string, actual: string, severity: string) => {
    bugs.push({ page: pageName, issue, expected, actual, severity });
  };

  // Helper: take screenshot and attach to Allure report
  const snap = async (label: string) => {
    const ss = await page.screenshot({ fullPage: false });
    await testInfo.attach(label, { body: ss, contentType: 'image/png' });
  };

  page.on('console', msg => {
    if (msg.type() === 'error') logBug('Console Error', 'No errors', msg.text(), 'Medium');
  });

  console.log(`Navigating to Contact Us: ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // SS 1: Page loaded
  await snap('1 - Contact Us Page Loaded');

  // --- FOOTER LINKS CHECK ---
  console.log('--- CHECKING FOOTER LINKS ---');
  const footerLinks = await page.locator('footer a, .elementor-location-footer a').all();
  for (const link of footerLinks) {
    if (await link.isVisible()) {
      const href = await link.getAttribute('href');
      const text = await link.innerText().catch(() => '');
      if (href && href !== '#' && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('http')) {
        console.log(`- Clicking footer link: ${text.trim() || href}`);
        await link.evaluate(node => node.scrollIntoView({ block: 'center' }));
        await link.click().catch(() => {});
        await page.waitForTimeout(1500);
        await page.goBack().catch(() => page.goto(url));
        await page.waitForLoadState('domcontentloaded');
      }
    }
  }

  // --- FORM TESTING ---
  console.log('--- TESTING CONTACT FORM ---');
  const submitBtn = page.locator('.wpcf7-submit, input[type="submit"], button[type="submit"]').first();

  if (await submitBtn.isVisible()) {
    await submitBtn.evaluate(node => node.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(800);

    // STEP 1: EMPTY FORM VALIDATION (visible in video)
    console.log('- Submitting empty form to trigger validation...');
    await submitBtn.click();
    await page.waitForTimeout(2500);

    const errors = page.locator('.wpcf7-not-valid-tip, .error-message, .invalid-feedback');
    if (await errors.count() > 0) {
      console.log(`  Confirmed: ${await errors.count()} validation error(s) visible.`);
    } else {
      logBug('Form Validation', 'Errors shown', 'No errors found', 'High');
    }

    // SS 2: Validation errors visible in report
    await snap('2 - Form Validation Errors (Empty Submit)');

    // STEP 2: FILL EACH FIELD WITH DELAY (visible in video)
    console.log('- Filling form inputs (visible in video)...');

    const nameInp    = page.locator('input[name="your-name"], input[placeholder*="Name"], input[aria-label*="Name"]').first();
    const emailInp   = page.locator('input[name="your-email"], input[type="email"]').first();
    const subjectInp = page.locator('input[name="your-subject"], input[placeholder*="Subject"]').first();
    const msgInp     = page.locator('textarea[name="your-message"], textarea[placeholder*="Message"]').first();

    if (await nameInp.isVisible()) {
      await nameInp.evaluate(node => node.scrollIntoView({ block: 'center' }));
      await nameInp.click();
      await page.waitForTimeout(500);
      await nameInp.fill('');
      await page.keyboard.type('QA Test User', { delay: 80 }); // Type slowly for video
      await page.waitForTimeout(600);
      console.log('  - Filled: Name');
    }

    if (await emailInp.isVisible()) {
      await emailInp.click();
      await page.waitForTimeout(400);
      await emailInp.fill('');
      await page.keyboard.type('qa@example.com', { delay: 80 });
      await page.waitForTimeout(600);
      console.log('  - Filled: Email');
    }

    if (await subjectInp.isVisible()) {
      await subjectInp.click();
      await page.waitForTimeout(400);
      await subjectInp.fill('');
      await page.keyboard.type('Test Inquiry', { delay: 80 });
      await page.waitForTimeout(600);
      console.log('  - Filled: Subject');
    }

    if (await msgInp.isVisible()) {
      await msgInp.click();
      await page.waitForTimeout(400);
      await msgInp.fill('');
      await page.keyboard.type('Automated test for form submission. Please ignore.', { delay: 60 });
      await page.waitForTimeout(800);
      console.log('  - Filled: Message');
    }

    // SS 3: Form fully filled (visible in report)
    await snap('3 - Contact Form Filled (All Fields)');

    // STEP 3: SUBMIT
    console.log('- Submitting form...');
    await submitBtn.click();
    await page.waitForTimeout(6000);

    // Check response
    const successMsg = page.locator('.wpcf7-mail-sent-ok, .success-message');
    const hasSuccessText = await page.getByText(/Thank you|successfully|sent/i).isVisible().catch(() => false);
    if (await successMsg.isVisible() || hasSuccessText) {
      console.log('  Confirmed: Success message visible.');
    } else {
      logBug('Form Submission', 'Success message', 'No response after 6s', 'High');
    }

    // SS 4: After submission result
    await snap('4 - After Form Submission');
  }

  console.log('Returning to Home Page...');
  await page.goto(homeUrl, { waitUntil: 'domcontentloaded' });

  if (bugs.length > 0) {
    const resultsDir = path.join(process.cwd(), 'qa-results');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
    let report = '';
    for (const bug of bugs) report += `| ${bug.page} | ${bug.severity} | ${bug.issue} | ${bug.expected} | ${bug.actual} |\n`;
    fs.appendFileSync(path.join(resultsDir, 'bug_report.md'), report);
  }
});
