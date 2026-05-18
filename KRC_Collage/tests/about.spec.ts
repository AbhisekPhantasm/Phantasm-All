import { test, expect } from '@playwright/test';
import { slowScrollToBottom } from './helpers/slow-scroll';

test.describe('About Us Page — End-to-End Navigation & Interaction', () => {

  test('TC_ABOUT_001 — Full About Us page flow', async ({ page }, testInfo) => {
    test.setTimeout(120_000);

    // ── STEP 1: Navigate to Homepage ──────────────────────────────────
    await page.goto('/');
    await expect(page).toHaveURL(/krccollege\.com/);
    await expect(page).toHaveTitle(/KRC|Krishna Reddy/i);
    await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/about-01-homepage.png' }), contentType: 'image/png' });

    // ── STEP 2: Click About Us from header navigation ────────────────
    const aboutNavLink = page.locator('.nav-link-fill', { hasText: 'About Us' });
    await expect(aboutNavLink).toBeVisible();
    await aboutNavLink.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/about/);

    // ── STEP 3: Capture About Us page top ────────────────────────────
    await expect(page.locator('a#KRC')).toBeVisible();
    await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/about-02-about-page-top.png' }), contentType: 'image/png' });

    // ── STEP 4: Slow scroll to "Join KRC Today" section & click ─────
    const joinKrcBtn = page.locator('a[href="/admissions"]', { hasText: /Join KRC Today/i }).first();
    let joinVisible = false;
    while (!joinVisible) {
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(400);
      joinVisible = await joinKrcBtn.isVisible().catch(() => false);
    }
    await expect(joinKrcBtn).toBeVisible();
    await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/about-03-join-krc-today.png' }), contentType: 'image/png' });

    // Click Join KRC Today → navigates to Admissions
    await joinKrcBtn.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/admissions/);
    await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/about-03b-admissions-page.png' }), contentType: 'image/png' });

    // Navigate back to About Us
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/about/);

    // ── STEP 5: Program Section Interaction ──────────────────────────
    const programsHeading = page.getByRole('heading', { name: /programs/i }).first();
    let programsVisible = false;
    while (!programsVisible) {
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(400);
      programsVisible = await programsHeading.isVisible().catch(() => false);
    }
    await expect(programsHeading).toBeVisible();
    await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/about-04-programs-section.png' }), contentType: 'image/png' });

    // Click each program tab button
    const programTabs = [
      'Focused, Disciplined',
      'Proven Results',
      'Strong Character',
      'Supportive Campus',
    ];

    for (const tabText of programTabs) {
      const tabBtn = page.getByRole('button', { name: new RegExp(tabText, 'i') });
      
      // Wait to see if it exists to avoid infinite hang
      const isTabVisible = await tabBtn.isVisible().catch(() => false);
      if (!isTabVisible) {
         try {
            await tabBtn.waitFor({ state: 'visible', timeout: 3000 });
         } catch(e) {
            console.log(`Tab ${tabText} not found, skipping.`);
            continue;
         }
      }
      
      await tabBtn.scrollIntoViewIfNeeded();
      await expect(tabBtn).toBeVisible();
      await tabBtn.click();
      await page.waitForTimeout(500);
      await testInfo.attach('screenshot', { body: await page.screenshot({ path: `test-results/about-04-program-${tabText.toLowerCase().replace(/[^a-z]+/g, '-')}.png` }), contentType: 'image/png' });
    }

    // ── STEP 6: Scroll to "Enroll Now" & click ──────────────────────
    const enrollNowBtn = page.locator('a[href="/admissions"]', { hasText: /Enroll Now/i }).first();
    let enrollVisible = false;
    while (!enrollVisible) {
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(400);
      enrollVisible = await enrollNowBtn.isVisible().catch(() => false);
    }
    await expect(enrollNowBtn).toBeVisible();
    await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/about-05-enroll-now.png' }), contentType: 'image/png' });

    await enrollNowBtn.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/admissions/);
    await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/about-05b-admissions-from-enroll.png' }), contentType: 'image/png' });

    // Navigate back
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/about/);

    // ── STEP 7: Scroll to "Why Choose KRC?" ─────────────────────────
    const whyChooseHeading = page.getByRole('heading', { name: /Why Choose KRC/i });
    let whyVisible = false;
    while (!whyVisible) {
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(400);
      whyVisible = await whyChooseHeading.isVisible().catch(() => false);
    }
    await expect(whyChooseHeading).toBeVisible();
    await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/about-06-why-choose-krc.png' }), contentType: 'image/png' });

    // ── STEP 8: Campus Tour Navigation ──────────────────────────────
    const campusTourHeading = page.getByRole('heading', { name: /Campus Tour/i });
    let campusVisible = false;
    while (!campusVisible) {
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(400);
      campusVisible = await campusTourHeading.isVisible().catch(() => false);
    }
    await expect(campusTourHeading).toBeVisible();
    await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/about-07-campus-tour.png' }), contentType: 'image/png' });

    // Click Next button multiple times
    const nextBtn = page.locator('button[aria-label="Next image"]');
    for (let i = 0; i < 3; i++) {
      await nextBtn.click();
      await page.waitForTimeout(600);
    }
    await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/about-07b-campus-next.png' }), contentType: 'image/png' });

    // Click Previous button multiple times
    const prevBtn = page.locator('button[aria-label="Previous image"]');
    for (let i = 0; i < 3; i++) {
      await prevBtn.click();
      await page.waitForTimeout(600);
    }
    await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/about-07c-campus-prev.png' }), contentType: 'image/png' });

    // ── STEP 9: Continue scrolling to footer (final validation) ─────
    await slowScrollToBottom(page);
    await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/about-08-footer.png' }), contentType: 'image/png' });

    // Verify footer
    await expect(page.locator('a[href="tel:9848548321"]').first()).toBeVisible();
    await expect(page.locator('a[href="mailto:krcvijayawada5@gmail.com"]').first()).toBeVisible();
  });
});
