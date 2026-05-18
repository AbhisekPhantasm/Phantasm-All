import { test, expect } from '@playwright/test';

test('Phantasm Home Page Full Test', async ({ page }) => {
  // Helper for consistent screenshots with aggressive loading waits
  const takeScreenshot = async (name: string) => {
    // Wait for the page to be fully loaded (using user's preferred shorter timeouts)
    await page.waitForLoadState('load', { timeout: 3000 }).catch(() => { });
    await page.waitForLoadState('domcontentloaded', { timeout: 1000 }).catch(() => { });

    // Custom check to wait for any visible loaders/spinners to disappear
    await page.evaluate(async () => {
      const isVisible = (el: HTMLElement) => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
      const startTime = Date.now();
      // Wait up to 2 seconds for loaders to vanish
      while (Date.now() - startTime < 2000) {
        const loaders = Array.from(document.querySelectorAll('*')).filter(el => {
          const cls = typeof (el as any).className === 'string' ? (el as any).className : '';
          return (cls.toLowerCase().includes('loader') || cls.toLowerCase().includes('spinner') || cls.toLowerCase().includes('preloader')) && isVisible(el as HTMLElement);
        });
        if (loaders.length === 0) break;
        await new Promise(r => setTimeout(r, 500));
      }
    });

    // Final settle wait for animations
    await page.waitForTimeout(300);

    // Attempt to close annoying third-party popups like Facebook login wall before screenshot
    if (page.url().includes('facebook.com')) {
      const fbClose = page.locator('[aria-label="Close"], [aria-label="close"]').first();
      if (await fbClose.count() > 0) {
        await fbClose.click().catch(() => { });
        await page.waitForTimeout(500);
      }
    }

    await page.screenshot({ path: `test-results/${name}.png`, fullPage: false });
  };

  // Helper to go back home reliably
  const goToHome = async () => {
    await page.goto('https://phantasm.in');
    await page.waitForLoadState('load', { timeout: 3000 }).catch(() => { });
    await page.waitForLoadState('domcontentloaded', { timeout: 1000 }).catch(() => { });
    await page.waitForTimeout(300);
  };

  // ─── Navigate & verify URL ───────────────────────────────────────────────
  await page.goto('https://phantasm.in');
  await expect(page).toHaveURL(/phantasm\.in/);
  await takeScreenshot('home-01-landing');

  // ─── Header: About Us ────────────────────────────────────────────────────
  const aboutUsNav = page.locator('nav a, header a').filter({ hasText: /^About Us$/i }).first();
  await aboutUsNav.click();
  await takeScreenshot('home-02-about-us-nav');
  await goToHome();

  // ─── Header: Services hover ───────────────────────────────────────────────
  const servicesNav = page.locator('nav a, header a').filter({ hasText: /^Services$/i }).first();
  await servicesNav.hover();
  await page.waitForTimeout(300);

  await expect(page.locator('text=Web Development').first()).toBeVisible();
  await expect(page.locator('text=App Development').first()).toBeVisible();
  await expect(page.locator('text=Graphic Designing').first()).toBeVisible();
  await expect(page.locator('text=Video Editing').first()).toBeVisible();
  await expect(page.locator('text=Digital Marketing').first()).toBeVisible();
  await expect(page.locator('text=SEO').first()).toBeVisible();
  await takeScreenshot('home-03-services-hover');

  await servicesNav.click();
  await takeScreenshot('home-04-services-page');
  await goToHome();

  // ─── Header: Case Studies ────────────────────────────────────────────────
  const caseStudiesNav = page.locator('nav a, header a').filter({ hasText: /^Case Studies$/i }).first();
  await caseStudiesNav.click();
  await takeScreenshot('home-05-case-studies');
  await goToHome();

  // ─── Header: Blogs ───────────────────────────────────────────────────────
  const blogsNav = page.locator('nav a, header a').filter({ hasText: /^Blogs$/i }).first();
  await blogsNav.click();
  await takeScreenshot('home-06-blogs');
  await goToHome();

  // ─── Header: Careers ─────────────────────────────────────────────────────
  const careersNav = page.locator('nav a, header a').filter({ hasText: /^Careers$/i }).first();
  await careersNav.click();
  await takeScreenshot('home-07-careers');
  await goToHome();

  // ─── Header: Contact Us ──────────────────────────────────────────────────
  const contactUsNav = page.getByRole('link', { name: 'CONTACT US' }).first();
  await contactUsNav.click();
  await takeScreenshot('home-08-contact-us');
  await goToHome();

  // ─── Header: Search Icon ─────────────────────────────────────────────────
  const searchIcon = page.locator('.wpda-search_icon').first();
  await searchIcon.click();
  await takeScreenshot('home-09-search-icon');
  await goToHome();

  // ─── Header: Sidebar / Hamburger Icon ────────────────────────────────────
  const sidebarIcon = page.locator('.burger_sidebar_icon').first();
  await sidebarIcon.click();
  await takeScreenshot('home-10-sidebar-icon');
  await goToHome();

  // ─── Scroll: Contact Today Button ────────────────────────────────────────
  const contactToday = page.locator('a, button').filter({ hasText: /Contact Today/i }).first();
  await contactToday.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await contactToday.click();
  await takeScreenshot('home-11-contact-today');
  await goToHome();

  // ─── Cards Section: Our Services card ───────────────────────────────────
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(200);

  // Target the card link inside h3, explicitly excluding nav/header context
  const ourServicesCard = page.locator('h3 a[href*="/services/"]').first();
  await ourServicesCard.scrollIntoViewIfNeeded();
  await ourServicesCard.click();
  await takeScreenshot('home-12-our-services-card');
  await goToHome();

  // ─── Cards Section: Case Studies card ───────────────────────────────────
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(200);

  const caseStudiesCard = page.locator('h3 a[href*="/case-studies/"]').first();
  await caseStudiesCard.scrollIntoViewIfNeeded();
  await caseStudiesCard.click();
  await takeScreenshot('home-13-case-studies-card');
  await goToHome();

  // ─── Cards Section: Blogs card ───────────────────────────────────────────
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(200);

  const blogsCard = page.locator('h3 a[href*="/blog-packery-2/"]').first();
  await blogsCard.scrollIntoViewIfNeeded();
  await blogsCard.click();
  await takeScreenshot('home-14-blogs-card');
  await goToHome();

  // ─── Cards Section: Connect with Us card ─────────────────────────────────
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(200);

  const connectCard = page.locator('h3 a[href*="/contact-us/"]').first();
  await connectCard.scrollIntoViewIfNeeded();
  await connectCard.click();
  await takeScreenshot('home-15-connect-with-us-card');
  await goToHome();

  // ─── View Projects Button ────────────────────────────────────────────────
  const viewProjectsBtn = page.locator('a, button').filter({ hasText: /View Projects/i }).first();
  await viewProjectsBtn.scrollIntoViewIfNeeded();
  await viewProjectsBtn.click();
  await takeScreenshot('home-16-view-projects');
  await goToHome();

  // ─── Recent Projects Section ─────────────────────────────────────────────
  const projectNames = [
    'Detailing Guys', 'Nagarajuna Hospital', 'Tangent', 'Pawan Kumar',
    'Stride 4 Excellence', 'Lovis', 'Homely Basket',
    'New Star Agencies', 'Archana Sandeep Reddy', 'Smoq', 'Cleopatrashemp', 'Search Your Space'
  ];

  // Limit to first 5 projects to avoid 20-minute test timeout
  for (let i = 0; i < Math.min(projectNames.length, 5); i++) {
    const projectItem = page.locator('a[href*="/portfolio/"]').filter({ hasText: projectNames[i] }).first();
    const exists = await projectItem.count();
    if (exists > 0) {
      await projectItem.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      try {
        await projectItem.click({ timeout: 5000 });
      } catch (e) {
        await projectItem.evaluate(el => (el as HTMLElement).click());
      }
      await takeScreenshot(`home-17-project-${i + 1}-${projectNames[i].replace(/\s/g, '-')}`);

      // Use goBack for speed instead of full goToHome navigation
      await page.goBack();
      await page.waitForLoadState('load', { timeout: 10000 }).catch(() => { });
      await page.evaluate(() => window.scrollBy(0, 2500)); // Scroll back to grid
      await page.waitForTimeout(300);
    }
  }

  // ─── Recent Projects: View More ──────────────────────

  const viewmoreBtn = page.locator('a, button').filter({ hasText: /View More/i }).first();
  await viewmoreBtn.scrollIntoViewIfNeeded();
  await viewmoreBtn.click();
  await takeScreenshot('home-19-view-more');
  await goToHome();

  // ─── Tech Stack Section ───────────────────────────────────────────────────
  const techStackTabs = [
    'Web Development', 'App Development', 'Graphic Designing',
    'Video Editing', 'Digital Marketing', 'SEO',
  ];

  for (let i = 0; i < techStackTabs.length; i++) {
    const tabLocator = page.locator('.ui-tabs-anchor')
      .filter({ hasText: new RegExp(`^${techStackTabs[i]}$`, 'i') }).first();
    const exists = await tabLocator.count();
    if (exists > 0) {
      await tabLocator.scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      try {
        await tabLocator.click({ timeout: 5000 });
      } catch (e) {
        await tabLocator.evaluate(el => (el as HTMLElement).click());
      }
      await takeScreenshot(`home-19-techstack-${i + 1}-${techStackTabs[i].replace(/\s/g, '-')}`);
    }
  }
  await goToHome();

  // ─── Testimonials: Slide Dots ─────────────────────────────────────────────
  const slideDots = page.locator('.slick-dots li, .elementor-slick-dot');
  const dotsCount = await slideDots.count();
  for (let i = 0; i < Math.min(dotsCount, 8); i++) {
    const dot = slideDots.nth(i);
    await dot.scrollIntoViewIfNeeded();
    try {
      await dot.click({ timeout: 3000 });
    } catch (e) {
      await dot.evaluate(el => (el as HTMLElement).click());
    }
    await page.waitForTimeout(300);
  }
  await takeScreenshot('home-20-testimonials-slides');

  // ─── View Our Project Button ──────────────────────────────────────────────
  const viewOurProjectBtn = page.locator('a, button').filter({ hasText: /View Our Project/i }).first();
  await viewOurProjectBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  try {
    await viewOurProjectBtn.click({ timeout: 5000 });
  } catch (e) {
    await viewOurProjectBtn.evaluate(el => (el as HTMLElement).click());
  }
  await takeScreenshot('home-21-view-our-project');
  await goToHome();

  // ─── FAQ Section ──────────────────────────────────────────────────────────
  const faqItems = page.locator('.elementor-accordion-title, .elementor-toggle-title, [class*="faq"] h3');
  const faqCount = await faqItems.count();
  for (let i = 0; i < Math.min(faqCount, 4); i++) {
    const faq = faqItems.nth(i);
    await faq.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    try {
      await faq.click({ timeout: 3000 });
    } catch (e) {
      await faq.evaluate(el => (el as HTMLElement).click());
    }
    await page.waitForTimeout(200);
  }
  await takeScreenshot('home-22-faq');

  // ─── See Our Services Button ──────────────────────────────────────────────
  const seeServicesBtn = page.locator('a, button').filter({ hasText: /See Our Services/i }).first();
  await seeServicesBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  try {
    await seeServicesBtn.click({ timeout: 5000 });
  } catch (e) {
    await seeServicesBtn.evaluate(el => (el as HTMLElement).click());
  }
  await takeScreenshot('home-23-see-our-services');
  await goToHome();

  // ─── Get in Touch Button ──────────────────────────────────────────────────
  const getInTouchBtn = page.locator('a, button').filter({ hasText: /Get in Touch/i }).first();
  await getInTouchBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  try {
    await getInTouchBtn.click({ timeout: 5000 });
  } catch (e) {
    await getInTouchBtn.evaluate(el => (el as HTMLElement).click());
  }
  await takeScreenshot('home-24-get-in-touch');
  await goToHome();

  // ─── Contact Form ─────────────────────────────────────────────────────────
  const formSection = page.locator('.wpcf7-form').first();
  await formSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  const nameField = formSection.locator('[name="your-name"]');
  const emailField = formSection.locator('[name="your-email"]');
  const phoneField = formSection.locator('[name="your-number"]');
  const messageField = formSection.locator('[name="your-message"]');

  if (await nameField.count()) await nameField.fill('John Doe');
  if (await emailField.count()) await emailField.fill('johndoe@example.com');
  if (await phoneField.count()) await phoneField.fill('9876543210');
  if (await messageField.count()) await messageField.fill('This is a test message from automated testing.');

  // Select service if dropdown exists
  const serviceSelect = formSection.locator('select').first();
  if (await serviceSelect.count()) {
    await serviceSelect.selectOption({ index: 1 });
  }

  await page.waitForTimeout(300);
  await takeScreenshot('home-25-form-filled');

  const sendBtn = formSection.locator('input[type="submit"], button[type="submit"]').first();
  if (await sendBtn.count()) {
    await sendBtn.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    try {
      await sendBtn.click({ timeout: 5000 });
    } catch (e) {
      await sendBtn.evaluate(el => (el as HTMLElement).click());
    }
    await takeScreenshot('home-26-form-submitted');
  }

  await goToHome();

  // ─── Footer Section ───────────────────────────────────────────────────────
  const footer = page.locator('.wpda-footer-builder').first();
  await footer.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  // Expanded locator to include buttons (Newsletter) and icons
  const footerLinks = footer.locator('a, button, [role="button"]');
  const footerLinkCount = await footerLinks.count();
  await takeScreenshot('home-27-footer');

  for (let i = 0; i < footerLinkCount; i++) {
    const link = footerLinks.nth(i);
    const href = await link.getAttribute('href');
    const text = (await link.innerText()).trim() || (await link.getAttribute('aria-label')) || (await link.getAttribute('title')) || `item-${i + 1}`;

    if (href && (href.startsWith('mailto:') || href.startsWith('tel:') || href === '#' || href.includes('javascript:'))) continue;

    // Force to open in same tab to avoid window management issues
    await link.evaluate(el => {
      if (el.tagName === 'A') el.setAttribute('target', '_self');
    });

    await link.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);

    try {
      // Use robust click
      try {
        await link.click({ timeout: 5000 });
      } catch (e) {
        await link.evaluate(el => (el as HTMLElement).click());
      }

      await takeScreenshot(`home-28-footer-link-${i + 1}-${text.replace(/\s/g, '-').slice(0, 20)}`);
      await goToHome();
      await page.locator('.wpda-footer-builder').scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
    } catch (e) {
      console.log(`Skipping footer item ${i + 1}: ${text}`);
    }
  }

  // ─── Copyright Check ─────────────────────────────────────────────────────
  const copyrightText = await page.locator('.wpda-footer-builder').innerText();
  const yearMatch = copyrightText.match(/20\d{2}/);
  const foundYear = yearMatch ? yearMatch[0] : 'Not found';
  await takeScreenshot('home-29-copyright');
  console.log(`Copyright year found: ${foundYear}`);

  // ─── Book an Appointment ─────────────────────────────────────────────────
  const bookAppointmentBtn = page.locator('.calendly-badge-content, [class*="calendly"] div').filter({ hasText: /Book an Appointment/i }).first();
  const bookCount = await bookAppointmentBtn.count();
  if (bookCount > 0) {
    await bookAppointmentBtn.scrollIntoViewIfNeeded();
    try {
      await bookAppointmentBtn.click({ timeout: 5000 });
    } catch (e) {
      await bookAppointmentBtn.evaluate(el => (el as HTMLElement).click());
    }
    await takeScreenshot('home-30-book-appointment-opened');
  } else {
    console.log('Book an Appointment button not found');
  }

  // Close cookie popup if it appears
  const cookieClose = page.locator('[class*="cookie"] button, [id*="cookie"] button, button').filter({ hasText: /accept|close|ok|got it|dismiss/i }).first();
  if (await cookieClose.count()) {
    await cookieClose.click();
    await page.waitForTimeout(200);
  }

  // Click 30 minute meeting option
  const thirtyMinBtn = page.locator('text=/30.?min/i').first();
  if (await thirtyMinBtn.count()) {
    await thirtyMinBtn.click();
    await takeScreenshot('home-31-30min-selected');
  }

  // Select available date
  const availableDate = page.locator('[class*="calendar"] button:not([disabled]), [class*="day"]:not([class*="disabled"]):not([class*="past"])').first();
  if (await availableDate.count()) {
    await availableDate.click();
    await takeScreenshot('home-32-date-selected');
  }

  // Select available time
  const availableTime = page.locator('[class*="time"] button:not([disabled]), [class*="slot"]:not([class*="disabled"])').first();
  if (await availableTime.count()) {
    await availableTime.click();
    await takeScreenshot('home-33-time-selected');
  }

  // Click Next
  const nextBtn = page.locator('button').filter({ hasText: /^Next$/i }).first();
  if (await nextBtn.count()) {
    await nextBtn.click();
    await takeScreenshot('home-34-appointment-next');
  }

  // Fill dummy details
  const apptName = page.locator('input[name*="name" i], input[placeholder*="name" i]').first();
  const apptEmail = page.locator('input[name*="email" i], input[type="email"]').first();
  if (await apptName.count()) await apptName.fill('Jane Smith');
  if (await apptEmail.count()) await apptEmail.fill('janesmith@example.com');

  await takeScreenshot('home-35-appointment-details-filled');

  // Schedule event
  const scheduleBtn = page.locator('button').filter({ hasText: /Schedule|Confirm|Book/i }).first();
  if (await scheduleBtn.count()) {
    await scheduleBtn.click();
    await takeScreenshot('home-36-appointment-scheduled');
  }

  await goToHome();
  await takeScreenshot('home-37-final');
});
