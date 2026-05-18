const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://ushodaya.phantasm.solutions/', { waitUntil: 'networkidle' });
  
  const footerHtml = await page.evaluate(() => {
    const footer = document.querySelector('footer, [class*="footer"]');
    return footer ? footer.outerHTML : 'Footer not found';
  });
  
  console.log(footerHtml);
  await browser.close();
})();
