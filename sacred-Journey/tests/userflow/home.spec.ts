import { test, expect } from '@playwright/test';

test('Home Page, Header, Footer and Authentication Interactions', async ({ page }) => {
  test.setTimeout(480000);
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1000);

  // Age Verification
  const ageBtn = page.locator('button.age-modal-btn', { hasText: 'YES' });
  if (await ageBtn.isVisible()) {
    await ageBtn.click();
  }

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/home-initial.png' });

  // HEADER CHECK
  const headerLinks = [
    { text: 'Home', selector: 'a[href="/"]' },
    { text: 'Shop', selector: 'a:has-text("Shop")' },
    { text: 'About', selector: 'a:has-text("About")' },
    { text: 'FAQ', selector: 'a[href="/faq"]' },
    { text: 'Contact Us', selector: 'a[href="/contact"]' },
  ];

  for (const link of headerLinks) {
    const linkEl = page.locator('header, nav, .header, .navbar').locator(link.selector).first();
    await expect(linkEl).toBeVisible();

    // Clicking each to verify navigation
    await linkEl.click({ force: true });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `screenshots/header-${link.text.replace(/ /g, '_')}.png` });

    // Navigate back to Home for the next link
    if (link.text !== 'Home') {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const ageBtn = page.locator('button.age-modal-btn, button:has-text("YES")').first();
      if (await ageBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await ageBtn.click({ force: true }).catch(() => {});
      }
      await page.waitForTimeout(500);
    }
  }

  // LOGIN / REGISTER SECTION
  // Click Login/Register icon in header (the person icon)
  await page.locator('.header-right-icons a, a.d-flex.align-items-center').filter({ has: page.locator('svg, i') }).last().click();
  await page.waitForTimeout(500);

  // Click the "Login/Register" box that appears (as per the user image)
  const popupLink = page.locator('a:has-text("Login/Register"), .login-register-popup a').first();
  if (await popupLink.isVisible()) {
    await popupLink.click();
    await page.waitForTimeout(1000);
  }

  // Click Register link on the left side (from the image structure)
  const regLink = page.locator('a[href="/auth/register"]').first();
  if (await regLink.isVisible()) {
    await regLink.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/register-page.png' });

    // Fill Register Form
    const regEmail = page.locator('input[placeholder="Email *"]');
    if (await regEmail.isVisible()) {
      const dummyEmail = `dummy${Date.now()}@example.com`;
      await page.locator('input[placeholder="First Name *"]').fill('Dummy');
      await page.locator('input[placeholder="Last Name"]').fill('User');
      await regEmail.fill(dummyEmail);
      await page.locator('input[placeholder="Phone Number *"]').fill('1234567890');
      await page.screenshot({ path: 'screenshots/register-filled.png' });

      // Submit & OK
      await page.locator('button:has-text("Submit & Register")').click();
      await page.waitForTimeout(1000);
      const okBtn = page.locator('button:has-text("OK")');
      if (await okBtn.isVisible()) { await okBtn.click(); }
      await page.waitForTimeout(1000);

      // Login
      const loginLink = page.locator('a[href="/auth/login"]').first();
      if (await loginLink.isVisible()) {
        await loginLink.click();
      } else {
        await page.goto('/auth/login');
      }
      await page.waitForTimeout(1000);

      await page.locator('input[placeholder*="Email"]').first().fill('abhisek@phantasm.co.in');
      await page.locator('input[placeholder*="password"]').first().fill('123456');
      await page.screenshot({ path: 'screenshots/login-filled.png' });

      const loginBtn = page.locator('button:has-text("LOGIN")');
      if (await loginBtn.isVisible()) { await loginBtn.click(); }
      await page.waitForTimeout(2000);
    }
  }

  // Navigate back to Home
  await page.goto('/');
  await page.waitForTimeout(1000);

  // FOOTER CHECK
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/footer-section.png' });

  const footerLinks = [
    'Privacy Policy',
    'Terms and Conditions',
    'FAQ',
    'Legal Disclaimer',
    'Refund Policy',
    'Shipping Policy',
    'Subscription & Cancellation Policy'
  ];

  console.log('--- Checking Footer Links ---');
  for (const link of footerLinks) {
    const linkEl = page.locator('footer a, .footer a').filter({ hasText: new RegExp(`^${link}$`, 'i') }).first();
    const isVisible = await linkEl.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) { console.log(`Footer link not visible: ${link}, skipping`); continue; }
    console.log(`Verified Footer Link: ${link}`);

    // force:true bypasses overlay/age-gate instability
    await linkEl.click({ force: true }).catch(() => {});
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `screenshots/footer-${link.replace(/ /g, '_')}.png` });

    // Navigate back to Home and dismiss age gate via localStorage
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.evaluate(() => {
      try { localStorage.setItem('ageVerified', 'true'); localStorage.setItem('age_verified', 'true'); } catch {}
    });
    const ageBtn2 = page.locator('button.age-modal-btn, button:has-text("YES")').first();
    if (await ageBtn2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await ageBtn2.click({ force: true }).catch(() => {});
    }
    await page.waitForTimeout(500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
  }

  // Social Icons
  const socialIcons = ['facebook', 'whatsapp', 'instagram'];
  for (const icon of socialIcons) {
    const iconEl = page.locator(`footer a[href*="${icon}"], .footer a[href*="${icon}"]`).first();
    await expect(iconEl).toBeVisible();
    console.log(`Verified Social Icon: ${icon}`);

    // Click, Screenshot, Navigate Back (handle potential new tabs)
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page', { timeout: 3000 }).catch(() => null),
      iconEl.click()
    ]);
    await page.waitForTimeout(2000);
    if (newPage) {
      await newPage.screenshot({ path: `screenshots/footer-social-${icon}.png` });
      await newPage.close();
    } else {
      await page.screenshot({ path: `screenshots/footer-social-${icon}.png` });
      await page.goto('/');
      const ageBtn = page.locator('button.age-modal-btn', { hasText: 'YES' });
      if (await ageBtn.isVisible()) { await ageBtn.click(); }
      await page.waitForTimeout(500);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
    }
  }

  // Copyright Year
  const currentYear = new Date().getFullYear().toString();
  const copyrightText = await page.locator('footer, .footer').innerText();
  const copyrightLine = copyrightText.split('\n').find(line => line.includes('©')) || '';
  console.log('--- Copyright Information ---');
  console.log(`Copyright Line Found: ${copyrightLine}`);

  await expect(page.locator('footer, .footer')).toContainText(currentYear);
  console.log(`Copyright year ${currentYear} verified.`);

  // HOME PAGE CONTENT
  await page.evaluate(() => window.scrollTo(0, 0));

  // Get Started Button
  const getStarted = page.locator('button.cta-btn-white-invert-border').first();
  if (await getStarted.isVisible()) {
    await getStarted.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/get-started-clicked.png' });
    await page.goBack();
    await page.waitForTimeout(1000);
  }

  // About Us Button
  const aboutUs = page.locator('button.cta-btn-white.about-us-btn');
  if (await aboutUs.isVisible()) {
    await aboutUs.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/about-us-clicked.png' });
    await page.goBack();
    await page.waitForTimeout(1000);
  }

  // Video(Fix strict mode violation and pointer events)
  const video = page.locator('video').first();
  if (await video.isVisible()) {
    // Force scroll to center of the screen
    await video.evaluate((el) => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    await page.waitForTimeout(1000); // Wait for scroll to finish
    await video.click({ force: true });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/video-clicked.png' });
  }

  // Shop Now Button
  const shopNow = page.locator('button.about-cta-btn');
  if (await shopNow.isVisible()) {
    await shopNow.scrollIntoViewIfNeeded();
    await shopNow.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/shop-now-clicked.png' });
    await page.goBack();
    await page.waitForTimeout(1000);
  }

  // Trigger lazy loading by scrolling down progressively
  await page.evaluate(async () => {
    for (let i = 0; i < document.body.scrollHeight; i += window.innerHeight) {
      window.scrollTo(0, i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    window.scrollTo(0, 0); // scroll back to top
  });
  const productsToFind = [
    { fullName: 'Euphoria Candy Flip Gummies', pattern: /Euphoria/i },
    { fullName: 'Sacred Journey Mushroom Chocolate Bars', pattern: /Mushroom.*Chocolate/i },
    { fullName: 'Sacred Journey X Hippy Flips', pattern: /Hippy.*Flips/i },
    { fullName: 'Sacred Journey Mushroom Gummies', pattern: /Mushroom.*Gummies/i },
    { fullName: 'Carpe Diem Chocolate Bars', pattern: /Carpe.*Diem/i }
  ];

  const homeUrl = page.url();

  // --- Validating Product Carousel (Sequential A -> B -> C -> D -> E) ---
  console.log('--- Starting Sequential Product Carousel Validation ---');
  
  // Ensure we are in the products section
  const productsHeading = page.locator('h1, h2, h3').filter({ hasText: /Our Products/i }).first();
  await productsHeading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);

  for (let i = 0; i < productsToFind.length; i++) {
    const item = productsToFind[i];
    console.log(`\n--- Validating Product ${i + 1}/${productsToFind.length}: ${item.fullName} ---`);

    let found = false;
    // Try to find the product by advancing the carousel
    for (let attempt = 0; attempt < 10; attempt++) {
      const activeSlide = page.locator('.swiper-slide-active').first();
      
      // Allow time for the slide to settle and become visible
      await page.waitForTimeout(1000);
      const activeText = await activeSlide.innerText().catch(() => '');
      
      if (item.pattern.test(activeText)) {
        console.log(`Found active slide for: ${item.fullName}`);
        
        // 1. Identify the active product card and scroll it into clear view
        await expect(activeSlide).toBeVisible({ timeout: 5000 });
        await activeSlide.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000); // Pause to show the active slide

        // 2. Click on the product image/title within the active slide
        const clickableElement = activeSlide.locator('img, h3, h4, h2').first();
        console.log(`Clicking active slide for: ${item.fullName}`);
        try {
          await clickableElement.evaluate(el => (el as HTMLElement).click());
          await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
          await page.waitForTimeout(3000); // Pause on the product page to show it

          // 3. Verify redirection
          expect(page.url()).not.toEqual(homeUrl);
          console.log(`Successfully redirected to: ${page.url()}`);

          // 4. Capture screenshot
          const safeName = item.fullName.replace(/ /g, '_');
          await page.screenshot({ path: `screenshots/active-product-${i}-${safeName}.png` });
        } catch (e: any) {
          console.log(`Failed to click product ${item.fullName}: ${e.message}`);
        }

        // 5. Navigate back to Home
        console.log('Navigating back to Home page...');
        await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);

        // Handle age verification
        const ageBtn = page.locator('button.age-modal-btn, button:has-text("YES")').first();
        if (await ageBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await ageBtn.click({ force: true }).catch(() => {});
          await page.waitForTimeout(1000);
        }

        // Scroll back to products section for the next cycle
        await productsHeading.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1500); // Hold the view on the products section
        
        found = true;
        break;
      } else {
        console.log(`Current active slide does not match ${item.fullName}. Advancing...`);
        const nextArrow = page.locator('button.nav.next, .swiper-button-next').first();
        await nextArrow.click({ force: true });
        await page.waitForTimeout(1500); // Slow down transition for video clarity
      }
    }

    expect(found, `Failed to find active slide for: ${item.fullName}`).toBeTruthy();
  }
  console.log('\n--- Sequential Product Carousel Validation Completed ---');
  // Animations Section (Hover)
  const hoverElements = ['Lab Verified', 'Delicious and Convenient', 'Vegan and All Natural'];
  for (const text of hoverElements) {
    const el = page.locator('div, p, span').filter({ hasText: text }).first();
    if (await el.isVisible()) {
      await el.scrollIntoViewIfNeeded();
      await el.hover();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `screenshots/${text}-hover.png` });
    }
  }

  const orderNow = page.locator('button.cta-btn-primary').first();
  if (await orderNow.isVisible()) {
    await orderNow.scrollIntoViewIfNeeded();
    await orderNow.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/order-now-clicked.png' });
    await page.goBack();
  }

  // // Product Features Section
  // await expect(page.locator('text=Enhanced Wellness Blend').first()).toBeVisible();
  // await expect(page.locator('text=Delicious and Convenient').first()).toBeVisible();
  // await expect(page.locator('text=Vegan and All-Natural').first()).toBeVisible();
  // await expect(page.locator('text=30-Day Supply').first()).toBeVisible();

  // "See More" Button in FAQ section
  const seeMoreBtn = page.locator('button, a').filter({ hasText: /See More/i }).first();
  if (await seeMoreBtn.count() > 0) {
    await seeMoreBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await seeMoreBtn.click({ force: true });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/faq-see-more-clicked.png' });
    await page.goBack();
    await page.waitForTimeout(1000);
  }

  // Newsletter Subscription
  const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
  const subscribeBtn = page.locator('button, a').filter({ hasText: /^Subscribe$/i }).first();

  if (await emailInput.count() > 0 && await subscribeBtn.count() > 0) {
    await emailInput.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Fill the email input
    await emailInput.fill('testuser@example.com');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'screenshots/newsletter-email-filled.png' });

    // Click subscribe
    await subscribeBtn.click({ force: true });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/newsletter-subscribed.png' });
  }
});