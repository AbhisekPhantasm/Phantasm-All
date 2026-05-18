const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://ushodaya.phantasm.solutions/', { waitUntil: 'networkidle' });
  
  const footers = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('*')).filter(el => {
        const className = el.className;
        return typeof className === 'string' && className.toLowerCase().includes('footer');
    }).map(el => ({ tag: el.tagName, class: el.className }));
  });
  
  console.log(JSON.stringify(footers, null, 2));
  await browser.close();
})();
