const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://phantasm.in', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => window.scrollBy(0, 3000));
  await new Promise(r => setTimeout(r, 2000));
  const projects = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="/portfolio/"]'));
    return links.map(l => ({ text: l.innerText.trim(), href: l.getAttribute('href') })).filter(p => p.text.length > 0);
  });
  console.log(JSON.stringify(projects, null, 2));
  await browser.close();
})();
