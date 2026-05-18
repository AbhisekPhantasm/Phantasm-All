import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('Admissions Page Comprehensive QA Scenario', async ({ page }, testInfo) => {
  const pageName = 'Admissions Page';
  const url = 'https://ushodaya.phantasm.solutions/admissions/';
  const homeUrl = 'https://ushodaya.phantasm.solutions/';
  const bugs: any[] = [];

  const logBug = (issue: string, expected: string, actual: string, severity: string) => {
    bugs.push({ page: pageName, issue, expected, actual, severity });
  };

  const snap = async (label: string) => {
    const ss = await page.screenshot({ fullPage: false });
    await testInfo.attach(label, { body: ss, contentType: 'image/png' });
  };

  page.on('console', msg => {
    if (msg.type() === 'error') logBug('Console Error', 'No errors', msg.text(), 'Medium');
  });

  console.log(`Navigating to Admissions: ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await snap('1 - Admissions Page Loaded');

  // WALKTHROUGH
  await page.evaluate(async () => {
    for (let i = 0; i < document.body.scrollHeight; i += 200) {
      window.scrollTo(0, i);
      await new Promise(r => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  const fullSs = await page.screenshot({ fullPage: true });
  await testInfo.attach('2 - Admissions Full Page', { body: fullSs, contentType: 'image/png' });

  // BUTTON REDIRECTIONS
  console.log('Testing button redirections...');
  const buttons = await page.locator('a.elementor-button, .btn, .elementor-button-link').all();
  for (const btn of buttons) {
    if (await btn.isVisible()) {
      const href = await btn.getAttribute('href');
      if (href && href !== '#' && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        await btn.evaluate(node => node.scrollIntoView({ block: 'center' }));
        await page.waitForTimeout(500);
        console.log(`- Clicking button: ${href}`);
        await btn.evaluate(node => (node as HTMLElement).click());
        await page.waitForTimeout(2000);
        await page.goBack().catch(() => page.goto(url));
        await page.waitForLoadState('domcontentloaded');
      }
    }
  }

  // FOOTER LINKS
  console.log('--- CHECKING FOOTER LINKS ---');
  const footerLinks = await page.locator('footer a, .elementor-location-footer a').all();
  for (const link of footerLinks) {
    if (await link.isVisible()) {
      const href = await link.getAttribute('href');
      const text = await link.innerText().catch(() => '');
      if (href && href !== '#' && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('http')) {
        console.log(`- Footer: ${text.trim() || href}`);
        await link.evaluate(node => node.scrollIntoView({ block: 'center' }));
        await link.click().catch(() => {});
        await page.waitForTimeout(1500);
        await page.goBack().catch(() => page.goto(url));
        await page.waitForLoadState('domcontentloaded');
      }
    }
  }

  // FORM VALIDATION & FILL
  console.log('--- TESTING ADMISSIONS FORM ---');
  const submitBtn = page.locator('.wpcf7-submit, input[type="submit"], button[type="submit"]').first();

  if (await submitBtn.isVisible()) {
    await submitBtn.evaluate(node => node.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(700);

    // 1. Empty form validation
    console.log('- Submitting empty form...');
    await submitBtn.click();
    await page.waitForTimeout(2000);
    const errors = page.locator('.wpcf7-not-valid-tip, .error-message, .invalid-feedback');
    if (await errors.count() > 0) {
      console.log(`  Confirmed: ${await errors.count()} validation error(s).`);
    } else {
      logBug('Form Validation', 'Errors shown', 'No errors found', 'High');
    }
    await snap('3 - Admissions Form Validation Errors');

    // 2. Fill all fields
    console.log('- Filling form with valid data...');
    const nameInp  = page.locator('input[name="your-name"], input[name*="name"], input[placeholder*="Name"]').first();
    const emailInp = page.locator('input[name="your-email"], input[type="email"]').first();
    const phoneInp = page.locator('input[name*="phone"], input[type="tel"]').first();
    const msgInp   = page.locator('textarea[name="your-message"], textarea[name*="message"]').first();

    if (await nameInp.isVisible())  { await nameInp.click();  await nameInp.fill('');  await page.keyboard.type('QA Test Student', { delay: 80 }); await page.waitForTimeout(500); }
    if (await emailInp.isVisible()) { await emailInp.click(); await emailInp.fill(''); await page.keyboard.type('qa.student@example.com', { delay: 80 }); await page.waitForTimeout(500); }
    if (await phoneInp.isVisible()) { await phoneInp.click(); await phoneInp.fill(''); await page.keyboard.type('9876543210', { delay: 80 }); await page.waitForTimeout(500); }
    if (await msgInp.isVisible())   { await msgInp.click();   await msgInp.fill('');   await page.keyboard.type('Inquiry about 2025-26 admissions. Automated test.', { delay: 60 }); await page.waitForTimeout(500); }

    await snap('4 - Admissions Form Filled');

    // 3. Submit
    console.log('- Submitting form...');
    await submitBtn.click();
    await page.waitForTimeout(5000);

    const successMsg = page.locator('.wpcf7-mail-sent-ok, .success-message');
    const hasSuccessText = await page.getByText(/Thank you|successfully|sent/i).isVisible().catch(() => false);
    if (await successMsg.isVisible() || hasSuccessText) {
      console.log('  Confirmed: Success message visible.');
    } else {
      logBug('Form Submission', 'Success message', 'Not found after 5s', 'High');
    }
    await snap('5 - Admissions After Submission');
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
