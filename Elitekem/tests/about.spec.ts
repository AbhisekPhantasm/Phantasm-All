import { test, expect } from '@playwright/test';
// TEST SCENARIO 1: About Us Page – Navigation & Interaction
test('About Us Page – Navigation & Interaction @smoke @regression', async ({ page }, testInfo) => {
    console.log('Step: Navigating to About Us page');
    await page.goto('/about/');
    await expect(page).toHaveURL(/.*about/);
    // 1. Contact Us Navigation
    console.log('Step: Clicking Contact Us');
    // Using a regex to handle both 'Contact Us' and 'Contact us'
    const contactUsLink = page.getByRole('link', { name: /Contact Us/i }).first();
    await expect(contactUsLink).toBeVisible();
    await contactUsLink.click();
    console.log('Action: Clicked Contact Us link');
    await expect(page).toHaveURL(/.*contact/);
    // Take screenshot and attach to Allure
    const contactScreenshot = await page.screenshot();
    await testInfo.attach('about-contact-us.png', { body: contactScreenshot, contentType: 'image/png' });
    console.log('Action: Attached screenshot about-contact-us.png to Allure report');
    // Go back to About Us
    console.log('Step: Navigating back to About Us');
    await page.goto('/about/');
    // 2. Explore Our Services
    console.log('Step: Clicking Explore Our Services');
    const exploreServicesLink = page.getByRole('link', { name: 'Explore Our Services' });
    await expect(exploreServicesLink).toBeVisible();
    await exploreServicesLink.click();
    console.log('Action: Clicked Explore Our Services link');
    await expect(page).toHaveURL(/.*services/);
    // Take screenshot and attach to Allure
    const servicesScreenshot = await page.screenshot();
    await testInfo.attach('about-services.png', { body: servicesScreenshot, contentType: 'image/png' });
    console.log('Action: Attached screenshot about-services.png to Allure report');
});