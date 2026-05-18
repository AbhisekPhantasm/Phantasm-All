import { chromium } from '@playwright/test';

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
        console.log('Navigating to login page...');
        await page.goto('http://31.97.61.59:3010/login', { waitUntil: 'load' });


        await page.getByRole('textbox', { name: 'Enter your email' }).fill('thisisvamsi9@gmail.com');

        await page.getByRole('textbox', { name: 'Enter your password' }).fill('Vamsi@1234');
        await page.getByRole('button', { name: 'Sign In' }).click();

        console.log('Waiting for URL change...');
        await page.waitForURL(url => !url.toString().includes('login'), { timeout: 10000 }).catch(e => console.log('Wait failed:', e.message));

        console.log('Current URL:', page.url());
        await page.screenshot({ path: 'screenshots/debug_login_fixed.png' });
    } catch (e) {
        console.log('Error:', e.message);
    } finally {
        await browser.close();
    }
})();
