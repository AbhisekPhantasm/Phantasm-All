import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';

const BASE_URL = 'http://82.112.230.248:6022';

async function takeScreenshot(page: Page, name: string) {
  const dir = './screenshots';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
}

async function login(page: Page) {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`${BASE_URL}/auth/login`);
  
  const emailInp = page.locator('input[type="email"], input[name="email"], #email').first();
  await emailInp.fill('abhisek+1@phantasm.co.in');
  
  const passInp = page.locator('input[type="password"], input[name="password"]').first();
  await passInp.fill('12345678');
  
  await page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")').first().click();
  
  // Handle optional "Ok" popup
  const okButton = page.locator('button:has-text("Ok")').first();
  try {
    if (await okButton.isVisible({ timeout: 5000 })) {
      await okButton.click();
    }
  } catch (e) {
    // Ignore if not found
  }
  
  // Ensure we are on the home page or redirected
  await page.waitForTimeout(2000);
  if (page.url().includes('login')) {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  }
}

test.describe('AmiproSimpor - Shop Page Test Suite', () => {
    test.setTimeout(200000);
    test('Shop Page Flow', async ({ page }) => {
    await login(page);

    // 1. Navigate to Shop Page
    await page.goto(`${BASE_URL}/product`);
    await expect(page.getByRole('heading', { name: 'Categories' })).toBeVisible();
    await takeScreenshot(page, 'shop_page_loaded');

    // 1. Shop By Category - Apply multiple and clear
    const testCategories = ['Skin & Personal Care', 'Face Care', 'Hand & Hygiene Care', 'Body Care'];
    for (const cat of testCategories) {
        // Use visibility filter to avoid hidden mobile menu items
        await page.getByText(cat, { exact: true }).filter({ visible: true }).first().click({ force: true });
        await page.waitForTimeout(1000);
    }
    await takeScreenshot(page, 'shop_categories_applied');
    
    const clearBtn = page.getByText(/Clear All/i).filter({ visible: true }).first();
    if (await clearBtn.isVisible()) {
        await clearBtn.click({ force: true });
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'shop_categories_cleared');
    }

    // 2. Shop by Brand - Apply multiple and clear
    const brandHeading = page.getByRole('button', { name: /Shop by Brand/i }).filter({ visible: true }).first();
    if (await brandHeading.isVisible() && await brandHeading.getAttribute('aria-expanded') === 'false') {
        await brandHeading.click();
        await page.waitForTimeout(1000);
    }
    const testBrands = ["Ze'Venir", "Ghilli", "DatesUp", "Novexiz"];
    for (const brand of testBrands) {
        await page.getByText(brand, { exact: true }).filter({ visible: true }).first().click({ force: true });
        await page.waitForTimeout(1000);
    }
    await takeScreenshot(page, 'shop_brands_applied');
    
    if (await clearBtn.isVisible()) {
        await clearBtn.click({ force: true });
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'shop_brands_cleared');
    }

    // 3. Price Range - Min to Max Condition
    const minInput = page.locator('input[type="number"]').filter({ visible: true }).first();
    const maxInput = page.locator('input[type="number"]').filter({ visible: true }).last();
    if (await minInput.isVisible()) {
        await minInput.fill('20');
        await maxInput.fill('100');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(3000);
        await takeScreenshot(page, 'shop_price_min_max_applied');
    }

    // Also test radio price selection - using regex for better resilience
    const priceRadio = page.getByText(/\$25\.00 to \$100\.00/i).filter({ visible: true }).first();
    if (await priceRadio.isVisible()) {
        await priceRadio.click({ force: true });
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'shop_price_radio_applied');
    } else {
        // Fallback: try to find any price radio if the specific one is missing
        const anyPriceRadio = page.locator('input[type="radio"]').filter({ visible: true }).first();
        if (await anyPriceRadio.isVisible()) {
            await anyPriceRadio.click({ force: true });
            await page.waitForTimeout(2000);
        }
    }
    
    if (await clearBtn.isVisible()) {
        await clearBtn.click({ force: true });
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'shop_final_cleared');
    }

    // Sorting - making the locator more flexible
    const sortBtn = page.locator('button, [role="button"], .sort-dropdown, .dropdown-toggle').filter({ hasText: /Sort/i }).filter({ visible: true }).first();
    
    if (await sortBtn.isVisible()) {
        await sortBtn.click();
        await page.waitForTimeout(1000);
        
        // Select 'Price: Low to High'
        const lowToHigh = page.locator('text=Price: Low to High, .sort-item:has-text("Low to High")').filter({ visible: true }).first();
        if (await lowToHigh.isVisible()) {
            await lowToHigh.click();
            await page.waitForTimeout(2000);
            await takeScreenshot(page, 'shop_sort_low_to_high');
        }
    }

    // View Product - Using more robust locators and fallbacks
    const viewButton = page.locator('a, button').filter({ hasText: /View Product|View Details|Buy Now/i }).filter({ visible: true }).first();
    const productTitleLink = page.locator('h1 a, h2 a, h3 a, [class*="title"] a, [class*="product"] a').filter({ visible: true }).first();
    
    let targetLink = viewButton;
    if (!(await viewButton.isVisible())) {
        targetLink = productTitleLink;
    }

    if (await targetLink.isVisible()) {
        await targetLink.scrollIntoViewIfNeeded();
        // Use force: true to bypass interception by sticky headers
        await targetLink.click({ force: true });
        await page.waitForTimeout(2000);
        await takeScreenshot(page, 'shop_product_detail');
        await page.goto(`${BASE_URL}/product`);
    } else {
        console.log('No product links found to click');
    }

    // Pagination
    const page2 = page.getByRole('button', { name: '2', exact: true }).filter({ visible: true }).first();
    if (await page2.isVisible()) {
      await page2.click();
      await page.waitForTimeout(2000);
      await takeScreenshot(page, 'shop_pagination_page_2');
    }
  });
});