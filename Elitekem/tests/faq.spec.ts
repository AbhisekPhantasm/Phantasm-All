import { test, expect } from '@playwright/test';

// TEST SCENARIO 3: FAQ Page – Expand/Collapse
test('FAQ Page – Expand/Collapse @smoke @regression', async ({ page }, testInfo) => {
    console.log('Step: Navigating to FAQ page');
    await page.goto('/faq/');
    await expect(page).toHaveURL(/.*faq/);

    // 1. After FAQ page load
    console.log('Step: Taking screenshot after FAQ page load');
    const faqLoadScreenshot = await page.screenshot();
    await testInfo.attach('faq-load.png', { body: faqLoadScreenshot, contentType: 'image/png' });
    console.log('Action: Attached screenshot faq-load.png');
    // 2. After expanding a question (answer visible)
    console.log('Step: Expanding an FAQ question');
    // Using 'summary' tag as found in investigation
    const faqQuestion = page.locator('summary').first();
    await expect(faqQuestion).toBeVisible();
    await faqQuestion.click();
    console.log('Action: Clicked on the first FAQ summary element');
    
    // Brief wait for the answer to expand
    await page.waitForTimeout(1000);
    
    const faqExpandedScreenshot = await page.screenshot();
    await testInfo.attach('faq-expanded.png', { body: faqExpandedScreenshot, contentType: 'image/png' });
    console.log('Action: Attached screenshot faq-expanded.png');
});