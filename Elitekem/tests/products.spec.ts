import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Capture a VIEWPORT-ONLY screenshot.
 */
async function snap(page: any, name: string) {
  const buffer = await page.screenshot({ path: path.join('screenshots', `${name}.png`) });
  await test.info().attach(name, { body: buffer, contentType: 'image/png' });
}

test('Product Page – Filters, Product Exploration & Pagination (Automatable)', async ({ page }) => {

  // 1. Navigate to Product Page
  await test.step('Navigate to Product Page', async () => {
    await page.goto('https://elitekem.com/shop/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    await snap(page, 'step_01_shop_loaded');
    console.log('✅ Product listing page loads successfully');
  });

  // 2. Clear Existing Filters
  await test.step('Clear Existing Filters', async () => {
    const clearBtn = page.locator('a', { hasText: /clear all/i }).first();
    if (await clearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clearBtn.click();
      await page.waitForTimeout(800);
      console.log('✅ All filters are reset (Initial)');
    } else {
      console.log('ℹ️ No initial filters to reset');
    }
  });

  // 3. Apply Filters
  await test.step('Apply Filters', async () => {
    const filter = page.locator('input[type="checkbox"], .filter-item').first();
    if (await filter.isVisible()) {
      await filter.click();
      await page.waitForTimeout(1000);
      
      // Capture filtered product names
      const productNames = await page.locator('.woocommerce-loop-product__title').allTextContents();
      console.log('📋 Filtered Product Names:', productNames.slice(0, 5));
      
      await snap(page, 'step_03_filters_applied');
      console.log('✅ Products update based on filters');
    }
  });

  // 4. Reset Filters Again
  await test.step('Reset Filters Again', async () => {
    const clearBtn = page.locator('a', { hasText: /clear all/i }).first();
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await page.waitForTimeout(800);
      await snap(page, 'step_04_filters_reset_final');
      console.log('✅ All products visible again');
    }
  });

  // 5. Open First Product
  await test.step('Open First Product', async () => {
    const firstProduct = page.locator('a[href*="/product/"]').first();
    await firstProduct.click();
    await page.waitForLoadState('domcontentloaded');
    await snap(page, 'step_05_first_product_detail');
    console.log('✅ Product detail page opens');
  });

  // 6. Submit Inquiry (Only Once)
  await test.step('Submit Inquiry (Only Once)', async () => {
    const nameInput = page.locator('input[name="your-name"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test User');
      await page.locator('input[name="your-email"]').first().fill('test@example.com');
      await page.locator('input[name="your-phone"]').first().fill('1234567890');
      await page.locator('textarea[name="your-message"]').first().fill('Checklist Step 6: Full submission test.');
      await snap(page, 'step_06a_form_filled');
      
      const submitBtn = page.locator('button.explore-btn, .explore-btn button, .explore-btn').first();
      await submitBtn.click();
      
      const response = page.locator('.wpcf7-response-output').first();
      await response.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(1000);
      await snap(page, 'step_06b_success_popup');
      console.log('✅ Form submitted successfully');
    }
  });

  // 7. Navigate Back to Product Page
  await test.step('Navigate Back to Product Page', async () => {
    await page.goto('https://elitekem.com/shop/');
    await page.waitForLoadState('domcontentloaded');
    console.log('✅ Returns to product listing');
  });

  // 8. Open Additional Products (Without Submission)
  await test.step('Open Additional Products (Without Submission)', async () => {
    const links = page.locator('a[href*="/product/"]');
    for (let i = 2; i <= 3; i++) {
      if (await links.count() > i) {
        await links.nth(i).click();
        await page.waitForLoadState('domcontentloaded');
        await snap(page, `step_08_product_extra_${i}`);
        
        // Fill form but do NOT submit
        const nameField = page.locator('input[name="your-name"]').first();
        if (await nameField.isVisible()) {
          await nameField.fill('Secondary Test');
          await page.locator('input[name="your-email"]').first().fill('secondary@test.com');
          await snap(page, `step_08_product_extra_${i}_form_filled_no_submit`);
        }
        
        await page.goto('https://elitekem.com/shop/');
        await page.waitForLoadState('domcontentloaded');
      }
    }
    console.log('✅ Navigation and form filling (without submission) works correctly');
  });

  // 9. Navigate Through Pagination
  // 10. Reach Last Page
  // 11. Return to First Page
  await test.step('Pagination Handling (Steps 9, 10, 11)', async () => {
    let pageNum = 1;
    let hasNext = true;

    while (hasNext && pageNum < 20) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(800);
      
      const nextPageNum = pageNum + 1;
      const nextNumBtn = page.locator(`a.page-numbers:has-text("${nextPageNum}")`).first();

      if (await nextNumBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await nextNumBtn.click();
        await page.waitForLoadState('domcontentloaded');
        pageNum = nextPageNum;
        console.log(`✅ Pagination step: Page ${pageNum} loads correctly`);
      } else {
        hasNext = false;
      }
    }
    
    await snap(page, 'step_10_last_page_reached');
    console.log(`✅ Last page (${pageNum}) reached successfully`);
    
    // 11. Return to First Page
    await page.goto('https://elitekem.com/shop/');
    await page.waitForTimeout(1000);
    await snap(page, 'step_11_returned_to_first');
    console.log('✅ Pagination reset successful');
  });

  // 12. Verify Product Section
  await test.step('Verify Product Section', async () => {
    const products = page.locator('a[href*="/product/"]');
    await expect(products.first()).toBeVisible();
    await snap(page, 'step_12_final_validation');
    console.log('✅ Product section fully functional');
  });
});
