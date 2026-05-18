import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://www.krccollege.com/');
  
  const sections = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.innerText);
    const links = Array.from(document.querySelectorAll('a')).map(a => ({ text: a.innerText, href: a.href }));
    const inputs = Array.from(document.querySelectorAll('input, textarea, select')).map(i => ({ name: i.name, placeholder: i.placeholder, type: i.type }));
    return { headings, links, inputs };
  });

  console.log(JSON.stringify(sections, null, 2));
  await browser.close();
})();
