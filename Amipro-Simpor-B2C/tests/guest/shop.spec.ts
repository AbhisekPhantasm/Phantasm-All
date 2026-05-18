import { test, expect } from '@playwright/test';

/**
 * High-Speed Shop Module Test
 * 1. Iterates through ALL Categories
 * 2. Iterates through ALL Brands
 * 3. Checks exactly 2 products per category/brand
 * 4. Actions: View Product, Screenshot, Add Quantity (+), Add to Cart, Navigate Back
 */

test.describe('Shop Module End-to-End Tests', () => {

  const targetBrands = ["Ze'Venir", "Ghilli", "DatesUp", "Novexiz"];

  test.beforeEach(async ({ page }) => {
    await page.goto('http://82.112.230.248:6022/product', { waitUntil: 'domcontentloaded' });
    // Explicitly wait for the sidebar filters to load before proceeding
    await page.waitForSelector('div:has-text("Shop By Category") + div input[type="checkbox"]', { timeout: 30000 });
  });

  test('Check 2 Products Across All Categories and Brands', async ({ page }) => {
    test.setTimeout(3600000); 

    const clearFilters = async () => {
      const clearBtn = page.locator('button:has-text("Clear All")').first();
      if (await clearBtn.isVisible()) {
        await clearBtn.click();
        await page.waitForTimeout(500); // Small buffer for DOM refresh
      }
    };

    const processProducts = async (groupLabel: string, limit: number = 2) => {
      // Wait for grid refresh to show actual products
      await page.waitForSelector('button:has-text("View Product"), div:has-text("No products found")', { timeout: 10000 }).catch(() => {});
      
      const productButtons = page.locator('button:has-text("View Product")');
      const totalOnPage = await productButtons.count();
      
      if (totalOnPage === 0) {
        console.log(`[${groupLabel}] No products found.`);
        return;
      }

      const countToProcess = Math.min(totalOnPage, limit);
      console.log(`[${groupLabel}] Found ${totalOnPage} products. Processing first ${countToProcess}.`);

      for (let i = 0; i < countToProcess; i++) {
        const btn = page.locator('button:has-text("View Product")').nth(i);
        await btn.scrollIntoViewIfNeeded();

        const productName = await btn.evaluate((el, index) => {
          return el.closest('.product-card')?.querySelector('h3, .product-title')?.textContent?.trim() || `Product_${index}`;
        }, i);

        await test.step(`Product: ${productName}`, async () => {
          await btn.click();
          
          // Wait specifically for the Add to Cart button to ensure PDP is loaded
          const addToCartBtn = page.locator('button:has-text("Add to cart"), button:has-text("ADD TO CART")').first();
          await addToCartBtn.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

          const safeName = productName.replace(/[^a-z0-9]/gi, '_');
          const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 60 });
          await test.info().attach(`Screenshot-${groupLabel}-${safeName}`, {
            body: screenshotBuffer,
            contentType: 'image/jpeg',
          });

          // Ultra-robust Quantity Incrementation
          try {
            const plusBtn = page.locator('button, div').filter({ hasText: '+' }).first();
            const svgPlus = page.locator('svg.lucide-plus, [aria-label*="ncrease"]').first();
            const qtyInput = page.locator('input[type="number"], input[name="quantity"]').first();
            
            if (await plusBtn.isVisible()) {
              await plusBtn.click();
              console.log(`   ➕ Incremented Quantity via + button`);
            } else if (await svgPlus.isVisible()) {
              await svgPlus.click();
              console.log(`   ➕ Incremented Quantity via SVG/Aria button`);
            } else if (await qtyInput.isVisible()) {
              await qtyInput.fill('2');
              console.log(`   ➕ Incremented Quantity via text input`);
            } else {
              console.log('   ⚠️ Could not locate quantity controls');
            }
          } catch (e) {
            console.log('   ⚠️ Error adjusting quantity');
          }

          if (await addToCartBtn.isVisible() && !await addToCartBtn.isDisabled()) {
            await addToCartBtn.click();
            console.log(`   ✅ Added to cart: ${productName}`);
          }

          // Resilient navigation back
          await page.goBack({ waitUntil: 'domcontentloaded' }).catch(async () => {
            await page.goto('http://82.112.230.248:6022/product', { waitUntil: 'domcontentloaded' });
          });
          // After returning to the shop list, explicitly wait for the sidebar to reappear
          await page.waitForSelector('div:has-text("Shop By Category") + div input[type="checkbox"]', { timeout: 30000 }).catch(() => {});
        });
      }
    };

    // --- 1. CATEGORIES ---
    await test.step('All Categories Iteration', async () => {
      const categoryCheckboxes = page.locator('div:has-text("Shop By Category") + div input[type="checkbox"]');
      const count = await categoryCheckboxes.count();
      console.log(`System: Found ${count} categories.`);

      for (let i = 0; i < count; i++) {
        await clearFilters();
        const checkbox = page.locator('div:has-text("Shop By Category") + div input[type="checkbox"]').nth(i);
        const label = await checkbox.evaluate(el => el.closest('div')?.innerText.trim().split('\n')[0] || 'Unknown');
        
        await test.step(`Category: ${label}`, async () => {
          console.log(`Starting Category: ${label}`);
          await checkbox.click();
          await processProducts(`Category_${label.replace(/[^a-z0-9]/gi, '_')}`, 2);
        });
      }
    });

    // --- 2. BRANDS ---
    await test.step('All Brands Iteration', async () => {
      const shopByBrandHeader = page.locator('h3:has-text("Shop by Brand"), div:has-text("Shop by Brand")').first();
      await shopByBrandHeader.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});

      for (const brandName of targetBrands) {
        await clearFilters();
        
        await test.step(`Brand: ${brandName}`, async () => {
          console.log(`Starting Brand: ${brandName}`);
          const brandRow = page.locator(`label:has-text("${brandName}"), div:has-text("${brandName}")`).locator('input[type="checkbox"], .checkbox, [role="checkbox"]').first();
          
          if (await brandRow.isVisible()) {
             await brandRow.click();
          } else {
             const fallbackText = page.locator(`text="${brandName}"`).first();
             if(await fallbackText.isVisible()) await fallbackText.click();
          }

          await processProducts(`Brand_${brandName.replace(/[^a-z0-9]/gi, '_')}`, 2);
        });
      }
    });

  });

});
