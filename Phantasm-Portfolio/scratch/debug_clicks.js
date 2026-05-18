const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://phantasm.in', { waitUntil: 'domcontentloaded' });
  
  const projects = ['Smoq', 'Cleopatrashemp', 'Search Your Space'];
  
  for (const name of projects) {
    console.log(`Checking project: ${name}`);
    const loc = page.locator('a[href*="/portfolio/"]').filter({ hasText: name }).first();
    const count = await loc.count();
    
    if (count === 0) {
      console.log(`  ${name}: NOT FOUND`);
      continue;
    }
    
    try {
      await loc.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // Check if it's intercepted
      const isVisible = await loc.isVisible();
      console.log(`  ${name}: Visible=${isVisible}`);
      
      await loc.click({ timeout: 5000 });
      console.log(`  ${name}: CLICKED SUCCESS`);
      
      await page.goto('https://phantasm.in', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log(`  ${name}: CLICK FAILED - ${e.message.split('\n')[0]}`);
      // Try force click
      try {
        await loc.click({ force: true });
        console.log(`  ${name}: FORCE CLICK SUCCESS`);
        await page.goto('https://phantasm.in', { waitUntil: 'domcontentloaded' });
      } catch (e2) {
        console.log(`  ${name}: FORCE CLICK ALSO FAILED`);
      }
    }
  }
  
  await browser.close();
})();
