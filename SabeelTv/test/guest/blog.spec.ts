import { test, expect } from '@playwright/test';

const BASE_URL = 'http://31.97.61.59:3010';

test('Guest - Blog Page Workflow', async ({ page }) => {
    // 1. Navigate to Website
    console.log('Navigating to Homepage...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    console.log('✅ 1. Homepage loaded successfully.');

    // 2. Navigate to Blog Page from Header
    console.log('Navigating to Blog page via header...');
    const blogNavLink = page.getByRole('link', { name: 'Blog', exact: true });
    await blogNavLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*blog.*/);
    console.log('Blog page opened successfully.');

    // 3. Capture Blog Page Screenshot
    await test.info().attach('Blog Listing Page', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png'
    });
    console.log('Initial blog listing screenshot captured.');

    // 4. Header Validation
    console.log('Validating header elements...');
    const header = page.locator('nav').first();
    await expect(page.getByRole('link', { name: /logo/i }).or(page.locator('img[alt*="logo"]'))).toBeVisible();
    await expect(header.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'About Us' })).toBeVisible();
    await expect(header.getByRole('button', { name: 'Browse' }).or(header.getByRole('link', { name: 'Browse' }))).toBeVisible();
    await expect(header.getByRole('link', { name: 'Live' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Blog' })).toBeVisible();
    console.log('✅ 4. Header is displayed correctly.');

    // 5. Blog Listing Validation & 6. Blog Count Validation
    console.log('Identifying blog cards...');
    const blogCards = page.locator('a.group, .blog-card');
    const count = await blogCards.count();
    console.log(`✅ Blog count fetched successfully: ${count}`);

    if (count > 0) {
        const firstCard = blogCards.first();
        await expect(firstCard.locator('h2, h3')).toBeVisible(); // Title
        await expect(firstCard.locator('img')).toBeVisible(); // Image
        console.log('Blog elements (Title, Image) are visible.');
    }

    // 7. Blog-wise Navigation & Interaction
    const iterations = Math.min(count, 3);
    for (let i = 0; i < iterations; i++) {
        console.log(`\n--- Interacting with Blog ${i + 1} ---`);
        const currentCards = page.locator('a.group, .blog-card');
        const card = currentCards.nth(i);
        const titleText = await card.locator('h2, h3').innerText();
        console.log(`Blog Title: ${titleText}`);

        await card.click();
        await page.waitForLoadState('networkidle');

        // 8. Blog Detail Page Validation
        await expect(page.locator('h1, h2').filter({ hasText: titleText })).toBeVisible();
        console.log('Detail page title is visible.');

        await test.info().attach(`Blog Detail ${i + 1}`, {
            body: await page.screenshot({ fullPage: true }),
            contentType: 'image/png'
        });
        await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
        await page.waitForTimeout(1000);

        // 10. Back Navigation Validation
        console.log('Navigating back to listing...');
        await page.goBack();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/.*blog.*/);
    }

    // 9. Scroll Validation
    console.log('Performing smooth scroll on listing page...');
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
    await page.waitForTimeout(1500);
    await test.info().attach('Blog Page - Scrolled Bottom', {
        body: await page.screenshot({ fullPage: false }),
        contentType: 'image/png'
    });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await page.waitForTimeout(1500);
    await test.info().attach('Blog Page - Scrolled Top', {
        body: await page.screenshot({ fullPage: false }),
        contentType: 'image/png'
    });

    console.log('✅ Guest - Blog page tested successfully.');
});