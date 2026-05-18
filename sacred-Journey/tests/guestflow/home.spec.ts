import { test, expect } from '@playwright/test';

const BASE_URL = 'http://31.97.61.59:7004';

async function safeGoto(page: any, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
}

async function dismissAgeGate(page: any) {
  try {
    const btn = page.locator('button:has-text("YES"), button:has-text("Yes"), button:has-text("I am 21")').first();
    if (await btn.isVisible({ timeout: 5000 })) {
      await btn.click();
      await page.waitForTimeout(1000);
    }
  } catch {}
  await page.evaluate(() => {
    try {
      localStorage.setItem('ageVerified', 'true');
      localStorage.setItem('age_verified', 'true');
      sessionStorage.setItem('ageVerified', 'true');
    } catch {}
  });
}

test('Home Page Guest Flow', async ({ page }) => {
  await safeGoto(page, BASE_URL);
  await dismissAgeGate(page);
  await page.screenshot({ path: 'screenshots/guest-home-01-initial.png', fullPage: true });

  // Header Links
  const headerLinks = ['Shop', 'About', 'FAQ', 'Contact Us'];
  for (const link of headerLinks) {
    const linkEl = page.locator('header, nav').locator(`a:has-text("${link}")`).first();
    if (await linkEl.isVisible()) {
      await linkEl.click({ force: true });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `screenshots/guest-header-${link}.png`, fullPage: true });
      await page.goto(BASE_URL);
      await dismissAgeGate(page);
    }
  }
});
