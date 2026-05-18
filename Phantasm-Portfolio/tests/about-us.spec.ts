import { test, expect } from '@playwright/test';

test('About Us Page', async ({ page }) => {
  // Helper for consistent screenshots with aggressive loading waits
  const takeScreenshot = async (name: string) => {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('load', { timeout: 3000 }).catch(() => { });
    await page.waitForLoadState('domcontentloaded', { timeout: 1000 }).catch(() => { });

    // Custom check to wait for any visible loaders/spinners to disappear
    await page.evaluate(async () => {
      const isVisible = (el: HTMLElement) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      const startTime = Date.now();
      // Wait up to 10 seconds for loaders to vanish
      while (Date.now() - startTime < 2000) {
        const loaders = Array.from(document.querySelectorAll('*')).filter(el => {
          const cls = typeof (el as any).className === 'string' ? (el as any).className : '';
          return (cls.toLowerCase().includes('loader') || cls.toLowerCase().includes('spinner') || cls.toLowerCase().includes('preloader')) && isVisible(el as HTMLElement);
        });
        if (loaders.length === 0) break;
        await new Promise(r => setTimeout(r, 500));
      }
    });

    // Final settle wait for animations (floating icons, etc.)
    await page.waitForTimeout(300);
    await page.screenshot({ path: `test-results/about-us-${name}.png`, fullPage: false });
  };

  // Helper to go back home reliably
  const goToAbout = async () => {
    await page.goto('/about-us/');
    await page.waitForLoadState('load', { timeout: 30000 }).catch(() => { });
    await page.waitForLoadState('domcontentloaded', { timeout: 1000 }).catch(() => { });
    await takeScreenshot('00-about-us');
    await page.waitForTimeout(300);
  };

  await page.goto('/about-us/');
  await takeScreenshot('01-initial');

  // ── Buttons: View Demos & Contact Us ──────────────────────────────────────
  // Using a more robust locator to find the links regardless of nested spans
  const viewDemosBtn = page.locator('a, button, [role="button"]').filter({ hasText: /view demo/i }).first();
  const contactUsBtn = page.locator('a, button, [role="button"]').filter({ hasText: /contact us/i }).first();

  if (await viewDemosBtn.count() > 0) {
    await viewDemosBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    try {
      await viewDemosBtn.click({ timeout: 5000 });
    } catch (e) {
      console.log('Falling back to evaluate click for View Demos');
      await viewDemosBtn.evaluate(el => (el as HTMLElement).click());
    }
    await page.waitForTimeout(200);
    await takeScreenshot('02-view-demos');
    await goToAbout();
  } else {
    console.log('View Demos button not found');
  }

  if (await contactUsBtn.count() > 0) {
    await contactUsBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    try {
      await contactUsBtn.click({ timeout: 5000 });
    } catch (e) {
      console.log('Falling back to evaluate click for Contact Us');
      await contactUsBtn.evaluate(el => (el as HTMLElement).click());
    }
    await takeScreenshot('03-contact-us');
    await goToAbout();
  } else {
    console.log('Contact Us button not found');
  }

  // ── Hover over each service item ─────────────────────────────────────────
  const hoverLabels = [
    'Web Designs & Development',
    'App Designs & Development',
    'Graphic Designing & Printing',
    'Video Creation & Editing',
    'Digital Marketing & SEO Services',
    'CMS & Inventory Management Services',
  ];

  for (let i = 0; i < hoverLabels.length; i++) {
    const selector = '.gt3-core-imagebox-title, .gt3-core-imagebox-wrapper, .elementor-widget-container h3, .elementor-image-box-title';
    const el = page.locator(selector).filter({ hasText: hoverLabels[i] }).first();

    if (await el.count() > 0) {
      await el.scrollIntoViewIfNeeded();
      await el.hover();
      await page.waitForTimeout(300);
      await takeScreenshot(`04-hover-${i + 1}`);
    } else {
      // Fallback: try regex to be more flexible with newlines/whitespace
      const regexEl = page.locator(selector).filter({ hasText: new RegExp(hoverLabels[i].replace(/\s+/g, '\\s+'), 'i') }).first();
      if (await regexEl.count() > 0) {
        await regexEl.scrollIntoViewIfNeeded();
        await regexEl.hover();
        await page.waitForTimeout(300);
        await takeScreenshot(`04-hover-${i + 1}`);
      }
    }
  }

  // ── Slides: click each of the 6 slide dots ───────────────────────────────
  const dots = page.locator('.slick-dots li, .owl-dot');
  const dotCount = await dots.count();

  for (let i = 0; i < Math.min(dotCount, 6); i++) {
    await dots.nth(i).scrollIntoViewIfNeeded();
    await dots.nth(i).click();
    await page.waitForTimeout(300); // Slider transition
    await takeScreenshot(`05-slide-${i + 1}`);
  }

  // ── Image section: scroll, hover & click each image ───
  const imageLabels = [
    'Web Design & Development',
    'App Design & Development',
    'Graphic Designing & Video Editing',
    'SEO Campaigns',
  ];

  for (let i = 0; i < imageLabels.length; i++) {
    // Target specific classes to avoid the header navigation menu
    const selector = '.gt3-core-imagebox-title, .gt3-core-imagebox-wrapper, .elementor-widget-container h3, .elementor-image-box-title';
    let card = page.locator(selector).filter({ hasText: imageLabels[i] }).first();

    if (await card.count() === 0) {
      // Fallback: try regex to be more flexible with newlines/whitespace
      card = page.locator(selector).filter({ hasText: new RegExp(imageLabels[i].replace(/\s+/g, '\\s+'), 'i') }).first();
    }

    if (await card.count() > 0) {
      await card.scrollIntoViewIfNeeded();
      await card.hover();
      await page.waitForTimeout(300);
      try {
        await card.click({ timeout: 5000 });
        await takeScreenshot(`06-img-${i + 1}`);
        // await goToAbout();
      } catch (e) {
        console.log(`Failed to click card ${i + 1}: ${imageLabels[i]}`);
      }
    }
  }

  // ── Help / Contact section ───────────────────────────────────────────────
  const phone = page.getByText(/9000\s*731\s*214/).first();
  const email = page.getByText(/info@phantasm\.in/i).first();

  if (await phone.count()) {
    await phone.scrollIntoViewIfNeeded();
    await takeScreenshot('07-phone');
  }

  if (await email.count()) {
    await email.scrollIntoViewIfNeeded();
    await takeScreenshot('08-email');
  }

  // ── Navigate back to home ─────────────────────────────────────────────────
  await page.goto('/');
  await takeScreenshot('09-home-final');
});