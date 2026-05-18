import { test, expect, Page } from '@playwright/test';

export async function waitAndSnap(page: Page, name: string) {
    await page.waitForTimeout(500);
    await page.screenshot({ path: `./screenshots/${name}`, fullPage: false });
}

export async function closePopups(page: Page) {
    const popupSelectors = [
        '.modal-close',
        '.close-popup',
        'button[aria-label*="Close" i]',
        '.modal .btn-close',
        'text=/×/i',
        '#close-login-popup',
        '.gift-popup-close',
        '[class*="gift"] .close',
        '[class*="gift"] button',
        'text=/maybe later/i',
        'text=/no thanks/i'
    ];

    // First try specific close buttons
    for (const selector of popupSelectors) {
        try {
            const closeBtn = page.locator(selector).first();
            if (await closeBtn.isVisible({ timeout: 500 })) {
                await closeBtn.click().catch(() => { });
                console.log(`[Popup] Closed popup using selector: ${selector}`);
                await page.waitForTimeout(500);
            }
        } catch (e) { }
    }

    // Specifically look for gift-related popups and try to close them
    try {
        const giftPopup = page.locator('[class*="gift" i], [id*="gift" i], [class*="reward" i]').first();
        if (await giftPopup.isVisible({ timeout: 500 })) {
            console.log('[Popup] Gift popup detected, attempting to close...');
            const closeBtn = giftPopup.locator('button, a, .close, .btn-close, [aria-label*="close" i], svg').first();
            if (await closeBtn.isVisible({ timeout: 500 })) {
                await closeBtn.click().catch(() => { });
            } else {
                await page.keyboard.press('Escape');
            }
            await page.waitForTimeout(500);
        }
    } catch (e) { }
}

export async function safeGoBack(page: Page, homeUrl: string) {
    if (page.url() !== homeUrl) {
        await page.goto(homeUrl, { waitUntil: 'load' }).catch(() => { });
    }
    await closePopups(page);
    await page.waitForTimeout(1000);
}

export async function clickAndCloseTab(page: Page, locator: any, homeUrl: string) {
    try {
        const target = await locator.getAttribute('target').catch(() => null);
        if (target === '_blank') {
            const context = page.context();
            const [newPage] = await Promise.all([
                context.waitForEvent('page', { timeout: 10000 }).catch(() => null),
                locator.click({ timeout: 5000 }).catch(() => { })
            ]);

            if (newPage) {
                if (newPage.url() === 'about:blank') {
                    console.log(`[Tab] Closing empty about:blank tab.`);
                    await newPage.close().catch(() => {});
                    return;
                }
                await newPage.waitForLoadState('load').catch(() => {});
                console.log(`[Tab] Closed new tab: ${newPage.url()}`);
                await newPage.close().catch(() => { });
            } else {
                await safeGoBack(page, homeUrl);
            }
        } else {
            await locator.click({ timeout: 5000 }).catch(() => { });
            await safeGoBack(page, homeUrl);
        }
    } catch (e: any) {
        console.log(`Error in clickAndCloseTab: ${e?.message || e}`);
        await safeGoBack(page, homeUrl);
    }
}

export async function runHomeChecks(page: Page, prefix: string, homeUrl: string, limit: number = 2) {
    await page.goto(homeUrl, { waitUntil: 'load' });
    await closePopups(page);
    await waitAndSnap(page, `${prefix}_home_00_initial.png`);

    console.log(`[${prefix}] Testing About Us...`);
    const aboutBtn = page.locator('header a[href="/about-us"]').first();
    if (await aboutBtn.isVisible()) {
        await clickAndCloseTab(page, aboutBtn, homeUrl);
        await waitAndSnap(page, `${prefix}_home_03_about.png`);
    }

    console.log(`[${prefix}] Testing Browse...`);
    const browseMenu = page.locator('header').locator('text=/Browse/i').first();
    if (await browseMenu.isVisible()) {
        await browseMenu.hover().catch(() => { });
        try {
            await expect(page.locator('.dropdown-menu').first()).toBeVisible({ timeout: 3000 });
        } catch (e) {
            console.log('Dropdown menu not visible after hover');
        }
        await waitAndSnap(page, `${prefix}_home_04_browse_hover.png`);

        const dropCount = Math.min(await page.locator('.dropdown-menu a').count(), limit);
        for (let i = 0; i < dropCount; i++) {
            await browseMenu.hover().catch(() => { });
            await page.waitForTimeout(500);
            await clickAndCloseTab(page, page.locator('.dropdown-menu a').nth(i), homeUrl);
            await closePopups(page);
            await waitAndSnap(page, `${prefix}_home_05_browse_item_${i}.png`);
        }
    }

    console.log(`[${prefix}] Testing Live...`);
    const liveBtn = page.locator('header a[href="/live"]').first();
    if (await liveBtn.isVisible()) {
        await clickAndCloseTab(page, liveBtn, homeUrl);
        await waitAndSnap(page, `${prefix}_home_06_live.png`);
    }

    console.log(`[${prefix}] Testing Blog...`);
    const blogBtn = page.locator('header a[href="/blog"]').first();
    if (await blogBtn.isVisible()) {
        await clickAndCloseTab(page, blogBtn, homeUrl);
        await waitAndSnap(page, `${prefix}_home_07_blog.png`);
    }

    console.log(`[${prefix}] Testing Search...`);
    const searchIcon = page.locator('.search-icon, i.fa-search, button[aria-label="Search"]').first();
    if (await searchIcon.isVisible()) {
        await searchIcon.click();
        await page.locator('input[type="search"], input[placeholder*="Search"]').fill('Islamic History').catch(() => { });
        await page.keyboard.press('Enter');
        await waitAndSnap(page, `${prefix}_home_08_search.png`);
        await safeGoBack(page, homeUrl);
    }

    console.log(`[${prefix}] Testing Support Sabeel TV Gift...`);
    const giftIcon = page.locator('header a[href*="support"], .gift-icon, i.fa-gift').first();
    if (await giftIcon.isVisible()) {
        await clickAndCloseTab(page, giftIcon, homeUrl);
        await waitAndSnap(page, `${prefix}_home_09_support_gift.png`);
    }

    console.log(`[${prefix}] Testing Hero Slides...`);
    await page.evaluate(() => window.scrollTo(0, 0));
    const supportNow = page.locator('button, a').filter({ hasText: /^Support Now$/i }).first();
    if (await supportNow.isVisible()) {
        await clickAndCloseTab(page, supportNow, homeUrl);
        await waitAndSnap(page, `${prefix}_home_12_hero_support.png`);
    }

    const exploreCourses = page.locator('button, a').filter({ hasText: /^Explore Courses$/i }).first();
    if (await exploreCourses.isVisible()) {
        await clickAndCloseTab(page, exploreCourses, homeUrl);
        await waitAndSnap(page, `${prefix}_home_13_hero_explore.png`);
    }

    const startLearning = page.locator('button, a').filter({ hasText: /^Start Learning$/i }).first();
    if (await startLearning.isVisible()) {
        await clickAndCloseTab(page, startLearning, homeUrl);
        await waitAndSnap(page, `${prefix}_home_14_hero_start.png`);
    }

    console.log(`[${prefix}] Testing Learning Paths...`);
    const paths = ['Quran', 'Seerah of the Prophet', 'Islamic History', 'Islamic Civilization', 'Islamic Ideology', 'Indian Islamic Studies'];
    const pathsLimit = paths.slice(0, limit);
    for (const p of pathsLimit) {
        const btn = page.locator('a, button').filter({ hasText: new RegExp(`^${p}$`, 'i') }).first();
        if (await btn.isVisible()) {
            await btn.scrollIntoViewIfNeeded();
            await clickAndCloseTab(page, btn, homeUrl);
            await waitAndSnap(page, `${prefix}_home_15_path_${p.replace(/ /g, '_')}.png`);
        }
    }

    console.log(`[${prefix}] Testing Popular Courses...`);
    const courses = ['Juz Tabarak', 'Juz Amma', 'History of Tafsir', 'Quran Al Fajr'];
    const coursesLimit = courses.slice(0, limit);
    for (const c of coursesLimit) {
        const btn = page.locator('a, button').filter({ hasText: new RegExp(`^${c}$`, 'i') }).first();
        if (await btn.isVisible()) {
            await btn.scrollIntoViewIfNeeded();
            await clickAndCloseTab(page, btn, homeUrl);
            await waitAndSnap(page, `${prefix}_home_16_course_${c.replace(/ /g, '_')}.png`);
        }
    }

    console.log(`[${prefix}] Testing Explore All...`);
    const exploreAll = page.locator('a, button').filter({ hasText: /Explore All/i }).first();
    if (await exploreAll.isVisible()) {
        await exploreAll.scrollIntoViewIfNeeded();
        await clickAndCloseTab(page, exploreAll, homeUrl);
        await waitAndSnap(page, `${prefix}_home_17_explore_all.png`);
    }

    console.log(`[${prefix}] Hovering Why Choose Us & Testimonials...`);
    const whyCardsCount = await page.locator('.why-choose-us .card, .features .card, [class*="feature"]').count();
    for (let i = 0; i < whyCardsCount; i++) {
        try {
            const card = page.locator('.why-choose-us .card, .features .card, [class*="feature"]').nth(i);
            await card.scrollIntoViewIfNeeded({ timeout: 1000 });
            await card.hover({ force: true, timeout: 1000 });
            await waitAndSnap(page, `${prefix}_home_19_why_card_${i}.png`);
        } catch (e) { continue; }
    }

    const testCount = await page.locator('.testimonial, .review, [class*="testimonial"]').count();
    for (let i = 0; i < testCount; i++) {
        try {
            const test = page.locator('.testimonial, .review, [class*="testimonial"]').nth(i);
            await test.scrollIntoViewIfNeeded({ timeout: 1000 });
            await test.hover({ force: true, timeout: 1000 });
            await waitAndSnap(page, `${prefix}_home_20_testimonial_${i}.png`);
        } catch (e) { continue; }
    }

    console.log(`[${prefix}] Testing FAQs...`);
    const faqCount = await page.locator('.faq-item, .accordion-item, .faq').count();
    for (let i = 0; i < faqCount; i++) {
        const faq = page.locator('.faq-item, .accordion-item, .faq').nth(i);
        await faq.scrollIntoViewIfNeeded();
        await faq.click().catch(() => { });
        await waitAndSnap(page, `${prefix}_home_21_faq_${i}.png`);
    }

    console.log(`[${prefix}] Testing Support Sabeel TV section...`);
    const continueJourney = page.locator('a, button').filter({ hasText: /Continue the Journey/i }).first();
    if (await continueJourney.isVisible()) {
        await continueJourney.scrollIntoViewIfNeeded();
        await clickAndCloseTab(page, continueJourney, homeUrl);
        await waitAndSnap(page, `${prefix}_home_22_continue_journey.png`);
    }

    console.log(`[${prefix}] Scrolling to footer...`);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    console.log(`[${prefix}] Checking for email subscription in footer...`);

    const emailInput = page.locator('footer input[type="email"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
        console.log(`[${prefix}] Filling email input...`);
        await emailInput.scrollIntoViewIfNeeded();
        await emailInput.fill('subscriber@test.com').catch(() => { });
        console.log(`[${prefix}] Clicking Subscribe...`);
        await page.locator('footer button[type="submit"], footer button').filter({ hasText: /Subscribe/i }).first().click({ timeout: 10000 }).catch(() => { });
        console.log(`[${prefix}] Snapshotting subscription...`);
        await waitAndSnap(page, `${prefix}_home_23_footer_subscribe.png`);
    }

    console.log(`[${prefix}] Counting footer links...`);
    const footerCount = await page.locator('footer a').count();
    console.log(`[${prefix}] Found ${footerCount} footer links.`);
    let checkedLinks = 0;
    for (let i = 0; i < footerCount && checkedLinks < limit; i++) {
        const link = page.locator('footer a').nth(i);
        await link.scrollIntoViewIfNeeded().catch(() => { });
        const href = await link.getAttribute('href').catch(() => null);
        if (href && !href.startsWith('#') && !href.includes('phantasm.in') && !href.includes('/login') && !href.includes('/register')) {
            console.log(`[${prefix}] Testing Footer Link ${i}: ${href}`);
            await clickAndCloseTab(page, link, homeUrl);
            await waitAndSnap(page, `${prefix}_home_24_footer_link_${i}.png`);
            checkedLinks++;
        }
    }

    const copyrightText = await page.locator('footer').innerText().catch(() => '');
    expect(copyrightText).toContain('Copyright © SabeelTV');
}
