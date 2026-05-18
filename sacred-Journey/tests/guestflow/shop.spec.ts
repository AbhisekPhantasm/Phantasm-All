import { test, expect } from '@playwright/test';

test('Shop Page Interactions Guest Flow', async ({ page }) => {
    console.log('Test started: Shop Page Interactions Guest Flow');
    test.setTimeout(600000); // 10 minutes

    const BASE_URL = 'http://31.97.61.59:7004';

    console.log('Navigating to /shop...');
    await page.goto(`${BASE_URL}/shop`);
    await page.waitForTimeout(1000);

    // Age Verification
    const ageBtn = page.locator('button.age-modal-btn', { hasText: 'YES' });
    if (await ageBtn.isVisible()) {
        await ageBtn.click();
        console.log('Age verification dismissed.');
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/guest-shop-initial.png' });

    // Scroll down to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/guest-shop-scrolled-bottom.png' });

    // Navigate back to top for filters
    await page.evaluate(() => window.scrollTo(0, 0));

    // Filters
    const filters = ['Gummies', 'Chocolate Bar', 'Tablets', 'Carpe Diem', 'Euphoria'];
    for (const filter of filters) {
        const filterLabel = page.locator('label.category-checkbox-wrapper').filter({ hasText: filter });
        const checkbox = filterLabel.locator('input[type="checkbox"]');
        if (await filterLabel.isVisible()) {
            console.log(`Checking filter: ${filter}`);
            await checkbox.check({ force: true });
            await page.waitForTimeout(2000); // Wait for filter to apply
            await page.screenshot({ path: `screenshots/guest-filter-${filter.replace(/ /g, '_')}.png` });
            const card = page.locator('.product-card-custom').first();
            await card.scrollIntoViewIfNeeded().catch(() => {});
            await expect(card).toBeVisible({ timeout: 10000 });
            await checkbox.uncheck({ force: true });
            await page.waitForTimeout(1000);

        }
    }

    const searchInput = page.locator('input[placeholder="Search products..."]');
    if (await searchInput.isVisible()) {
        await searchInput.fill('Mushroom');
        await searchInput.press('Enter');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/guest-search-results.png' });
        await page.goto('/shop');
        await page.waitForTimeout(1000);
    }

    // Products (Total: 36 products - 3 pages)
    for (let p = 1; p <= 3; p++) {
        console.log(`Processing Page ${p}...`);
        await page.waitForSelector('.product-card-custom', { timeout: 10000 }).catch(() => { });

        const productLinks = page.locator('.product-card-custom a, .product-card-default a, [class*="product-card"] a');
        const count = await productLinks.count();
        const rawHrefs = [];
        for (let i = 0; i < count; i++) {
            const href = await productLinks.nth(i).getAttribute('href');
            if (href && (href.includes('/product/') || href.includes('?v='))) {
                const fullHref = href.startsWith('http') ? href : `${BASE_URL}${href}`;
                rawHrefs.push(fullHref);
            }
        }

        const hrefs = [...new Set(rawHrefs)].slice(0, 2); // Process first 2 products per page for stability

        for (let i = 0; i < hrefs.length; i++) {
            const targetUrl = hrefs[i];
            console.log(`[Page ${p}, Product ${i + 1}/${hrefs.length}] Navigating to: ${targetUrl}`);
            await page.goto(targetUrl, { timeout: 30000, waitUntil: 'domcontentloaded' }).catch(e => console.log(`Navigation failed: ${e.message}`));
            await page.waitForTimeout(2000);

            const productTitle = await page.locator('h2.title, .product__details-content .title, h1').first().innerText({ timeout: 5000 }).catch(() => 'Unknown');
            await page.evaluate(() => window.scrollTo(0, 600));
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
                        await page.screenshot({ path: `screenshots/guest-product-p${p}-i${i}-flavors.png` });
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
                const [popup] = await Promise.all([
                    page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
                    coa.click().catch(() => { })
                ]);
                if (popup) {
                    await popup.waitForLoadState().catch(() => { });
                    await popup.screenshot({ path: `screenshots/guest-product-p${p}-i${i}-coa.png` }).catch(() => { });
                    await popup.close().catch(() => { });
                }
            }

            // Catalog
            const catalog = page.locator('a:has-text("Catalog"), button:has-text("Catalog")').first();
            if (await catalog.isVisible()) {
                const [popup] = await Promise.all([
                    page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
                    catalog.click().catch(() => { })
                ]);
                if (popup) {
                    await popup.waitForLoadState().catch(() => { });
                    await popup.screenshot({ path: `screenshots/guest-product-p${p}-i${i}-catalog.png` }).catch(() => { });
                    await popup.close().catch(() => { });
                }
            }

            // Add To Cart
            const plus = page.locator('.qtybutton.inc, .quantity-plus, button:has-text("+"), span:has-text("+"), .inc, div:has(> span:text("+"))').first();
            if (await plus.isVisible().catch(() => false)) {
                await plus.scrollIntoViewIfNeeded().catch(() => { });
                await plus.click({ force: true }).catch(() => { });
                await page.waitForTimeout(500);
            }

            const addToCart = page.locator('.add-btn, button:has-text("Add To Cart"), span:has-text("Add To Cart"), .single_add_to_cart_button').first();
            if (await addToCart.isVisible().catch(() => false)) {
                await addToCart.scrollIntoViewIfNeeded().catch(() => { });
                await addToCart.click({ force: true }).catch(() => { });
                await page.waitForTimeout(1000);
                await page.screenshot({ path: `screenshots/guest-product-${encodeURIComponent(productTitle)}-added.png` });

                const closeSelectors = ['.CartDrawer_closeButton__DaDi9', '.cart-close', '.close-drawer', '.MuiIconButton-root'];
                for (const sel of closeSelectors) {
                    const closeBtn = page.locator(sel).first();
                    if (await closeBtn.isVisible().catch(() => false)) {
                        await closeBtn.click().catch(() => { });
                        await page.waitForTimeout(800);
                        break;
                    }
                }
            }

            console.log('Returning to shop...');
            await page.goto(`${BASE_URL}/shop`, { waitUntil: 'domcontentloaded' });

            if (p > 1) {
                const pageLink = page.locator('.pagination__wrap a, .pagination a').filter({ hasText: new RegExp(`^${p}$`) }).first();
                if (await pageLink.isVisible().catch(() => false)) {
                    await pageLink.click().catch(() => { });
                    await page.waitForTimeout(2000);
                }
            }
            await page.waitForSelector('.product-card-custom', { state: 'visible', timeout: 10000 }).catch(() => { });
        }

        // Pagination
        console.log(`Attempting pagination to page ${p + 1}...`);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(2000);

        const paginationContainer = page.locator('.pagination__wrap, .pagination, [class*="pagination"]').first();
        let nextClicked = false;

        if (await paginationContainer.isVisible().catch(() => false)) {
            const pageBtn = paginationContainer.locator('a').filter({ hasText: new RegExp(`^${p + 1}$`) }).first();
            const nextBtn = paginationContainer.locator('a').last();

            if (await pageBtn.isVisible().catch(() => false)) {
                await pageBtn.click({ timeout: 5000 }).catch(() => { });
                nextClicked = true;
            } else if (await nextBtn.isVisible().catch(() => false)) {
                await nextBtn.click({ timeout: 5000 }).catch(() => { });
                nextClicked = true;
            }
        }

        if (nextClicked) {
            await page.waitForTimeout(3000);
            await page.waitForSelector('.product-card-custom', { state: 'visible', timeout: 10000 }).catch(() => { });
        } else {
            break;
        }
    }
    await page.goto(`${BASE_URL}/`);
});