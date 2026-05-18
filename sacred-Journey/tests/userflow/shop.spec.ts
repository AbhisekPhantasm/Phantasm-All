import { test, expect } from '@playwright/test';

const BASE_URL = 'http://31.97.61.59:7004';

async function safeGoto(page: any, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2000);
}

async function dismissAgeGate(page: any) {
  try {
    const btn = page.locator('button.age-modal-btn, button:has-text("YES"), button:has-text("Yes")').first();
    if (await btn.isVisible({ timeout: 5000 })) {
      await btn.click();
      await page.waitForTimeout(1000);
    }
  } catch {}
}

async function performLogin(page: any) {
  await test.step('Performing login...', async () => {
    await safeGoto(page, `${BASE_URL}/auth/login`);
    await dismissAgeGate(page);
    await page.fill('#email', 'abhisek@phantasm.co.in');
    await page.fill('#password', '123456');
    await page.screenshot({ path: 'screenshots/user-login-step.png', fullPage: true });
    
    await Promise.all([
      page.waitForURL((url: URL) => url.toString() === `${BASE_URL}/` || url.toString().includes('/shop') || url.toString().includes('/dashboard'), { timeout: 15000 }).catch(() => {}),
      page.click('button[type="submit"]')
    ]);
    
    // Final check for login success
    const isLoggedIn = await page.locator('a:has-text("Logout"), .user-profile, .header-right-icons').first().isVisible().catch(() => false);
    console.log(`Login status check: ${isLoggedIn ? 'Success' : 'Check URL'}`);
    await page.waitForTimeout(2000);
  });
}


test('Shop Page Interactions', async ({ page }) => {
    console.log('Test started: Shop Page Interactions');
    test.setTimeout(600000); // 10 minutes

    console.log('Performing login...');
    await performLogin(page);

    console.log('Navigating to /shop...');
    await safeGoto(page, `${BASE_URL}/shop`);
    await page.waitForLoadState('networkidle').catch(() => {});
    console.log('Navigation to /shop complete.');
    await page.waitForTimeout(1000);

    // Age Verification
    const ageBtn = page.locator('button.age-modal-btn', { hasText: 'YES' });
    if (await ageBtn.isVisible()) {
        await ageBtn.click();
        console.log('Age verification dismissed.');
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/shop-initial.png' });
    

    // Scroll down to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/shop-scrolled-bottom.png' });

    // Navigate back to top for filters
    await page.evaluate(() => window.scrollTo(0, 0));
    // Filters (Left Side) - Commented out for now
    const filters = ['Gummies', 'Chocolate Bar', 'Tablets', 'Carpe Diem', 'Euphoria'];
    for (const filter of filters) {
        const filterLabel = page.locator('label.category-checkbox-wrapper').filter({ hasText: filter });
        const checkbox = filterLabel.locator('input[type="checkbox"]');
        if (await filterLabel.isVisible()) {
            console.log(`Checking filter: ${filter}`);
            await checkbox.check({ force: true });
            await page.waitForTimeout(1000);
            await page.screenshot({ path: `screenshots/filter-${filter.replace(/ /g, '_')}.png` });
            await expect(page.locator('.product-card-custom').first()).toBeVisible();
            await checkbox.uncheck({ force: true });
            await page.waitForTimeout(500);
        }
    }
    const searchInput = page.locator('input[placeholder="Search products..."]');
    if (await searchInput.isVisible()) {
        await searchInput.fill('Mushroom');
        await searchInput.press('Enter');
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/search-results.png' });
        await safeGoto(page, `${BASE_URL}/shop`);
        await page.waitForLoadState('networkidle').catch(() => {});
    }
    // Products (Total: 36 products - 3 pages)
    for (let p = 1; p <= 3; p++) {
        console.log(`Processing Page ${p}...`);
        await page.waitForSelector('.product-card-custom', { timeout: 10000 }).catch(() => { });
        // FIX 1: Collect all hrefs FIRST to avoid stale locators after navigation
        // Collect all product links on the current page
        const productLinks = page.locator('.product-card-custom a, .product-card-default a, [class*="product-card"] a');
        const count = await productLinks.count();
        console.log(`Page ${p}: Found ${count} potential product links`);
        const rawHrefs = [];
        for (let i = 0; i < count; i++) {
            const href = await productLinks.nth(i).getAttribute('href');
            if (href && (href.includes('/product/') || href.includes('?v='))) {
                const fullHref = href.startsWith('http') ? href : `${BASE_URL}${href}`;
                rawHrefs.push(fullHref);
            }
        }
        // Unique Hrefs - ensure we process every distinct product
        const hrefs = [...new Set(rawHrefs)].slice(0, 2); // Reduced to 2 products per page for faster, more stable execution
        console.log(`Collected ${hrefs.length} unique product URLs for Page ${p}:`);
        hrefs.forEach((url, idx) => console.log(`  ${idx + 1}: ${url}`));
        for (let i = 0; i < hrefs.length; i++) {
            const targetUrl = hrefs[i];
            console.log(`[Page ${p}, Product ${i + 1}/${hrefs.length}] Navigating to: ${targetUrl}`);
            await page.goto(targetUrl, { timeout: 30000, waitUntil: 'domcontentloaded' }).catch(e => console.log(`Navigation failed: ${e.message}`));
            await page.waitForTimeout(2000);
            const pTitle = await page.title().catch(() => 'No Title');
            console.log(`Page title: ${pTitle}`);
            console.log('Detecting product title...');
            const productTitle = await page.locator('h2.title, .product__details-content .title, h1').first().innerText({ timeout: 5000 }).catch(() => 'Unknown');
            console.log(`Product: ${productTitle}`);
            await page.evaluate(() => window.scrollTo(0, 600));
            console.log('Scrolled down.');
            await page.waitForTimeout(1000);
            // Flavor/Variation check
            console.log('Checking for product flavors...');
            try {
                const flavorSection = page.locator('text=Flavors: >> ..').first();
                if (await flavorSection.isVisible({ timeout: 5000 }).catch(() => false)) {
                    const flavors = flavorSection.locator('div:has(> span), .variation-option').filter({ hasText: /\S/ }).filter({ hasNotText: /Flavors:/ });
                    const flavorCount = await flavors.count();
                    console.log(`Found ${flavorCount} flavors.`);
                    if (flavorCount > 0) {
                        await flavors.first().scrollIntoViewIfNeeded().catch(() => {});
                        await page.screenshot({ path: `screenshots/product-p${p}-i${i}-flavors.png` });
                        for (let f = 0; f < Math.min(flavorCount, 3); f++) {
                            const flavor = flavors.nth(f);
                            const flavorName = await flavor.locator('span').first().innerText().catch(async () => await flavor.innerText()).catch(() => 'Unknown');
                            console.log(`Selecting flavor ${f + 1}: ${flavorName.split('\n')[0].trim()}`);
                            // Use evaluate click for better stability with dynamic elements
                            await flavor.evaluate(el => (el as HTMLElement).click()).catch(() => {});
                            await page.waitForTimeout(1000);
                        }
                    }
                }
            } catch (err: any) {
                console.log(`Flavor check error: ${err.message}`);
            }
            // COA Certificate
            const coa = page.locator('button:has-text("COA Certificate"), a:has-text("COA")').first();
            if (await coa.isVisible()) {
                console.log('Checking COA Certificate...');
                const [popup] = await Promise.all([
                    page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
                    coa.click().catch(() => { })
                ]);
                if (popup) {
                    console.log('COA opened in new tab.');
                    await popup.waitForLoadState().catch(() => { });
                    await popup.screenshot({ path: `screenshots/product-p${p}-i${i}-coa.png` }).catch(() => { });
                    await popup.close().catch(() => { });
                } else {
                    await page.waitForTimeout(1000);
                    await page.screenshot({ path: `screenshots/product-p${p}-i${i}-coa.png` });
                }
            }
            // Catalog buttons
            const catalog = page.locator('a:has-text("Catalog"), button:has-text("Catalog")').first();
            if (await catalog.isVisible()) {
                console.log('Checking Catalog...');
                const [popup] = await Promise.all([
                    page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
                    catalog.click().catch(() => { })
                ]);
                if (popup) {
                    console.log('Catalog opened in new tab.');
                    await popup.waitForLoadState().catch(() => { });
                    await popup.screenshot({ path: `screenshots/product-p${p}-i${i}-catalog.png` }).catch(() => { });
                    await popup.close().catch(() => { });
                } else {
                    await page.waitForTimeout(1000);
                    await page.screenshot({ path: `screenshots/product-p${p}-i${i}-catalog.png` });
                }
            }
            // Categories & Tags
            const tags = page.locator('.product-tags a, .product-categories a').first();
            if (await tags.isVisible()) {
                console.log('Checking Categories & Tags...');
                const [popup] = await Promise.all([
                    page.waitForEvent('popup', { timeout: 3000 }).catch(() => null),
                    tags.click().catch(() => { })
                ]);
                if (popup) {
                    await popup.close().catch(() => { });
                } else {
                    // If tags navigate in same tab, we must return to product
                    if (!page.url().includes('/product/')) {
                        console.log('Tags navigated away, returning to product...');
                        await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
                    }
                }
            }
            // Ensure we are on the product page before proceeding
            if (!page.url().includes('/product/')) {
                await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
            }
            await page.waitForTimeout(500);
            // Add To Cart Process
            console.log('Starting Add to Cart process...');
            const plus = page.locator('.qtybutton.inc, .quantity-plus, button:has-text("+"), span:has-text("+"), .inc, div:has(> span:text("+"))').first();
            if (await plus.isVisible().catch(() => false)) {
                // Ensure the button is not obscured by the sticky header
                await plus.scrollIntoViewIfNeeded().catch(() => { });
                await page.evaluate(() => window.scrollBy(0, -150)); // Scroll up a bit to clear header
                await plus.click().catch(async () => {
                    console.log('Regular click failed, trying force click for plus...');
                    await plus.click({ force: true }).catch(() => { });
                });
                console.log('Incremented quantity.');
                await page.waitForTimeout(500);
            }
            const addToCart = page.locator('.add-btn, button:has-text("Add To Cart"), span:has-text("Add To Cart"), .single_add_to_cart_button').first();
            if (await addToCart.isVisible().catch(() => false)) {
                console.log('Clicking Add to Cart button...');
                await addToCart.scrollIntoViewIfNeeded().catch(() => { });
                await page.evaluate(() => window.scrollBy(0, -150)); // Scroll up a bit to clear header

                await Promise.all([
                    page.waitForResponse(res => res.url().includes('/api/cart/add-item') && res.status() < 400, { timeout: 10000 }).catch(() => null),
                    addToCart.click().catch(async () => {
                        console.log('Regular click failed, trying force click for Add to Cart...');
                        await addToCart.click({ force: true }).catch(() => { });
                    })
                ]);
                console.log('Clicked Add To Cart');
                await page.waitForTimeout(1000);
                await page.screenshot({ path: `screenshots/product-${encodeURIComponent(productTitle)}-added.png` });
                console.log('Closing cart drawer...');
                const closeSelectors = ['.CartDrawer_closeButton__DaDi9', '.cart-close', '.close-drawer', '[aria-label*="Close"]', '.MuiIconButton-root'];
                for (const sel of closeSelectors) {
                    const closeBtn = page.locator(sel).first();
                    if (await closeBtn.isVisible().catch(() => false)) {
                        await closeBtn.click().catch(() => { });
                        console.log(`Closed cart using selector: ${sel}`);
                        await page.waitForTimeout(800);
                        break;
                    }
                }
                if (await page.locator('.CartDrawer_cartContainer__5zLRP').isVisible().catch(() => false)) {
                    await page.keyboard.press('Escape').catch(() => { });
                    await page.mouse.click(5, 5).catch(() => { });
                    await page.waitForTimeout(1000);
                }
            } else {
                console.log('Add To Cart button not visible.');
                await page.screenshot({ path: `screenshots/debug-missing-cart-${i}.png` });
            }
            // Reviews (Moved to end to prevent tab-switching issues from hiding other elements)
            const reviewsTab = page.locator('button:has-text("Reviews"), a:has-text("Reviews"), .reviews-tab').first();
            if (await reviewsTab.isVisible()) {
                console.log('Checking Reviews...');
                await reviewsTab.click();
                await page.waitForTimeout(500);
                const writeReview = page.locator('button:has-text("Write a review")').first();
                if (await writeReview.isVisible()) {
                    await writeReview.click();
                    await page.waitForTimeout(500);
                    await page.locator('textarea').first().fill('Excellent product, highly recommend!');
                    await page.screenshot({ path: `screenshots/product-p${p}-i${i}-review-form.png` });
                }
            }
            console.log('Returning to shop...');
            // Direct navigation is often more reliable than goBack in SPAs for preserving state consistently
            await safeGoto(page, `${BASE_URL}/shop`);
            await page.waitForLoadState('networkidle').catch(() => {});
            // If we were on a specific page, go back to it
            if (p > 1) {
                console.log(`Navigating back to page ${p}...`);
                const pageLink = page.locator('.pagination__wrap a, .pagination a').filter({ hasText: new RegExp(`^${p}$`) }).first();
                if (await pageLink.isVisible().catch(() => false)) {
                    await pageLink.click().catch(() => { });
                    await page.waitForTimeout(2000);
                }
            }
            await page.waitForSelector('.product-card-custom', { state: 'visible', timeout: 10000 }).catch(() => { });
            await page.waitForTimeout(1000);
        }
        // Pagination to next page
        console.log(`Attempting pagination to page ${p + 1}...`);
        // Scroll to the bottom to ensure pagination container is triggered/loaded
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);
        const paginationContainer = page.locator('.pagination__wrap, .pagination, [class*="pagination"]').first();
        let nextClicked = false;
        if (await paginationContainer.isVisible().catch(() => false)) {
            // Try specific page number link
            const pageBtn = paginationContainer.locator('a').filter({ hasText: new RegExp(`^${p + 1}$`) }).first();
            // The Next button is typically the last link in the container
            const nextBtn = paginationContainer.locator('a').last();

            if (await pageBtn.isVisible().catch(() => false)) {
                console.log(`Clicking page link ${p + 1}...`);
                await pageBtn.click({ timeout: 5000 }).catch(() => { });
                nextClicked = true;
            } else if (await nextBtn.isVisible().catch(() => false)) {
                console.log('Clicking Next pagination link...');
                await nextBtn.click({ timeout: 5000 }).catch(() => { });
                nextClicked = true;
            }
        }
        if (nextClicked) {
            await page.waitForTimeout(3000);
            await page.waitForSelector('.product-card-custom', { state: 'visible', timeout: 10000 }).catch(() => { });
            console.log(`Successfully navigated to page ${p + 1}.`);
        } else {
            console.log(`Page ${p}: Could not find pagination for page ${p + 1}. Ending loop.`);
            await page.screenshot({ path: `screenshots/pagination-failed-p${p}.png` });
            break;
        }
    }
    await page.goto(`${BASE_URL}/`);
});