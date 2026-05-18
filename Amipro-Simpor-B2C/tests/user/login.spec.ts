import { test, expect } from '@playwright/test';


// =============================================
// SECTION: Login Page Tests — Module 1
// =============================================
test('Module 1: Login Page Tests', async ({ page }, testInfo) => {
  test.setTimeout(180000); // 3 minutes — sufficient for all negative + positive steps


  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });


  const url = 'http://82.112.230.248:6022/auth/login';


  // =============================================
  // SECTION: Open Login Page
  // =============================================
  await test.step('Open Login page and take a full-page screenshot', async () => {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const ss = await page.screenshot({ fullPage: true });
    await testInfo.attach('Login Page Loaded', { body: ss, contentType: 'image/png' });
  });


  // =============================================
  // SECTION: Negative Test — Empty Fields
  // =============================================
  await test.step('Negative Login Test: Submit with empty email and password', async () => {
    const loginBtn = page.locator('button[type="submit"], input[type="submit"]').first();
    await loginBtn.click();
    await page.waitForTimeout(1500);
    const ss = await page.screenshot({ fullPage: true });
    await testInfo.attach('Validation Error State', { body: ss, contentType: 'image/png' });
  });


  // =============================================
  // SECTION: Negative Test — Empty Password
  // =============================================
  await test.step('Negative Login Test: Submit with valid email but empty password', async () => {
    const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
    await testInfo.attach('Before Fill Email', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    await emailInput.fill('abhisek+1@phantasm.co.in');
    await testInfo.attach('After Fill Email', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    await testInfo.attach('Before Click: Submit (Valid Email)', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
   
    const loginBtn = page.locator('button[type="submit"], input[type="submit"]').first();
    await loginBtn.click();
    await page.waitForTimeout(1500);
    await testInfo.attach('After Click: Submit (Valid Email)', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });


  // =============================================
  // SECTION: Negative Test — Empty Email
  // =============================================
  await test.step('Negative Login Test: Submit with empty email but valid password', async () => {
    // Re-navigate to ensure clean state
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await testInfo.attach('Before Fill Password', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    await passwordInput.fill('12345678');
    await testInfo.attach('After Fill Password', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
   
    const loginBtn = page.locator('button[type="submit"], input[type="submit"]').first();
    await loginBtn.click();
    await page.waitForTimeout(1500);
    await testInfo.attach('After Click Submit', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });


  // =============================================
  // SECTION: Negative Test — Wrong Password
  // =============================================
  await test.step('Negative Login Test: Submit with wrong password', async () => {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
    await emailInput.fill('abhisek+1@phantasm.co.in');
    await testInfo.attach('After Fill Email', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
   
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await passwordInput.fill('wrongpassword');
    await testInfo.attach('Before Click: Submit (Wrong Password)', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
   
    const loginBtn = page.locator('button[type="submit"], input[type="submit"]').first();
    await loginBtn.click();
    await page.waitForTimeout(2500);
    await testInfo.attach('After Click: Submit (Wrong Password)', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });


  // =============================================
  // SECTION: Positive Test — Correct Credentials
  // =============================================
  await test.step('Positive Login Test: Valid credentials', async () => {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
    await emailInput.fill('abhisek+1@phantasm.co.in');
    await testInfo.attach('After Fill Email', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
   
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await testInfo.attach('Before Fill Password', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    await passwordInput.fill('12345678');
    await testInfo.attach('After Fill Password', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
    await testInfo.attach('Before Click: Login (Correct Credentials)', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
   
    const loginBtn = page.locator('button[type="submit"], input[type="submit"]').first();
    await loginBtn.click();
    await page.waitForTimeout(3000);
    await testInfo.attach('After Click: Login (Correct Credentials)', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });


    // Navigate to home since site doesn't auto-redirect
    await page.goto('http://82.112.230.248:6022/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await testInfo.attach('After Home Navigation', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });


    expect(page.url()).not.toBe(url);
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
