import { Page } from '@playwright/test';

/**
 * Slowly scrolls the page from current position to the very bottom,
 * using small incremental steps with delays to simulate human scrolling.
 *
 * @param page      – Playwright Page object
 * @param stepPx    – Pixels to scroll per step (default 300)
 * @param delayMs   – Milliseconds to wait between steps (default 400)
 */
export async function slowScrollToBottom(
    page: Page,
    stepPx = 300,
    delayMs = 400
): Promise<void> {
    let previousScroll = -1;
    let currentScroll = await page.evaluate(() => window.scrollY);

    while (currentScroll !== previousScroll) {
        previousScroll = currentScroll;
        await page.evaluate((step) => window.scrollBy(0, step), stepPx);
        await page.waitForTimeout(delayMs);
        currentScroll = await page.evaluate(() => window.scrollY);
    }
}

/**
 * Slowly scrolls back to the top of the page.
 */
export async function slowScrollToTop(
    page: Page,
    stepPx = 300,
    delayMs = 400
): Promise<void> {
    let currentScroll = await page.evaluate(() => window.scrollY);

    while (currentScroll > 0) {
        await page.evaluate((step) => window.scrollBy(0, -step), stepPx);
        await page.waitForTimeout(delayMs);
        currentScroll = await page.evaluate(() => window.scrollY);
    }
}
