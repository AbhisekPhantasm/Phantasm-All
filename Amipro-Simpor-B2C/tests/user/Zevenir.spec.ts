import { test, expect } from '@playwright/test';


// =============================================
// SECTION: Zevenir Page Tests — Module 2
// =============================================
test('Module 2: Zevenir Page Tests', async ({ page }, testInfo) => {
  test.setTimeout(300000);


  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });


  await test.step('Login before test execution', async () => {
    await page.goto('http://82.112.230.248:6022/auth/login', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await page.locator('input[type="email"], input[name="email"], input[name="username"]').first().fill('abhisek+1@phantasm.co.in');
    await page.locator('input[type="password"], input[name="password"]').first().fill('12345678');
    await page.locator('button[type="submit"], input[type="submit"]').first().click();
    await page.waitForTimeout(3000);
  });


  const url = 'http://82.112.230.248:6022/zevenir';


  await test.step('Open Zevenir page and take a full-page screenshot', async () => {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const ss = await page.screenshot({ fullPage: true });
    await testInfo.attach('Zevenir Page Loaded', { body: ss, contentType: 'image/png' });
   
    // Scroll through the entire page section by section
    await page.evaluate(async () => {
      for (let i = 0; i < document.body.scrollHeight; i += 500) {
        window.scrollTo(0, i);
        await new Promise(r => setTimeout(r, 80));
      }
      window.scrollTo(0, 0);
    });
    const ssScrolled = await page.screenshot({ fullPage: true });
    await testInfo.attach('Zevenir Page Full Scroll', { body: ssScrolled, contentType: 'image/png' });
  });


  // =============================================
  // SECTION: 2nd Section — Click every product link
  // =============================================
  await test.step('2nd Section Testing', async () => {
    // Only click <a> tags — clicking raw <img> doesn't navigate anywhere
    const products = page.locator('section').nth(1).locator('a[href]');
    const count = await products.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const product = page.locator('section').nth(1).locator('a[href]').nth(i);
      if (await product.isVisible()) {
        await product.scrollIntoViewIfNeeded();
        const href = await product.getAttribute('href');
        const text = `Product ${i+1}`;
        try {
          await product.hover();
          await page.waitForTimeout(500);
          await testInfo.attach(`Hover Effect: ${text}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
         
          await testInfo.attach(`Before Click: ${text}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
          await product.click({ timeout: 5000 });
          await page.waitForTimeout(2000);
          await testInfo.attach(`After Redirect: ${text}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
          if (page.url() !== url) {
            await page.goBack({ waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);
            await testInfo.attach(`Back on Zevenir from ${text}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
          }
        } catch (e) {
          // Non-interactive link, skip
        }
      }
    }
  });


  // =============================================
  // SECTION: "OUR PRODUCTS" Section (3rd Section)
  // =============================================
  await test.step('OUR PRODUCTS Section (3rd Section)', async () => {
    const products = page.locator('section').nth(2).locator('a[href]');
    const count = await products.count();
    for (let i = 0; i < Math.min(count, 10); i++) {
      const product = page.locator('section').nth(2).locator('a[href]').nth(i);
      if (await product.isVisible()) {
        await product.scrollIntoViewIfNeeded();
        try {
          const text = `3rd Section Product ${i+1}`;
          await product.hover();
          await page.waitForTimeout(500);
          await testInfo.attach(`Hover Effect: ${text}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
         
          await testInfo.attach(`Before Click: ${text}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
          await product.click({ timeout: 5000 });
          await page.waitForTimeout(2000);
          await testInfo.attach(`After Redirect: ${text}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
          if (page.url() !== url) {
            await page.goBack({ waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);
            await testInfo.attach(`Back on Zevenir from ${text}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
          }
        } catch (e) {}
      }
    }
  });


  // =============================================
  // SECTION: 5th Section — "View in Store" Carousel
  // =============================================
  await test.step('5th Section Carousel Testing', async () => {
    const carouselArrows = page.locator('.slick-next, .swiper-button-next, [aria-label="Next"]').first();
    if (await carouselArrows.isVisible()) {
      await carouselArrows.scrollIntoViewIfNeeded();
      const ssBefore = await page.screenshot({ fullPage: true });
      await testInfo.attach('Carousel Before Click', { body: ssBefore, contentType: 'image/png' });


      await carouselArrows.click();
      await page.waitForLoadState('domcontentloaded');
      const ssAfter = await page.screenshot({ fullPage: true });
      await testInfo.attach('Carousel After Next Click', { body: ssAfter, contentType: 'image/png' });
    }
   
    // Discover Now
    const discoverNowBtn = page.locator('a:has-text("Discover Now")i, button:has-text("Discover Now")i').first();
    if (await discoverNowBtn.isVisible()) {
      await discoverNowBtn.click();
      await page.waitForLoadState('domcontentloaded');
      const ss = await page.screenshot({ fullPage: true });
      await testInfo.attach('Discover Now Page', { body: ss, contentType: 'image/png' });
     
      if (page.url() !== url) {
        await page.goBack();
        await page.waitForLoadState('domcontentloaded');
      }
    }
  });


  // =============================================
  // SECTION: Featured Products Section
  // =============================================
  await test.step('Featured Products Section', async () => {
    // Click the link inside each product card, not the card itself
    const featuredLinks = page.locator('.featured-product a[href], .product-card a[href]');
    const count = await featuredLinks.count();
    for (let i = 0; i < Math.min(count, 8); i++) {
      const product = page.locator('.featured-product a[href], .product-card a[href]').nth(i);
      if (await product.isVisible()) {
        await product.scrollIntoViewIfNeeded();
        try {
          const text = `Featured Product ${i+1}`;
          await testInfo.attach(`Before Click: ${text}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
          await product.click({ timeout: 5000 });
          await page.waitForTimeout(2000);
          await testInfo.attach(`After Redirect: ${text}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
          if (page.url() !== url) {
            await page.goBack({ waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(1000);
            await testInfo.attach(`Back on Zevenir from ${text}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
          }
        } catch (e) {}
      }
    }
  });


  // =============================================
  // SECTION: TARGETED CARE ACROSS SKIN TYPES
  // =============================================
  await test.step('Targeted Care Hover Effects', async () => {
    const targetedCareHeading = page.locator('text="TARGETED CARE ACROSS SKIN TYPES"i').first();
    if (await targetedCareHeading.isVisible()) {
      await targetedCareHeading.scrollIntoViewIfNeeded();
      const images = page.locator('section').nth(7).locator('img');
      let imgCount = await images.count();
      for (let i = 0; i < imgCount; i++) {
        const img = page.locator('section').nth(7).locator('img').nth(i);
        if (await img.isVisible()) {
          await img.hover();
          // Explicit timeout for hover animation rendering
          await page.waitForTimeout(500);
          const ss = await page.screenshot({ fullPage: true });
          await testInfo.attach(`Hover Effect Image ${i+1}`, { body: ss, contentType: 'image/png' });
        }
      }
    }
  });


  // =============================================
  // SECTION: FAQ Accordion Testing
  // =============================================
  await test.step('9th Section — FAQs', async () => {
    const faqSection = page.locator('text="FAQ"i, text="Frequently Asked Questions"i').first();
    if (await faqSection.isVisible()) {
      await faqSection.scrollIntoViewIfNeeded();
      const faqs = page.locator('.accordion-item, details, .faq-item');
      let faqCount = await faqs.count();
      for (let i = 0; i < faqCount; i++) {
        const faq = page.locator('.accordion-item, details, .faq-item').nth(i);
        if (await faq.isVisible()) {
           await faq.click();
           await page.waitForTimeout(500); // Accordion animation
           const ssExpand = await page.screenshot({ fullPage: true });
           await testInfo.attach(`FAQ ${i+1} Expanded`, { body: ssExpand, contentType: 'image/png' });


           // Click again to collapse
           await faq.click();
           await page.waitForTimeout(500);
           const ssCollapse = await page.screenshot({ fullPage: true });
           await testInfo.attach(`FAQ ${i+1} Collapsed`, { body: ssCollapse, contentType: 'image/png' });
        }
      }
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


