import { chromium } from '@playwright/test';

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  try {
    console.log('Navigating to site...');
    await page.goto('https://31.97.61.59:7004', { waitUntil: 'networkidle' });
    
    // Take screenshot of home page
    await page.screenshot({ path: 'home_page.png' });
    console.log('Home page screenshot taken.');

    // Login
    console.log('Logging in...');
    await page.click('text=Login / Register'); // Guessing locator
    await page.waitForTimeout(2000);
    await page.fill('input[name="username"]', 'abhishek@phantasm.co.in'); // Guessing name
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    console.log('Logged in.');

    // Get some locators
    const content = await page.content();
    console.log('Page title:', await page.title());
    
    // Dump buttons and links
    const buttons = await page.evaluate(() => Array.from(document.querySelectorAll('button, a')).map(el => ({
      tag: el.tagName,
      text: el.textContent?.trim(),
      id: el.id,
      class: el.className
    })));
    console.log('Found buttons/links:', JSON.stringify(buttons, null, 2));

  } catch (error) {
    console.error('Error during inspection:', error);
  } finally {
    await browser.close();
  }
}

inspect();
