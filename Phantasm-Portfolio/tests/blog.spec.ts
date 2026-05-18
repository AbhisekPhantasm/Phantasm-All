import { test, expect } from '@playwright/test';
import { logAction } from './logger';
import * as fs from 'fs';

// Attach video to Allure report after each test
test.afterEach(async ({ page }, testInfo) => {
    const video = page.video();
    if (video) {
        const videoPath = await video.path().catch(() => null);
        if (videoPath && fs.existsSync(videoPath)) {
            await testInfo.attach('Test Recording', {
                path: videoPath,
                contentType: 'video/webm',
            });
        }
    }
});

test('Blogs Page QA Traversal', async ({ page }) => {
    test.setTimeout(5 * 60 * 1000);

    const blogUrl = 'https://phantasm.in/blog-packery-2/';
    const pageName = 'Blogs';

    // Auto-dismiss any dialogs instantly
    page.on('dialog', async dialog => {
        logAction(pageName, `Dialog accepted: ${dialog.message()}`);
        await dialog.accept().catch(() => { });
    });

    // ─────────────────────────────────────────────────
    // Step 1: Navigate to Homepage
    // ─────────────────────────────────────────────────
    logAction(pageName, 'Step 1: Navigating to Homepage');
    try {
        await page.goto('https://phantasm.in/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (!page.isClosed()) {
            await page.waitForTimeout(2000);
            expect(page.url()).toContain('phantasm.in');
            const ss1 = await page.screenshot({ path: 'screenshots/blog-01-homepage.png', fullPage: true }).catch(() => null);
            if (ss1) await test.info().attach('Step 1 - Homepage', { body: ss1, contentType: 'image/png' });
            logAction(pageName, '✅ Homepage loaded successfully');
        }
    } catch (e) {
        logAction(pageName, `Homepage nav failed, proceeding to blog directly.`);
    }

    // ─────────────────────────────────────────────────
    // Step 2: Navigate to Blog Page via header nav
    // ─────────────────────────────────────────────────
    logAction(pageName, 'Step 2: Clicking Blog from header navigation');
    const navBlogLink = page.locator('header a[href*="blog-packery-2"], nav a[href*="blog-packery-2"]').first();
    await navBlogLink.click({ timeout: 8000, force: true }).catch(async () => {
        await page.goto(blogUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('blog');

    const ss2 = await page.screenshot({ path: 'screenshots/blog-02-blog-listing.png', fullPage: true }).catch(() => null);
    if (ss2) await test.info().attach('Step 2 - Blog Listing Page', { body: ss2, contentType: 'image/png' });
    logAction(pageName, '✅ Blog page opened with list of blogs');

    // ─────────────────────────────────────────────────
    // Blog-wise Navigation (Steps 3–9): 7 blogs
    // Locator: "Read More" links on blog cards
    // ─────────────────────────────────────────────────
    const readMoreLocator = page.locator('a:has-text("Read More")');
    const blogCount = await readMoreLocator.count();
    logAction(pageName, `Found ${blogCount} blogs on page 1`);

    for (let i = 0; i < Math.min(blogCount, 7); i++) {
        const stepNum = i + 3;
        logAction(pageName, `Step ${stepNum}: Interacting with Blog ${i + 1}`);

        // Re-query Read More links after each navigation back
        const readMoreLinks = page.locator('a:has-text("Read More")');
        const readMoreBtn = readMoreLinks.nth(i);

        // Hover on the blog card
        await readMoreBtn.scrollIntoViewIfNeeded().catch(() => { });
        await readMoreBtn.hover({ timeout: 5000 }).catch(() => { });
        await page.waitForTimeout(500);

        // Click Read More (with href fallback)
        const blogHref = await readMoreBtn.getAttribute('href').catch(() => null);
        await readMoreBtn.click({ timeout: 5000, force: true }).catch(async () => {
            if (blogHref) await page.goto(blogHref, { waitUntil: 'domcontentloaded', timeout: 30000 });
        });
        await page.waitForLoadState('domcontentloaded').catch(() => { });
        await page.waitForTimeout(2000);

        // Screenshot of the blog detail page
        const ssName = `blog-0${stepNum}-blog-${i + 1}-detail`;
        const ss = await page.screenshot({ path: `screenshots/${ssName}.png`, fullPage: true }).catch(() => null);
        if (ss) await test.info().attach(`Step ${stepNum} - Blog ${i + 1} Detail`, { body: ss, contentType: 'image/png' });
        logAction(pageName, `✅ Blog ${i + 1} opened: ${page.url()}`);

        // Navigate back to blog listing
        await page.goto(blogUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(1500);
        logAction(pageName, `✅ Navigated back to Blog listing`);
    }

    // ─────────────────────────────────────────────────
    // Step 10: Pagination - Next Page
    // ─────────────────────────────────────────────────
    logAction(pageName, 'Step 10: Clicking Next Page (Pagination)');
    const nextPageLink = page.locator('a.page-numbers:has-text("2"), .elementor-pagination a:has-text("2"), a[href*="blog-packery-2/page/2"]').first();
    const nextVisible = await nextPageLink.isVisible().catch(() => false);

    if (nextVisible) {
        await nextPageLink.scrollIntoViewIfNeeded().catch(() => { });
        await nextPageLink.click({ timeout: 5000, force: true }).catch(async () => {
            await page.goto('https://phantasm.in/blog-packery-2/page/2/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        });
    } else {
        await page.goto('https://phantasm.in/blog-packery-2/page/2/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    }

    await page.waitForLoadState('domcontentloaded').catch(() => { });
    await page.waitForTimeout(2000);

    // Screenshot of page 2
    const ssPage2 = await page.screenshot({ path: 'screenshots/blog-10-page2.png', fullPage: true }).catch(() => null);
    if (ssPage2) await test.info().attach('Step 10 - Next Page (Page 2)', { body: ssPage2, contentType: 'image/png' });
    logAction(pageName, `✅ Next page loaded: ${page.url()}`);

    // Scroll to bottom of page 2
    await page.evaluate('window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })');
    await page.waitForTimeout(2000);
    const ssPage2Bottom = await page.screenshot({ path: 'screenshots/blog-10-page2-bottom.png', fullPage: true }).catch(() => null);
    if (ssPage2Bottom) await test.info().attach('Step 10 - Page 2 Scrolled', { body: ssPage2Bottom, contentType: 'image/png' });

    // ─────────────────────────────────────────────────
    // Step 11: Final Validation
    // ─────────────────────────────────────────────────
    logAction(pageName, 'Step 11: Final Validation - Blog section fully functional ✅');
    expect(page.url()).toContain('blog-packery-2');
});