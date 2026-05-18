import { Page, expect } from '@playwright/test';

/**
 * helpers.ts — Reusable utility functions for KRC test suite
 */

/** Wait for network to settle, then take a named screenshot */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
}

/** Scroll to the bottom of the page smoothly */
export async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  );
  await page.waitForTimeout(600);
}

/** Scroll to the top of the page */
export async function scrollToTop(page: Page): Promise<void> {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(400);
}

/** Verify no broken images on the current page */
export async function verifyNobrokenImages(page: Page): Promise<void> {
  const images = await page.locator('img:visible').all();
  for (const img of images) {
    await img.scrollIntoViewIfNeeded();
    await expect.soft(img).toHaveJSProperty('complete', true);
    await expect.soft(img).not.toHaveJSProperty('naturalWidth', 0);
  }
}

/** Return the response status code for a given URL */
export async function getPageStatus(page: Page, url: string): Promise<number> {
  const response = await page.request.get(url);
  return response.status();
}

/** Verify all nav links return HTTP 200 */
export async function verifyAllNavLinksReturn200(page: Page): Promise<void> {
  const navLinks = [
    '/',
    '/about',
    '/iit-jee-academy',
    '/results',
    '/facilities',
    '/admissions',
    '/blog',
    '/Contact-us',
  ];
  for (const link of navLinks) {
    const status = await getPageStatus(page, `https://www.krccollege.com${link}`);
    expect(status, `Expected 200 for ${link} but got ${status}`).toBe(200);
  }
}

/** Check if an element is in the viewport */
export async function isInViewport(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.top >= 0 && rect.bottom <= window.innerHeight;
  }, selector);
}

/** Wait for a URL to match a given pattern with a timeout */
export async function waitForURL(page: Page, pattern: RegExp, timeout = 10000): Promise<void> {
  await page.waitForURL(pattern, { timeout });
}
