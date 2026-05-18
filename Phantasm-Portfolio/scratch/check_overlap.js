const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://phantasm.in', { waitUntil: 'domcontentloaded' });
  
  const projects = ['Smoq', 'Cleopatrashemp', 'Search Your Space'];
  
  for (const name of projects) {
    console.log(`Checking project: ${name}`);
    const loc = page.locator('a[href*="/portfolio/"]').filter({ hasText: name }).first();
    
    if (await loc.count() === 0) {
      console.log(`  ${name}: NOT FOUND`);
      continue;
    }
    
    await loc.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    const overlap = await loc.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const elementAtPoint = document.elementFromPoint(x, y);
      return {
        tag: elementAtPoint?.tagName,
        class: elementAtPoint?.className,
        isSame: elementAtPoint === el || el.contains(elementAtPoint),
        outerHTML: elementAtPoint?.outerHTML.slice(0, 200)
      };
    });
    
    console.log(`  ${name}: Overlap data:`, JSON.stringify(overlap, null, 2));
    
    // Try to click using coordinate
    try {
      const box = await loc.boundingBox();
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      console.log(`  ${name}: MOUSE CLICK SUCCESS`);
    } catch (e) {
      console.log(`  ${name}: MOUSE CLICK FAILED`);
    }
    
    await page.goto('https://phantasm.in', { waitUntil: 'domcontentloaded' });
  }
  
  await browser.close();
})();
