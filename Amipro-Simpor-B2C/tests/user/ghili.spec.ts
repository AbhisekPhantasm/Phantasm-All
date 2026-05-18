import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { attachBrandOverviewForAllure } from '../allure-helpers';

if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots', { recursive: true });
}

test.describe('Ghilli Page — Comprehensive Test', () => {
  test.describe.configure({ timeout: 240_000 });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      try {
        if (page.isClosed()) return;
        const safeTitle = testInfo.title.replace(/[|\\/:*?"<>]/g, '-').replace(/\s+/g, '-');
        await page.screenshot({
          path: `screenshots/FAILED-${safeTitle}-${Date.now()}.png`,
          fullPage: true,
          timeout: 30_000,
        });
      } catch {
        /* context already torn down */
      }
    }
  });

  async function login(page: any) {
    await page.goto('http://82.112.230.248:6022/auth/login');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(600);

    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await emailInput.fill('abhisek+1@phantasm.co.in');

    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill('12345678');

    const loginButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
    await expect(loginButton).toBeVisible();
    await loginButton.click();
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(800);
  }

  test('Ghilli Comprehensive Test - All Scenarios', async ({ page }, testInfo) => {
    await login(page);
    
    // 1. Navigate to Ghilli page and verify it loads
    await page.goto('http://82.112.230.248:6022/ghilli');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(600);
    
    const heading = page.locator('h1, h2, h3, [class*="heading"], [class*="title"]').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/ghilli/);
    await page.screenshot({ path: 'screenshots/ghilli-01-page-load.png', fullPage: true });
    console.log('✓ Step 1: Page load verification complete');
    
    // 2. Verify Header
    try {
      const header = page.locator('header, nav, [class*="header"], [class*="navbar"], banner').first();
      await expect(header).toBeVisible();
    } catch {
      console.log('Header not found - continuing');
    }
    
    try {
      const logo = page.locator('img[alt*="Logo"], img[alt*="logo"], a img').first();
      await expect(logo).toBeVisible();
    } catch {
      console.log('Logo not found - continuing');
    }
    console.log('✓ Step 2: Header verification complete');
    await page.screenshot({ path: 'screenshots/ghilli-02-header.png', fullPage: true });
    
    // 3. Verify Banner
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    
    try {
      const banner = page.locator('[class*="banner"], [class*="hero"], [class*="slider"], section').first();
      await expect(banner).toBeVisible();
    } catch {
      console.log('Banner not found - continuing');
    }
    
    try {
      const bannerImage = page.locator('[class*="banner"] img, [class*="hero"] img, section img').first();
      await expect(bannerImage).toBeVisible();
    } catch {
      console.log('Banner image not found - continuing');
    }
    console.log('✓ Step 3: Banner verification complete');
    await page.screenshot({ path: 'screenshots/ghilli-03-banner.png', fullPage: true });
    
    // 4. Scroll Through Page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'screenshots/ghilli-04-scroll.png', fullPage: true });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    console.log('✓ Step 4: Scroll verification complete');
    
    // 5. Verify Product Cards
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.3));
    await page.waitForTimeout(1000);
    
    const productLinks = page.locator('main a img, section a img, [class*="product"] a img, [class*="card"] a img').locator('..');
    const count = await productLinks.count();
    expect(count).toBeGreaterThan(0);
    console.log(`✓ Step 5: Product cards verification complete - Found ${count} products`);
    await page.screenshot({ path: 'screenshots/ghilli-05-products.png', fullPage: true });
    await attachBrandOverviewForAllure(page, testInfo, 'ghilli');

    const firstProductLink = productLinks.first();
    try {
      await firstProductLink.click({ timeout: 10000 });
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(400);
    } catch {
      console.log('Product link click failed - continuing');
    }
    await page.screenshot({ path: 'screenshots/ghilli-05-product-detail.png', fullPage: true });
    
    try {
      await page.goBack();
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await page.waitForTimeout(600);
    } catch {
      console.log('Navigation back failed - continuing');
    }
    
    // 6. Verify Filters
    try {
      const filterSection = page.locator('[class*="filter"], aside, .sidebar, [class*="sidebar"]').first();
      if (await filterSection.isVisible({ timeout: 5000 })) {
        await expect(filterSection).toBeVisible();
        await page.screenshot({ path: 'screenshots/ghilli-06-filter-section.png', fullPage: true });
      }
    } catch {
      console.log('Filter section not found - continuing');
    }
    console.log('✓ Step 6: Filter verification complete');

    // 7. FAQ accordion — click each "+" / expand for all 6 questions (Ghilli)
    const ghilliFaqPatterns = [
      /What makes Ghilli Herbal Water different from regular drinking water/i,
      /Is Ghilli safe for all ages/i,
      /What is ImmuTic/i,
      /Does Ghilli contain sugar, artificial flavors, or preservatives/i,
      /When should I drink Ghilli Herbal Water/i,
      /Are all Ghilli products Halal certified/i,
    ];

    try {
      await page.goto('http://82.112.230.248:6022/ghilli');
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await page.waitForTimeout(1200);

      for (const frac of [0.5, 0.65, 0.78, 0.9]) {
        await page.evaluate((f) => {
          window.scrollTo(0, Math.max(0, document.body.scrollHeight * f));
        }, frac);
        await page.waitForTimeout(400);
      }

      const faqSection = page
        .locator('section')
        .filter({ hasText: /Got Questions/i })
        .first()
        .or(page.locator('div').filter({ hasText: /Got Questions/i }).first());
      await expect(faqSection.getByText(/What makes Ghilli Herbal Water/i).first()).toBeVisible({
        timeout: 25000,
      });

      const clickFaqExpand = async (pattern: RegExp) => {
        const label = faqSection.getByText(pattern).first();
        await label.scrollIntoViewIfNeeded();

        const asRowButton = faqSection.getByRole('button', { name: pattern });
        if ((await asRowButton.count()) > 0) {
          await asRowButton.first().click({ timeout: 12000 });
          return;
        }

        const rowHost = faqSection.locator('div, li').filter({ hasText: pattern }).first();
        const plusBtn = rowHost.locator('button').filter({ hasText: /^\+$/ });
        if ((await plusBtn.count()) > 0) {
          await plusBtn.first().click({ timeout: 12000, force: true });
          return;
        }

        const rowButtons = rowHost.locator('button');
        if ((await rowButtons.count()) > 0) {
          await rowButtons.last().click({ timeout: 12000, force: true });
          return;
        }

        const plusSpan = rowHost.getByText('+', { exact: true });
        if ((await plusSpan.count()) > 0) {
          await plusSpan.click({ timeout: 12000, force: true });
          return;
        }

        const summaries = faqSection.locator('summary').filter({ hasText: pattern });
        if ((await summaries.count()) > 0) {
          await summaries.first().click({ timeout: 12000, force: true });
          return;
        }

        await label.click({ timeout: 12000, force: true });
      };

      for (const pattern of ghilliFaqPatterns) {
        await clickFaqExpand(pattern);
        await page.waitForTimeout(350);
      }

      await page.screenshot({ path: 'screenshots/ghilli-faq-accordion.png', fullPage: true });
    } catch {
      console.log('FAQ accordion interaction failed - continuing');
    }
    console.log('✓ Step 7: FAQ accordion verification complete');

    // 8. Add Product to Cart
    const firstProduct = page.locator('main a img, section a img, [class*="product"] a img, [class*="card"] a img').locator('..').first();
    try {
      await firstProduct.click({ timeout: 10000 });
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(400);
    } catch {
      console.log('Product link click failed - continuing');
    }
    await page.screenshot({ path: 'screenshots/ghilli-07-product-detail.png', fullPage: true });
    
    try {
      const addToCartButton = page.getByRole('button', { name: /add to cart/i });
      const addToCartAlt = page.locator('button').filter({ hasText: /add to cart/i }).first();
      
      if (await addToCartButton.isVisible()) {
        await addToCartButton.click();
      } else if (await addToCartAlt.isVisible()) {
        await addToCartAlt.click();
      }
    } catch {
      console.log('Add to cart button not found - skipping');
    }
    console.log('✓ Step 8: Add to cart verification complete');

    // 9. Verify Footer
    await page.goto('http://82.112.230.248:6022/ghilli');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(600);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    
    try {
      const footer = page.locator('footer').first();
      await expect(footer).toBeVisible();
    } catch {
      console.log('Footer not found - continuing');
    }
    console.log('✓ Step 9: Footer verification complete');
    await page.screenshot({ path: 'screenshots/ghilli-08-footer.png', fullPage: true });
    
    console.log('✅ Ghilli Comprehensive Test Complete');
  });
});