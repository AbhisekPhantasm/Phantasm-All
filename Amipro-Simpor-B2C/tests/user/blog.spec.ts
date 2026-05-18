import { test, expect } from '@playwright/test';


// =============================================
// SECTION: Blog Page Tests — Module 3
// =============================================
test('Module 3: Blog Page Tests', async ({ page }, testInfo) => {
  test.setTimeout(300000);


  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });


  await test.step('Login before test execution', async () => {
    await page.goto('http://82.112.230.248:6022/auth/login');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('input[type="email"], input[name="email"], input[name="username"]').first().fill('abhisek+1@phantasm.co.in');
    await page.locator('input[type="password"], input[name="password"]').first().fill('12345678');
    await page.locator('button[type="submit"], input[type="submit"]').first().click();
    await page.waitForLoadState('domcontentloaded');
  });


  const url = 'http://82.112.230.248:6022/blog';


  await test.step('Open Blog page and take a full-page screenshot', async () => {
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');
    const ss = await page.screenshot({ fullPage: true });
    await testInfo.attach('Blog Page Loaded', { body: ss, contentType: 'image/png' });


    // Scroll through the entire page
    await page.evaluate(async () => {
      for (let i = 0; i < document.body.scrollHeight; i += 500) {
        window.scrollTo(0, i);
        await new Promise(r => setTimeout(r, 100));
      }
      window.scrollTo(0, 0);
    });
  });


  // =============================================
  // SECTION: Blog Card/Article Testing
  // =============================================
  // SECTION: Blog Article Basic Navigation
  // =============================================
  await test.step('Primary Blog Navigation Check', async () => {
    const blogCards = page.locator('article, .blog-post, .elementor-post').first();
    if (await blogCards.isVisible()) {
       await blogCards.scrollIntoViewIfNeeded();
       await blogCards.click();
       await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
       const ss = await page.screenshot({ fullPage: true });
       await testInfo.attach(`Article Detail Page`, { body: ss, contentType: 'image/png' });
       await page.goBack();
    }
  });


  // =============================================
  // SECTION: Buttons and Links — Exhaustive Testing
  // =============================================
  await test.step('Click every button and link', async () => {
    // Wait for the page to stabilize
    await page.waitForTimeout(3000);


    // Select all links and buttons that look interactive
    const selectors = [
      'a:has-text("Read More")',
      'button:has-text("Subscribe")',
      'a.elementor-button',
      '.btn',
      'a[href*="/blog/"]',
      'section a[href]'
    ];
   
    // Filter to get unique, visible elements
    const elements = page.locator(selectors.join(', '));
    const count = await elements.count();
   
    console.log(`Found ${count} buttons/links to test.`);


    const testedHrefs = new Set<string>();


    for (let i = 0; i < count; i++) {
      const el = elements.nth(i);
     
      // Skip hidden
      if (!(await el.isVisible())) continue;
     
      const href = await el.getAttribute('href');
      const text = (await el.innerText()).trim() || "Link " + (i+1);


      // Skip duplicate links or non-navigational ones
      if (href) {
        if (testedHrefs.has(href)) continue;
        testedHrefs.add(href);
      }
      if (href === '#' || href?.startsWith('mailto:') || href?.startsWith('tel:')) continue;


      await test.step(`Testing Redirect: ${text}`, async () => {
        await el.scrollIntoViewIfNeeded();
       
        // Take SS before click
        const ssBefore = await page.screenshot({ fullPage: true });
        await testInfo.attach(`Before Clicking: ${text}`, { body: ssBefore, contentType: 'image/png' });


        try {
          // Click and wait for networkidle
          await el.click();
          await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});


          const currentUrl = page.url();
          console.log(`Redirected to: ${currentUrl}`);


          // Take SS after redirect
          const ssAfter = await page.screenshot({ fullPage: true });
          await testInfo.attach(`After Redirect: ${text} -> ${currentUrl}`, { body: ssAfter, contentType: 'image/png' });


          // Navigate back
          await page.goBack({ waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(2000);
         
          // Take SS after navigating back
          const ssBack = await page.screenshot({ fullPage: true });
          await testInfo.attach(`Back on Blog Page after ${text}`, { body: ssBack, contentType: 'image/png' });


        } catch (error) {
          console.error(`Error interacting with ${text}: ${error}`);
        }
      });
    }
  });


  await test.step('Log Console Errors', async () => {
    if (consoleErrors.length > 0) {
      await testInfo.attach('Console Errors', {
        body: consoleErrors.join('\n'),
        contentType: 'text/plain'
      });
    }
  });
});
