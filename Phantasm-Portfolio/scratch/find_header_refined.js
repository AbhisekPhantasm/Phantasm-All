const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto('https://phantasm.in', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    const headerData = await page.evaluate(() => {
      const data = {};
      
      const getAllElements = () => Array.from(document.querySelectorAll('*'));
      const all = getAllElements();

      // 1. Find Contact Us
      const contactUs = all.find(el => 
        (el.tagName === 'A' || el.tagName === 'BUTTON') && 
        (el.innerText.trim().toLowerCase() === 'contact us' || 
         el.getAttribute('href')?.includes('contact-us'))
      );
      if (contactUs) {
        data.contactUs = {
          tag: contactUs.tagName,
          text: contactUs.innerText.trim(),
          href: contactUs.getAttribute('href'),
          class: contactUs.className,
          id: contactUs.id,
          outerHTML: contactUs.outerHTML
        };
      }

      // 2. Find Search Icon
      // Look for elements with "search" in class or aria-label
      const search = all.find(el => 
        (el.className?.toString().toLowerCase().includes('search') || 
         el.getAttribute('aria-label')?.toLowerCase().includes('search')) &&
        el.getBoundingClientRect().top < 150
      );
      if (search) {
        data.searchIcon = {
          tag: search.tagName,
          class: search.className,
          ariaLabel: search.getAttribute('aria-label'),
          outerHTML: search.outerHTML
        };
      }

      // 3. Find Hamburger/Sidebar
      const sidebar = all.find(el => 
        (el.className?.toString().toLowerCase().includes('menu-bar') || 
         el.className?.toString().toLowerCase().includes('burger') ||
         el.className?.toString().toLowerCase().includes('hamburger')) &&
        el.getBoundingClientRect().top < 150
      );
      if (sidebar) {
        data.sidebarIcon = {
          tag: sidebar.tagName,
          class: sidebar.className,
          outerHTML: sidebar.outerHTML
        };
      }

      return data;
    });

    console.log(JSON.stringify(headerData, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
