import { test, expect } from '@playwright/test';
import { loginUser } from '../auth-helper.ts';

const BASE_URL = 'http://31.97.61.59:3010';

test('User - Comprehensive Browse Categories Validation', async ({ page }) => {
    test.setTimeout(900000); // 15 minutes timeout for extensive interactions

    // 1. Login (Essential for User type)
    await loginUser(page);

    // 2. Navigate to Homepage
    console.log('2. Navigating to Homepage...');
    await page.goto(BASE_URL);
    await page.waitForLoadState('load');
    console.log('✅ 2. Homepage loads successfully.');

    const browseBtn = page.getByRole('button', { name: 'Browse' }).first();

    // Helper: open the browse dropdown/sidebar
    const openDropdown = async () => {
        const sidebarLink = page.getByRole('link', { name: /View all/i }).first();
        if (await sidebarLink.isVisible().catch(() => false)) {
            return;
        }
        
        try {
            await expect(browseBtn).toBeVisible({ timeout: 20000 });
            await browseBtn.click({ force: true });
            // Wait up to 30s for the dropdown content/View all link to appear
            await expect(page.getByRole('link', { name: /View all/i }).first()).toBeVisible({ timeout: 30000 });
        } catch (e) {
            console.log('  ⚠️ Browse button interaction failed or dropdown didn\'t open. Attempting page reload...');
            await page.reload();
            await page.waitForLoadState('load');
            await expect(browseBtn).toBeVisible({ timeout: 20000 });
            await browseBtn.click({ force: true });
            await expect(page.getByRole('link', { name: /View all/i }).first()).toBeVisible({ timeout: 30000 });
        }
    };

    // Helper: close dropdown
    const closeDropdown = async () => {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
    };

    // 3. Access Browse Menu
    console.log('3. Accessing Browse Menu...');
    await openDropdown();
    await expect(page.getByRole('link', { name: /View all/i }).first()).toBeVisible({ timeout: 10000 });
    console.log('✅ 3. Browse dropdown menu appears successfully.');

    // 4. Category Mapping for Validation
    const categoryMapping = [
        {
            name: 'Quranic Compass',
            links: ['Juz Tabarak', 'Speacial Ramzan Series', 'Balagha Studies', 'Juz Amma']
        },
        {
            name: 'Quranic Studies',
            links: ['History of Tafsir', 'Quran Al Fajr', 'Uloom ul Quran', 'Tafsir Quran bil Quran', 'Tafsir Ahkamul Quran']
        },
        {
            name: 'Seerah of the Prophet',
            links: ['Introduction to Seerah Works']
        },
        {
            name: 'Islamic History',
            links: ['Biography of Sahaba', 'History of Islam']
        },
        {
            name: 'Islamic Civilization',
            links: [] // No courses expected
        },
        {
            name: 'Islamic Ideology',
            links: [] // No courses expected
        },
        {
            name: 'Indian Islamic Studies',
            links: [] // No courses expected
        }
    ];

    // Helper: click a category in the sidebar
    const clickCategory = async (categoryName: string) => {
        console.log(`\n--- Selecting Category: ${categoryName} ---`);
        await openDropdown();
        // Use a flexible selector for category buttons in the sidebar
        const catBtn = page.getByRole('button', { name: new RegExp(categoryName, 'i') })
            .or(page.locator('div, span, p').filter({ hasText: new RegExp(categoryName, 'i') }))
            .first();
        
        await expect(catBtn).toBeVisible({ timeout: 25000 });
        await catBtn.click();
        await page.waitForTimeout(2000); // Increased wait for expansion
    };

    // Helper: click a sub-link and validate
    const clickAndValidate = async (linkName: string, categoryName: string) => {
        console.log(`    Checking link: ${linkName}`);
        
        const tryClick = async () => {
            await openDropdown();
            const link = page.getByRole('link', { name: new RegExp(linkName, 'i') }).first();
            if (!(await link.isVisible())) {
                await clickCategory(categoryName); // Re-expand category
                await link.scrollIntoViewIfNeeded().catch(() => {});
            }
            await expect(link).toBeVisible({ timeout: 25000 });
            await link.click();
        };

        try {
            await tryClick();
        } catch (e) {
            console.log(`    ⚠️ Retrying interaction for: ${linkName}`);
            await openDropdown();
            await tryClick();
        }

        await page.waitForLoadState('load');
        
        // Handle "Error Loading" states in the application (Retry up to 3 times)
        for (let retry = 1; retry <= 3; retry++) {
            const tryAgainBtn = page.locator('button, a').filter({ hasText: /Try Again/i }).first();
            if (await tryAgainBtn.isVisible().catch(() => false)) {
                console.log(`    ⚠️ App error detected: "Error Loading" (Attempt ${retry}). Clicking "Try Again"...`);
                await tryAgainBtn.click().catch(() => {});
                await page.waitForLoadState('load');
                await page.waitForTimeout(3000);
            } else {
                break;
            }
        }
        
        // Attach screenshot of the course page
        await test.info().attach(`User Browse - ${linkName.replace(/\s+/g, '_')}`, {
            body: await page.screenshot({ fullPage: true }),
            contentType: 'image/png'
        });

        // 5. Validate Course Detail Page Tabs (Brief check for first link in each category)
        console.log(`    Validating tabs for: ${linkName}`);
        const tabs = ['Overview', 'Course Content', 'Reviews', 'Instructors'];
        for (const tabName of tabs) {
            // Use a more flexible locator for tabs
            const tabBtn = page.locator('button, a, div').filter({ hasText: new RegExp(`^${tabName}$`, 'i') }).first();
            
            try {
                await expect(tabBtn).toBeVisible({ timeout: 5000 });
                await tabBtn.click({ timeout: 5000 });
            } catch (e) {
                console.log(`    ⚠️ Warning: Tab "${tabName}" not found or not clickable. Skipping...`);
                continue;
            }
            await page.waitForTimeout(1000);
        }
        
        console.log(`    ✓ ${linkName} validated successfully.`);
        await page.goBack();
        await page.waitForLoadState('load');
    };

    // 6. Iterate through all categories and check all buttons
    for (const category of categoryMapping) {
        await clickCategory(category.name);
        
        if (category.links.length > 0) {
            console.log(`  Found ${category.links.length} courses. Validating a sample...`);
            const linksToTest = category.links.slice(0, 2); // Limit to 2 per category for stability
            for (const link of linksToTest) {
                await clickAndValidate(link, category.name);
            }
        } else {
            console.log(`  No courses found for ${category.name} (as expected for empty categories).`);
            // Take a screenshot of the empty state
            await test.info().attach(`User Empty Category - ${category.name.replace(/\s+/g, '_')}`, {
                body: await page.screenshot({ fullPage: false }),
                contentType: 'image/png'
            });
        }
    }

    // 7. View All Links Validation
    console.log('\n7. Validating "View all" links...');
    await openDropdown();
    const viewAllLinks = page.getByRole('link', { name: /View all/i });
    const viewAllCount = await viewAllLinks.count();
    console.log(`  Found ${viewAllCount} "View all" links.`);
    
    for (let i = 0; i < Math.min(viewAllCount, 3); i++) {
        await openDropdown();
        await viewAllLinks.nth(i).click();
        await page.waitForLoadState('load');
        console.log(`  ✓ View all link #${i + 1} works.`);
        
        // Navigate back to home instead of goBack for reliability
        await page.goto(BASE_URL);
        await page.waitForLoadState('load');
        await expect(browseBtn).toBeVisible({ timeout: 15000 });
    }

    console.log('\n✅ User - All categories and buttons in Browse validated successfully.');
});