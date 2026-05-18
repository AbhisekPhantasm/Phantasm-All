import { test, expect } from '@playwright/test';


// =============================================
// SECTION: Contact Us Page Tests — Module 4
// =============================================
test('Module 4: Contact Us Page Tests', async ({ page }, testInfo) => {
  test.setTimeout(300000);


  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });


  // =============================================
  // SECTION: Login
  // =============================================
  await test.step('Login before test execution', async () => {
    await page.goto('http://82.112.230.248:6022/auth/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.locator('input[type="email"], input[name="email"], input[name="username"]').first().fill('abhisek+1@phantasm.co.in');
    await page.locator('input[type="password"], input[name="password"]').first().fill('12345678');
    await page.locator('button[type="submit"], input[type="submit"]').first().click();
    await page.waitForTimeout(3000);
  });


  const url = 'http://82.112.230.248:6022/contact-us';


  // =============================================
  // SECTION: Open Contact Us Page
  // =============================================
  await test.step('Open Contact Us page and take a full-page screenshot', async () => {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const ss = await page.screenshot({ fullPage: true });
    // await testInfo.attach('Contact Us Page Loaded', { body: ss, contentType: 'image/png' }); // Removing to keep count to 3


    // Scroll through the entire page
    await page.evaluate(async () => {
      for (let i = 0; i < document.body.scrollHeight; i += 500) {
        window.scrollTo(0, i);
        await new Promise(r => setTimeout(r, 100));
      }
      window.scrollTo(0, 0);
    });
    const ssScrolled = await page.screenshot({ fullPage: true });
    await testInfo.attach('Contact Us Page Overview', { body: ssScrolled, contentType: 'image/png' });
  });


  const submitBtn = page.locator('.wpcf7-submit, input[type="submit"], button[type="submit"]').first();


  // =============================================
  // SECTION: Empty Form Submission
  // =============================================
  await test.step('Submit form with all fields empty — verify required field errors', async () => {
    if (await submitBtn.isVisible()) {
      await submitBtn.scrollIntoViewIfNeeded();
      await submitBtn.click();
      await page.waitForTimeout(2500);
      const ss = await page.screenshot({ fullPage: true });
      await testInfo.attach('Empty Form Errors', { body: ss, contentType: 'image/png' });
    }
  });


  // =============================================
  // SECTION: Invalid Email Validation
  // =============================================
  await test.step('Enter invalid email format — verify email validation error', async () => {
    const emailInp = page.locator('input[name="your-email"], input[type="email"]').first();
    if (await emailInp.isVisible()) {
      await emailInp.pressSequentially('invalidemailformat', { delay: 100 });
      await page.waitForTimeout(500);
      await submitBtn.click();
      await page.waitForTimeout(3000); // Wait to show error in video
      const ss = await page.screenshot({ fullPage: true });
      await testInfo.attach('Invalid Email Error', { body: ss, contentType: 'image/png' });
      await emailInp.fill(''); // clear
      await page.waitForTimeout(500);
    }
  });


  // =============================================
  // SECTION: Partial Form Submission
  // =============================================
  await test.step('Fill only some fields and submit — verify only missing fields flagged', async () => {
    const nameInp = page.locator('input[name="your-name"], input[placeholder*="Name"], input[aria-label*="Name"]').first();
    if (await nameInp.isVisible()) {
      await nameInp.pressSequentially('QA Test User', { delay: 100 });
      await page.waitForTimeout(500);
      await submitBtn.click();
      await page.waitForTimeout(3000); // Wait to show partial fill error in video
      const ss = await page.screenshot({ fullPage: true });
      await testInfo.attach('Partial Fill Errors', { body: ss, contentType: 'image/png' });
    }
  });


  // =============================================
  // SECTION: Valid Form Submission
  // =============================================
  await test.step('Fill all input fields with valid data and submit', async () => {
    const nameInp = page.locator('input[name="your-name"], input[placeholder*="Name"], input[aria-label*="Name"]').first();
    const emailInp = page.locator('input[name="your-email"], input[type="email"]').first();
    const subjectInp = page.locator('input[name="your-subject"], input[placeholder*="Subject"]').first();
    const msgInp = page.locator('textarea[name="your-message"], textarea[placeholder*="Message"]').first();


    if (await nameInp.isVisible()) {
      await nameInp.pressSequentially('John Doe', { delay: 100 });
      await testInfo.attach('After Fill Name', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
      await page.waitForTimeout(500);
    }
    if (await emailInp.isVisible()) {
      await emailInp.pressSequentially('john.doe@example.com', { delay: 100 });
      await testInfo.attach('After Fill Email', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
      await page.waitForTimeout(500);
    }
    if (await subjectInp.isVisible()) {
      await subjectInp.pressSequentially('Test Inquiry', { delay: 100 });
      await testInfo.attach('After Fill Subject', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
      await page.waitForTimeout(500);
    }
   
    const phoneInp = page.locator('input#phone, input[name="your-tel"], input[type="tel"], input[placeholder*="Phone"], input[aria-label*="Phone"]').first();
    if (await phoneInp.isVisible()) {
      await phoneInp.pressSequentially('9876543210', { delay: 100 });
      await testInfo.attach('After Fill Phone', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
      await page.waitForTimeout(500);
    }
   
    if (await msgInp.isVisible()) {
      await msgInp.pressSequentially('This is a test message submitted via automated testing.', { delay: 50 });
      await testInfo.attach('After Fill Message', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
      await page.waitForTimeout(1000);
    }


    await submitBtn.click();
    await page.waitForTimeout(5000);


    const ssResult = await page.screenshot({ fullPage: true });
    await testInfo.attach('After Submit - Final Result', { body: ssResult, contentType: 'image/png' });
  });


  // =============================================
  // SECTION: Console Errors
  // =============================================
  await test.step('Log Console Errors', async () => {
    if (consoleErrors.length > 0) {
      await testInfo.attach('Console Errors', {
        body: consoleErrors.join('\n'),
        contentType: 'text/plain'
      });
    }
  });
});
