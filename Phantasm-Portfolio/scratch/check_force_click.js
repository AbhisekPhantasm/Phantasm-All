const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://phantasm.in', { waitUntil: 'domcontentloaded' });
  
  const name = 'Smoq';
  const loc = page.locator('a[href*="/portfolio/"]').filter({ hasText: name }).first();
  
  await loc.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  
  try {
    await loc.click({ force: true, timeout: 5000 });
    console.log('Force click success');
  } catch (e) {
    console.log('Force click failed: ' + e.message);
  }
  
  await browser.close();
})();
