import { test, expect } from '@playwright/test';

test('Services Page Test', async ({ page }) => {
  // ─── Helpers ──────────────────────────────────────────────────────────────
  const takeScreenshot = async (name: string) => {
    await page.waitForLoadState('load', { timeout: 3000 }).catch(() => { });
    await page.waitForLoadState('domcontentloaded', { timeout: 1000 }).catch(() => { });
    await page.evaluate(async () => {
      const isVisible = (el: HTMLElement) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      const startTime = Date.now();
      while (Date.now() - startTime < 2000) {
        const loaders = Array.from(document.querySelectorAll('*')).filter(el => {
          const cls = typeof (el as any).className === 'string' ? (el as any).className : '';
          return (cls.toLowerCase().includes('loader') || cls.toLowerCase().includes('spinner') || cls.toLowerCase().includes('preloader')) && isVisible(el as HTMLElement);
        });
        if (loaders.length === 0) break;
        await new Promise(r => setTimeout(r, 300));
      }
    }).catch(() => { });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `test-results/services-${name}.png`, fullPage: false }).catch(() => { });
  };

  const goToServices = async () => {
    await page.goto('/services/');
    await page.waitForLoadState('load', { timeout: 3000 }).catch(() => { });
    await page.waitForLoadState('domcontentloaded', { timeout: 1000 }).catch(() => { });
    await page.waitForTimeout(300);
  };

  const closePopups = async () => {
    // Hide Calendly overlay if it exists
    await page.addStyleTag({ content: '.calendly-overlay, .calendly-badge-widget, .calendly-badge-content, #cookie-law-info-bar { display: none !important; }' }).catch(() => { });
    const closeSelectors = ['.calendly-close-overlay', '.cli-modal-close', '.elementor-popup-modal .elementor-button-link'];
    for (const s of closeSelectors) {
      const locator = page.locator(s).first();
      try {
        if (await locator.isVisible({ timeout: 500 }).catch(() => false)) {
          await locator.click({ timeout: 1000 });
        }
      } catch (e) {
        // Silently catch interaction errors
      }
    }
  };

  // Robust click: try native click first, fall back to JS click
  const robustClick = async (locator: ReturnType<typeof page.locator>) => {
    await closePopups();
    try {
      await locator.click({ timeout: 5000 });
    } catch (e) {
      await locator.evaluate(el => (el as HTMLElement).click());
    }
  };

  // Safe scroll: skips elements that are invisible or still animating
  const safeScroll = async (locator: ReturnType<typeof page.locator>) => {
    try {
      if (!(await locator.isVisible({ timeout: 1000 }).catch(() => false))) return false;
      await locator.scrollIntoViewIfNeeded({ timeout: 3000 });
      return true;
    } catch (e) {
      return false;
    }
  };

  // ─── 1. Main Services Page ────────────────────────────────────────────────
  await page.goto('/services/');
  await takeScreenshot('01-landing');

  // ─── 2. Service card links (from the top "DELIVERING VALUE THAT MATTERS" grid)
  //    Real URLs from DOM: /web-development/, /app-development/, /graphic-designing/,
  //    /video-editing/, /digital-marketing/, /seo/
  const serviceCards = [
    { label: 'Web Design & Development', url: '/web-development/' },
    { label: 'App Design & Development', url: '/app-development/' },
    { label: 'Graphic Design & Prototyping', url: '/graphic-designing/' },
    { label: 'Video Creation & Editing', url: '/video-editing/' },
    { label: 'Social Media Marketing', url: '/digital-marketing/' },
    { label: 'SEO', url: '/seo/' },
  ];

  for (let i = 0; i < serviceCards.length; i++) {
    const card = serviceCards[i];

    // Always start from /services/ so we click the actual card button
    await goToServices();

    // ── Find and CLICK the service card on the /services/ page ─────────────
    const baseUrl = card.url.replace(/\/$/, '');
    const cardLink = page.locator(`a[href*="${baseUrl}"]`).filter({ hasNot: page.locator('nav, header, footer') }).first();

    if (await cardLink.count() === 0) {
      console.log(`Card link not found on services page for: ${card.label}`);
      continue;
    }
    // Attempt scroll but ignore failures – the click will still fire via JS if needed.
    try { await cardLink.scrollIntoViewIfNeeded({ timeout: 3000 }); } catch (e) { console.log(`Scroll failed for ${card.label}`); }
    await page.waitForTimeout(200);
    console.log(`Clicking service card: ${card.label}`);
    await robustClick(cardLink);

    // Wait for the sub-page to fully load
    await page.waitForLoadState('load', { timeout: 10000 }).catch(() => { });
    await page.waitForTimeout(300);

    const prefix = `svc-${i + 1}-${card.label.replace(/[\s&]+/g, '_').toLowerCase()}`;

    // ── Initial screenshot ─────────────────────────────────────────────────
    await takeScreenshot(`${prefix}-initial`);

    // ── Scroll down to load lazy content ──────────────────────────────────
    await page.evaluate(() => window.scrollBy(0, 600));
    await page.waitForTimeout(300);
    await takeScreenshot(`${prefix}-scrolled`);

    // ── Hover cards (ALL Elementor image boxes on the sub-page) ─────────────
    const hoverCards = page.locator('.elementor-image-box-wrapper, .gt3-core-imagebox-wrapper');
    const hoverCount = await hoverCards.count();
    for (let j = 0; j < hoverCount; j++) {
      try {
        const hoverEl = hoverCards.nth(j);
        if (!(await hoverEl.isVisible({ timeout: 1000 }).catch(() => false))) continue;
        await hoverEl.scrollIntoViewIfNeeded({ timeout: 3000 });
        await hoverEl.hover({ timeout: 3000, force: true });
        await page.waitForTimeout(200);
        // await takeScreenshot(`${prefix}-hover-${j + 1}`);
      } catch (e) {
        console.log(`Skipping hover card ${j + 1} on ${card.url}: not stable`);
      }
    }

    // ── FAQ / Accordion items — click ALL questions on the page ──────────────
    let faqCount = 0;
    try {
      const faqs = page.locator('.elementor-accordion-item .elementor-tab-title, .elementor-toggle-item .elementor-tab-title');
      faqCount = await faqs.count();
      for (let j = 0; j < faqCount; j++) {
        try {
          const faq = faqs.nth(j);
          if (!(await faq.isVisible({ timeout: 1000 }).catch(() => false))) continue;
          await faq.scrollIntoViewIfNeeded({ timeout: 3000 });
          await robustClick(faq);
          await page.waitForTimeout(200);
          // await takeScreenshot(`${prefix}-faq-${j + 1}`);
        } catch (e) {
          console.log(`Skipping FAQ ${j + 1} on ${card.url}`);
        }
      }
    } catch (e) {
      console.log(`FAQ block skipped for ${card.label} – page may be closed or missing elements`);
    }

    // ── Slider next arrows — click ALL sliders on the page ───────────────────
    const sliderNext = page.locator('.elementor-swiper-button-next, .swiper-button-next, .slick-next, .owl-next, button:has-text("NEXT"), a:has-text("NEXT")');
    const sliderNextCount = await sliderNext.count();
    for (let j = 0; j < sliderNextCount; j++) {
      try {
        const arrow = sliderNext.nth(j);
        if (!(await arrow.isVisible({ timeout: 1000 }).catch(() => false))) continue;
        await arrow.scrollIntoViewIfNeeded({ timeout: 3000 });
        console.log(`Clicking slider ${j + 1} on ${card.url}`);
        await robustClick(arrow);
        await page.waitForTimeout(200);
        // await takeScreenshot(`${prefix}-slider-next-${j + 1}`);
      } catch (e) {
        console.log(`Skipping slider ${j + 1} on ${card.url}`);
      }
    }

    // ── CTA Buttons — click ALL instances of each button on the page ─────────
    const ctaLinks: Record<string, string[]> = {
      '/web-development/': ['View Our Works', 'Contact Now', 'View', 'Discover More', 'Contact Us', 'Book an Appointment', 'VIEW MORE'],
      '/app-development/': ['Contact Today', 'Contact Us', 'View more', 'Book an Appointment', 'NEXT', 'VIEW MORE'],
      '/graphic-designing/': ['Contact Today', 'Contact Us', 'Explore Graphic Design Blogs', 'Book an Appointment', 'VIEW MORE'],
      '/video-editing/': ['Contact Today', 'Contact Us', 'Book an Appointment', 'VIEW MORE'],
      '/digital-marketing/': ['Contact Today', 'View more', 'View Our Projects', 'Explore digital marketing Blogs', 'Book an Appointment', 'VIEW MORE'],
      '/seo/': ['Contact Today', 'Contact Us', 'Book an Appointment', 'VIEW MORE'],
    };

    const ctaTexts = ctaLinks[card.url] ?? [];
    for (let j = 0; j < ctaTexts.length; j++) {
      const allMatchingBtns = page.locator('a, button')
        .filter({ hasText: new RegExp(`${ctaTexts[j].replace(/\s+/g, '\\s*')}`, 'i') })
        .filter({ hasNot: page.locator('nav, header, footer') });

      const btnCount = await allMatchingBtns.count();
      for (let k = 0; k < btnCount; k++) {
        try {
          const ctaBtn = allMatchingBtns.nth(k);
          const beforeUrl = page.url();
          if (!(await ctaBtn.isVisible({ timeout: 1000 }).catch(() => false))) {
            await ctaBtn.evaluate(el => (el as HTMLElement).click());
          } else {
            await ctaBtn.scrollIntoViewIfNeeded({ timeout: 3000 });
            await robustClick(ctaBtn);
          }
          await page.waitForLoadState('load', { timeout: 5000 }).catch(() => { });
          await page.waitForTimeout(300);
          await takeScreenshot(`${prefix}-cta-${j + 1}-${k + 1}-${ctaTexts[j].replace(/\s+/g, '_').toLowerCase()}`);

          if (page.url() !== beforeUrl) {
            await page.goBack();
            await page.waitForLoadState('load', { timeout: 5000 }).catch(() => { });
            await page.waitForTimeout(300);
          }
        } catch (e) {
          console.log(`Skipping CTA "${ctaTexts[j]}" instance ${k + 1} on ${card.url}`);
        }
      }
    }

    // Return to the main services page before the next iteration
    await goToServices();
  }

  // ─── 3. "Discover More" links in the sections grid on /services/ ─────────
  const discoverLinks = [
    { section: 'Graphic Designing', href: '/graphic-designing/' },
    { section: 'Website Development', href: '/web-development/' },
    { section: 'App Development', href: '/app-development/' },
    { section: 'Video Creation', href: '/video-editing/' },
    { section: 'Digital Marketing', href: '/digital-marketing/' },
  ];

  for (let i = 0; i < discoverLinks.length; i++) {
    const { section, href } = discoverLinks[i];
    try {
      const cleanHref = href.replace(/\/$/, '');
      // Prioritize links with "discover more" text, excluding nav/header/footer. 
      // Use .first() on the final combined locator to avoid strict mode violations.
      const discoverBtn = page.locator(`a[href*="${cleanHref}"]`)
        .filter({ hasNot: page.locator('nav, header, footer') })
        .filter({ hasText: /discover more/i })
        .first()
        .or(page.locator(`a[href*="${cleanHref}"]`).filter({ hasNot: page.locator('nav, header, footer') }).first())
        .first();

      if (await discoverBtn.count() > 0) {
        // Ensure the button is visible before clicking
        if (await discoverBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await discoverBtn.scrollIntoViewIfNeeded({ timeout: 3000 });
          console.log(`Clicking discover more button for: ${section}`);
          await robustClick(discoverBtn);
        } else {
          // Fallback: force click via JS if hidden
          console.log(`Force clicking discover more button for: ${section}`);
          await discoverBtn.evaluate(el => (el as HTMLElement).click());
        }
        await page.waitForLoadState('load', { timeout: 5000 }).catch(() => { });
        await page.waitForTimeout(300);
        await takeScreenshot(`discover-${i + 1}-${section.replace(/\s+/g, '_').toLowerCase()}`);
        // Return to services page for the next iteration
        await goToServices();
      } else {
        console.log(`Discover button not found for section: ${section}`);
      }
    } catch (e: any) {
      console.log(`Skipping discover section: ${section} due to error: ${e.message}`);
    }
  }

  // ─── 4. Portfolio / Project links on /services/ ───────────────────────────
  const projects = [
    { name: 'Nagarajuna Hospital', href: '/portfolio/nagarajuna-hospital/' },
    { name: 'Amipro', href: '/portfolio/amipro/' },
    { name: 'American Distributors', href: '/portfolio/americandistributors/' },
  ];

  for (let i = 0; i < projects.length; i++) {
    try {
      const { name } = projects[i];
      const projectHref = projects[i].href.replace(/\/$/, '');
      const projectBtn = page.locator(`a[href*="${projectHref}"]`).filter({ hasNot: page.locator('nav, header, footer') }).first();
      if (await projectBtn.count() > 0) {
        await projectBtn.scrollIntoViewIfNeeded({ timeout: 3000 });
        console.log(`Clicking project link: ${name}`);
        await robustClick(projectBtn);
        await page.waitForLoadState('load', { timeout: 5000 }).catch(() => { });
        await page.waitForTimeout(300);
        await takeScreenshot(`project-${i + 1}-${name.replace(/\s+/g, '_').toLowerCase()}`);
        await goToServices();
      }
    } catch (e) {
      console.log(`Skipping project: ${projects[i].name}`);
    }
  }

  // ─── 5. "Get In Touch" section contact info check ─────────────────────────
  try {
    const phone = page.getByText(/9000\s*731\s*214/).first();
    if (await phone.count() > 0) {
      await phone.scrollIntoViewIfNeeded({ timeout: 3000 });
      await takeScreenshot('contact-phone');
    }
  } catch (e) {
    console.log('Skipping contact phone section');
  }

  // ─── 6. Navigate back to homepage ─────────────────────────────────────────
  await page.goto('/');
  await takeScreenshot('final-home');
});
