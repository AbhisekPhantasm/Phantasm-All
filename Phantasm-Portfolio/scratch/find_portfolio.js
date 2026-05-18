const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://phantasm.in', { waitUntil: 'domcontentloaded' });
  const links = await page.evaluate(() => 
    Array.from(document.querySelectorAll('a[href*="/portfolio/"]'))
      .map(a => ({ text: a.innerText.trim(), href: a.href, target: a.target }))
  );
  console.log(JSON.stringify(links, null, 2));
  await browser.close();
})();
