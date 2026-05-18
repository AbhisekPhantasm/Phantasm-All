const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://phantasm.in', { waitUntil: 'domcontentloaded' });
  
  // Wait a bit for any dynamic icons to load
  await page.waitForTimeout(2000);

  const elements = await page.evaluate(() => {
    const results = [];
    // Get all interactive elements
    const interactive = document.querySelectorAll('a, button, [role="button"], svg');
    
    interactive.forEach(el => {
      const rect = el.getBoundingClientRect();
      // Only care about elements in the top part of the page (header area)
      if (rect.top < 150) {
        const info = {
          tag: el.tagName,
          text: el.innerText?.trim(),
          class: el.className,
          id: el.id,
          ariaLabel: el.getAttribute('aria-label'),
          href: el.getAttribute('href'),
          rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
        };
        
        // If it's an SVG, get its parent info too
        if (el.tagName === 'SVG') {
          info.parentTag = el.parentElement.tagName;
          info.parentClass = el.parentElement.className;
          info.parentAriaLabel = el.parentElement.getAttribute('aria-label');
        }
        
        results.push(info);
      }
    });
    return results;
  });

  console.log(JSON.stringify(elements, null, 2));
  await browser.close();
})();
