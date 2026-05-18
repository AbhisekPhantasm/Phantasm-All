const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://phantasm.in', { waitUntil: 'domcontentloaded' });
  
  const tabs = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('a[href*="tab-"]'));
    return elements.map(el => ({
      text: el.innerText.trim(),
      href: el.getAttribute('href'),
      class: el.className,
      parentTag: el.parentElement.tagName,
      parentClass: el.parentElement.className
    }));
  });
  
  console.log(JSON.stringify(tabs, null, 2));
  await browser.close();
})();
