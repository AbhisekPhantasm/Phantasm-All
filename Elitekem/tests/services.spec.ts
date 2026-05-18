import { test, expect } from '@playwright/test';
// TEST SCENARIO 2: Services Section – All Services Navigation
test('Services Section – All Services Navigation @smoke @regression', async ({ page }, testInfo) => {
    console.log('Step: Navigating to Services page');
    await page.goto('/services/');
    await expect(page).toHaveURL(/.*services/);
    // API Intermediate Synthesis Flow
    console.log('Step: Hovering over Services menu in header');
    const servicesMenu = page.getByRole('link', { name: 'Services', exact: true }).first();
    await servicesMenu.hover();
    await page.waitForTimeout(500);
    console.log('Step: Clicking API Intermediate Synthesis from dropdown');
    const apiSynthesisLink = page.getByRole('link', { name: 'API Intermediate Synthesis', exact: true }).first();
    await expect(apiSynthesisLink).toBeVisible({ timeout: 10000 });
    await apiSynthesisLink.click();
    console.log('Action: Clicked API Intermediate Synthesis');
    await expect(page).toHaveURL(/.*api-intermediate-synthesis/);
    const apiScreenshot = await page.screenshot();
    await testInfo.attach('services-api-synthesis.png', { body: apiScreenshot, contentType: 'image/png' });
    console.log('Action: Attached screenshot services-api-synthesis.png');
    // Talk to Our Scientist Flow (Note: Plural 'Scientists' on the page)
    console.log('Step: Clicking Talk to Our Scientists');
    const scientistLink = page.getByRole('link', { name: /Talk to Our Scientists/i }).first();
    await expect(scientistLink).toBeVisible();
    await scientistLink.click();
    console.log('Action: Clicked Talk to Our Scientists');
    // Navigate to Contact/About page (as per requirement)
    await expect(page).toHaveURL(/.*(contact|about)/);
    const talkToScientistScreenshot = await page.screenshot();
    await testInfo.attach('talk-to-scientist.png', { body: talkToScientistScreenshot, contentType: 'image/png' });
    console.log('Action: Attached screenshot talk-to-scientist.png');
    // Other Services Navigation (Hover + Click)
    const servicesList = [
        { name: 'Specialty Chemicals', screenshotName: 'services-specialty-chemicals.png' },
        { name: 'CDMO Services', screenshotName: 'services-cdmo-services.png' },
        { name: 'Peptide Synthesis', screenshotName: 'services-peptide-synthesis.png' },
        { name: 'Custom Synthesis', screenshotName: 'services-custom-synthesis.png' },
        { name: 'API Impurities & Reference Standards', screenshotName: 'services-api-impurities.png' }
    ];
    for (const service of servicesList) {
        console.log(`Step: Navigating to ${service.name}`);
        // Ensure menu is hovered each time to reveal dropdown
        await page.goto('/services/');
        await servicesMenu.hover();
        await page.waitForTimeout(500);
        const serviceLink = page.getByRole('link', { name: service.name, exact: true }).first();
        await expect(serviceLink).toBeVisible({ timeout: 10000 });
        console.log(`Action: Clicking ${service.name}`);
        await serviceLink.click();
        // Use locator for visibility check instead of page
        await expect(page.locator('body')).toBeVisible(); 
        const screenshot = await page.screenshot();
        await testInfo.attach(service.screenshotName, { body: screenshot, contentType: 'image/png' });
        console.log(`Action: Attached screenshot ${service.screenshotName}`);
    }
});