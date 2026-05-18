const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://phantasm.in', { waitUntil: 'domcontentloaded' });
  
  const info = {};
  
  // Testimonials
  info.testimonials = await page.evaluate(() => {
    const dots = document.querySelectorAll('.slick-dots li, .elementor-slick-dot');
    return { count: dots.length, classes: Array.from(dots).map(d => d.className) };
  });
  
  // FAQ
  info.faq = await page.evaluate(() => {
    const items = document.querySelectorAll('.elementor-accordion-title, .elementor-toggle-title');
    return { count: items.length, tags: Array.from(items).map(i => i.tagName) };
  });
  
  // Footer
  info.footer = await page.evaluate(() => {
    const footer = document.querySelector('footer');
    if (!footer) return 'No footer';
    const links = footer.querySelectorAll('a');
    return { count: links.length, sampleTexts: Array.from(links).slice(0, 5).map(l => l.innerText) };
  });
  
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
