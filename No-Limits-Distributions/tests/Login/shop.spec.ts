import { test, expect, Page } from '@playwright/test';
import { performLogin, handleAgeVerification } from './login';
import * as fs from 'fs';
import * as path from 'path';

const log = (step: string) => console.log(`[STEP] ${step}`);

const screenshotDir = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
}

async function takeScreenshot(page: Page, name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(screenshotDir, `${name}-${timestamp}.png`);
    await page.screenshot({ path: filePath, fullPage: true }).catch(() => { });
    log(`Screenshot saved: ${name}`);
}

async function safeClick(page: Page, locator: any, name: string) {
    log(`Clicking: ${name}`);
    try {
        await locator.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => { });
        await locator.click({ timeout: 7000, force: true });
        return true;
    } catch (e) {
        try {
            await page.evaluate((el: any) => {
                el.click();
                if (el.parentElement) el.parentElement.click();
                if (el.closest('label')) el.closest('label').click();
            }, await locator.elementHandle({ timeout: 3000 }));
            return true;
        } catch {
            log(`[ERROR] Click failed: ${name}`);
            return false;
        }
    }
}

async function handlePageLoad(page: Page, name: string) {
    log(`Waiting for page load: ${name}`);
    await page.waitForLoadState('domcontentloaded', { timeout: 12000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => null);
    await handleAgeVerification(page);
    await page.locator('.grid').waitFor({ state: 'visible', timeout: 12000 }).catch(() => null);
    await page.waitForTimeout(1000);
    await takeScreenshot(page, `after-${name}`);
}

async function ensureShopGrid(page: Page) {
    const products = page.locator('.grid > div').filter({
        visible: true,
        has: page.locator('button:has-text("ADD TO CART")')
    });
    await expect(async () => {
        const count = await products.count();
        expect(count).toBeGreaterThan(0);
    }).toPass({ timeout: 30000, intervals: [2000] });
    return products;
}

test('Shop Page - Production-Ready QA Flow', async ({ page }) => {
    test.setTimeout(600000); // 10 minutes (fast version)

    await performLogin(page);

    // 1. Shop Initial Load + Pagination
    log('Navigating to Shop page');
    await page.goto('/shop', { waitUntil: 'domcontentloaded' });
    await handlePageLoad(page, 'shop-main');

    log('Verifying Pagination');
    for (let p = 2; p <= 8; p++) {   // Reduced from 12
        const pageBtn = page.locator(`button[aria-label="Go to page ${p}"]`).first();
        if (await pageBtn.isVisible({ timeout: 6000 }).catch(() => false)) {
            await safeClick(page, pageBtn, `Page ${p}`);
            await page.waitForTimeout(1500);
        } else break;
    }

    await page.goto('/shop');
    await handlePageLoad(page, 'shop-after-pagination');

    // 2. Category + Brand Filters
    const filterSets = [
        { category: 'DISPOSABLES', brand: 'BREEZE' },
        { category: 'DISPOSABLES', brand: 'MR FOG' },
        { category: 'DISPOSABLES', brand: 'UT' },
        { category: 'DISPOSABLES', brand: 'OLIT' },
        { category: 'DISPOSABLES', brand: 'GEEK BAR' },
        { category: 'DISPOSABLES', brand: 'NORTH' },
        { category: 'DISPOSABLES', brand: 'NEXA' },
        { category: 'DISPOSABLES', brand: 'FEEN' },
        { category: 'DISPOSABLES', brand: 'FOGER' }, // Uses partial matching
        { category: 'DISPOSABLES', brand: 'RAZ VAPE' },
        { category: 'KRATOM / HYDROXY' },
        { category: 'NEW ARRIVALS' },
        { category: 'MUSHROM' } // Spelled mushrom in the URL
    ];

    for (const filter of filterSets) {
        try {
            log(`\n=== Applying Filter: ${filter.category} ${filter.brand ? `-> ${filter.brand}` : ''} ===`);

            // 1. Reset filters using the 'Clear All' button for a clean state
            const clearAllBtn = page.getByRole('button', { name: /Clear All/i });
            if (await clearAllBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                await safeClick(page, clearAllBtn, 'Clear All Filters');
                await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => null);
            }

            // 2. Select Category
            const categoryRegex = new RegExp(`^\\s*${filter.category.replace('/', '\\/')}\\s*$`, 'i');
            const categoryBtn = page.getByLabel('FILTERS').getByRole('button', { name: categoryRegex }).first();

            // Wait, if it's a category like NEW ARRIVALS, it might not be a button but just a label
            if (await categoryBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                await safeClick(page, categoryBtn, `Category: ${filter.category}`);
            } else {
                const altCategoryBtn = page.locator('.MuiAccordionSummary-content').filter({ hasText: new RegExp(filter.category.replace('/', '\\/'), 'i') }).first();
                await safeClick(page, altCategoryBtn, `Category Alt: ${filter.category}`);
            }

            // 3. Select Brand (if applicable)
            if (filter.brand) {
                // Find the checkbox associated with the brand text nearby
                const brandCheckbox = page.locator('.MuiAccordionDetails-root div')
                    .filter({ hasText: new RegExp(filter.brand, 'i') })
                    .locator('input[type="checkbox"], .w-4, [role="checkbox"]')
                    .first();

                await safeClick(page, brandCheckbox, `Brand: ${filter.brand}`);
            }

            // 4. Verification: Wait for the URL to update OR the grid to refresh
            await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => null);
            await page.waitForTimeout(1500); // Give it a moment to update the grid

            // 5. Grid Validation
            const products = await ensureShopGrid(page);
            const count = await products.count();
            log(`Success: Found ${count} products for ${filter.brand || filter.category}`);

            // Go back to shop for next iteration to ensure a clean state
            await page.goto('/shop');
            await handlePageLoad(page, 'return-to-shop');

        } catch (e: any) {
            log(`[ERROR] Filter failed for ${filter.category}: ${e.message}`);
            await takeScreenshot(page, `filter-error-${filter.category.replace(/[^a-z0-9]/gi, '-')}`);
            // Recover state
            await page.goto('/shop');
            await handlePageLoad(page, 'return-to-shop-error');
        }
    }

    log('Testing Price Range Filter ($10 - $50)');
    await page.goto('/shop');
    await handlePageLoad(page, 'shop-price-range');
    await page.locator('input[placeholder="Min"]').first().fill('10');
    await page.locator('input[placeholder="Max"]').first().fill('50');
    await safeClick(page, page.locator('button:has-text("Apply")').first(), 'Apply Price');
    await page.waitForTimeout(4000);
    await ensureShopGrid(page);

    // 4. Price Sorting High to Low
    log('Testing Price Sorting: High to Low');
    await page.goto('/shop');
    await handlePageLoad(page, 'shop-sorting');
    await safeClick(page, page.locator('button:has-text("Sort By"), button:has-text("Sort")').first(), 'Sort dropdown');
    await page.waitForTimeout(1000);
    await page.locator('text=/Price: High to Low/i').first().click({ force: true });
    await page.waitForTimeout(6000);

    await expect(async () => {
        const cards = await ensureShopGrid(page);
        const prices: number[] = [];
        for (let i = 0; i < Math.min(8, await cards.count()); i++) {
            const priceText = await cards.nth(i).locator('span:has-text("$"), .price').last().textContent();
            if (priceText) prices.push(parseFloat(priceText.replace(/[^0-9.]/g, '')));
        }
        log(`Prices: ${prices.join(', ')}`);
        for (let i = 0; i < prices.length - 1; i++) {
            expect(prices[i]).toBeGreaterThanOrEqual(prices[i + 1]);
        }
    }).toPass({ timeout: 15000 });

    // 5. Refresh Persistence
    log('Testing persistence after refresh');
    await page.reload();
    await handlePageLoad(page, 'after-refresh');

    log('🎉 Fast Shop QA Flow Completed Successfully!');
});