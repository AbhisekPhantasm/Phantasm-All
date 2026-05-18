import { test, expect } from '@playwright/test';

const BASE_URL = 'http://31.97.61.59:3010';

test('Guest - Complete Live Page Workflow', async ({ page }) => {
    test.setTimeout(1800000); // 30 minutes timeout

    // 1. Navigate to Live Page
    console.log('1. Navigating directly to Live page as Guest...');
    await page.goto(`${BASE_URL}/live`);
    await page.waitForLoadState('networkidle');

    // Check if redirected to login (restricted access)
    const currentURL = page.url();
    if (currentURL.includes('/login')) {
        console.log('✅ 1. Guest is correctly redirected to login (access restricted).');
        await test.info().attach('Live Page Redirect', {
            body: await page.screenshot({ fullPage: true }),
            contentType: 'image/png'
        });
        console.log('✅ Guest Live page access restriction validated.');
        return; // Stop test here as guest cannot proceed
    }


});