import { test } from '@playwright/test';
import { logAction } from './logger';
import { fillAndSubmitForms } from './form-filler';
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

test('Case Studies Page QA Traversal', async ({ page }) => {
    test.setTimeout(5 * 60 * 1000); // 5 minutes timeout
    const url = 'https://phantasm.in/case-studies';
    const pageName = 'Case Studies';
    let stepCounter = { value: 1 };
    let screenshotCount = { value: 0 };
    const maxScreenshots = 60;

    page.on('dialog', async dialog => {
        logAction(pageName, `Dialog accepted: ${dialog.message()}`);
        await dialog.accept().catch(() => { });
    });

    logAction(pageName, `Starting task for ${pageName} Page`);
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(2000);
    } catch (error) {
        logAction(pageName, `Failed to navigate: ${(error as Error).message}`);
        return;
    }

    const currentUrl = page.url();

    logAction(pageName, `Taking initial page screenshot.`);
    await page.waitForTimeout(1000);
    const safePageName = pageName.replace(/\s+/g, '-').toLowerCase();
    const initBuffer = await page.screenshot({ path: `screenshots/${safePageName}-initial-load.png`, fullPage: true }).catch(() => null);
    if (initBuffer) await test.info().attach('Initial Load', { body: initBuffer, contentType: 'image/png' });
    screenshotCount.value++;

    await fillAndSubmitForms(page, pageName, stepCounter, maxScreenshots, screenshotCount);

    logAction(pageName, `Resetting page state after initial form checks...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { });
    await page.waitForTimeout(2000);

    logAction(pageName, `Checking for clickable elements...`);
    const clickablesLocator = page.locator('a[href]:visible, button:visible, [role="button"]:visible, img:visible');
    const totalCount = await clickablesLocator.count();
    logAction(pageName, `Found ${totalCount} visible clickable elements.`);

    const redirectionIndices: number[] = [];
    const otherIndices: number[] = [];

    for (let i = 0; i < totalCount; i++) {
        const element = clickablesLocator.nth(i);
        const isRedirection = await element.evaluate(node => {
            const anchor = node.closest('a');
            if (!anchor) return false;
            const href = anchor.getAttribute('href') || '';
            return href.length > 1 && !href.startsWith('#') && (href.includes('phantasm.in') || href.startsWith('/'));
        }).catch(() => false);

        if (isRedirection) redirectionIndices.push(i);
        else otherIndices.push(i);
    }

    logAction(pageName, `Priority: ${redirectionIndices.length} redirection buttons, then ${otherIndices.length} other elements.`);
    const allIndices = [...redirectionIndices, ...otherIndices];

    for (const i of allIndices) {
        try {
            const element = clickablesLocator.nth(i);
            if (!(await element.isVisible().catch(() => false))) continue;

            const shouldSkip = await element.evaluate(node => {
                const anchor = node.closest('a');
                if (!anchor) return false;
                const href = anchor.getAttribute('href') || '';
                return ['mailto:', 'tel:', 'whatsapp:'].some(p => href.toLowerCase().startsWith(p));
            }).catch(() => false);

            if (shouldSkip) continue;

            const isNavbar = await element.evaluate(node => !!node.closest('header, nav, .header, .navbar, .nav-bar')).catch(() => false);
            if (isNavbar) continue; // Skip navbar on non-home pages to avoid repeated tests

            await page.waitForTimeout(1000);
            await element.evaluate(node => {
                if (node.hasAttribute('target')) node.removeAttribute('target');
                node.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }).catch(() => { });

            await page.waitForTimeout(1000);

            logAction(pageName, `Clicking element index ${i} (${redirectionIndices.includes(i) ? 'Redirection' : 'Other'})`);
            try {
                const isStillVisible = await element.isVisible().catch(() => false);
                if (isStillVisible) {
                    await element.click({ timeout: 5000, force: true });
                } else {
                    await element.evaluate(node => (node as any).click()).catch(() => { });
                }
            } catch (e) {
                logAction(pageName, `Playwright click failed for element ${i}, falling back to JS click...`);
                await element.evaluate(node => (node as any).click()).catch(() => { });
            }

            await page.waitForTimeout(1500);
            await fillAndSubmitForms(page, pageName, stepCounter, maxScreenshots, screenshotCount);

            const calendlyClose = page.locator('.calendly-popup-close');
            if (await calendlyClose.isVisible().catch(() => false)) {
                await page.waitForTimeout(1000);
                await calendlyClose.click({ force: true }).catch(() => { });
                await page.waitForTimeout(1000);
            }

            if (screenshotCount.value < maxScreenshots) {
                await page.waitForTimeout(1000);
                const clickName = `${safePageName}-click-${stepCounter.value++}`;
                const clickBuffer = await page.screenshot({ path: `screenshots/${clickName}.png`, fullPage: true }).catch(() => null);
                if (clickBuffer) await test.info().attach(clickName, { body: clickBuffer, contentType: 'image/png' });
                screenshotCount.value++;
            }

            if (page.url().split('#')[0] !== currentUrl.split('#')[0]) {
                logAction(pageName, `Navigation detected. Returning to ${pageName}...`);
                await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => { });
                await page.waitForTimeout(1500);
            }
        } catch (error) {
            logAction(pageName, `Element ${i} interaction failed, continuing...`);
        }
    }

    logAction(pageName, `Finished all interactions. Test completed.`);
});