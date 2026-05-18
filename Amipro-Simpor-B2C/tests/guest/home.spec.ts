import { test, expect, Page } from '@playwright/test';

test('Home Page Scenarios: Full Validation and Redirection', async ({ page, context }) => {
  const pageName = 'home';
  const targetUrl = 'http://82.112.230.248:6022/'; // Use absolute URL for reliable comparison

  // Helper Function: Scroll the page and interact with visible items
  async function captureScrollSteps(page: Page, name: string) {
    const totalHeight = await page.evaluate(() => document.body.scrollHeight);
    let currentScroll = 0;
    const scrollStep = 500;

    try {
      while (currentScroll < totalHeight) {
        if (page.isClosed()) return;
        await page.evaluate((y) => window.scrollTo(0, y), currentScroll);
        await page.waitForTimeout(200).catch(() => { });
        await page.screenshot({ path: `screenshots/guest/${name}-scroll-${currentScroll}.png` }).catch(() => { });

        const buttons = await page.locator('button:not([data-clicked="true"]), .btn:not([data-clicked="true"]), .button:not([data-clicked="true"]), [role="button"]:not([data-clicked="true"]), a[href*="product"]:not([data-clicked="true"]), a[href*="brand"]:not([data-clicked="true"])').all();
        for (let i = 0; i < Math.min(buttons.length, 5); i++) {
          if (await buttons[i].isVisible()) {
            try {
              if (await buttons[i].isVisible()) { await buttons[i].scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => {}); }
              const beforeUrl = page.url();
              await buttons[i].evaluate((btn: HTMLElement) => {
                btn.setAttribute('data-clicked', 'true');
                btn.click();
              }).catch(() => { });
              await page.waitForTimeout(500);
              await page.screenshot({ path: `screenshots/guest/${name}-button-click-${currentScroll}-${i}.png` }).catch(() => { });
              await page.keyboard.press('Escape').catch(() => {});
              await page.mouse.click(1, 200).catch(() => {});
              await page.evaluate(() => {
                document.querySelectorAll('button[aria-label*="lose"], .close, .cart-close, .close-cart, [class*="close"], svg[class*="x"], svg[class*="X"]').forEach(el => (el as HTMLElement).click());
              }).catch(() => {});
              if (page.url() !== beforeUrl) {
                await page.goBack({ timeout: 2000 }).catch(() => { });
              }
            } catch (e) { }
          }
        }

        const forms = await page.locator('form:not([data-submitted="true"])').all();
        for (let i = 0; i < forms.length; i++) {
          if (await forms[i].isVisible()) {
            await forms[i].evaluate(f => f.setAttribute('data-submitted', 'true')).catch(() => {});
            const inputs = await forms[i].locator('input:not([type="hidden"]), textarea').all();
            for (const input of inputs) {
              const type = await input.getAttribute('type');
              if (type === 'email') await input.fill('test@example.com').catch(() => { });
              else if (type === 'text' || !type) await input.fill('Dummy Data').catch(() => { });
            }
            const submit = forms[i].locator('button[type="submit"], input[type="submit"]').first();
            if (await submit.isVisible()) {
              await submit.evaluate((btn: HTMLElement) => btn.click()).catch(() => { });
              await page.screenshot({ path: `screenshots/guest/${name}-form-submit-${currentScroll}-${i}.png` }).catch(() => { });
            }
          }
        }
        currentScroll += scrollStep;
        if (currentScroll > totalHeight) break;
      }
    } catch (e: any) {
      console.log(`Scroll capture interrupted: ${e.message}`);
    }
  }

  // Helper Function: Detect and screenshot broken images
  async function checkBrokenImages(page: Page, name: string) {
    const brokenIndices = await page.$$eval('img', imgs => {
      return imgs.map((img, i) => {
        const isBroken = !(img as HTMLImageElement).complete || (img as HTMLImageElement).naturalWidth === 0;
        return isBroken ? i : -1;
      }).filter(i => i !== -1);
    });

    for (const index of brokenIndices) {
      try {
        const img = page.locator('img').nth(index);
        if (await img.isVisible()) { await img.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => {}); }
        await page.screenshot({ path: `screenshots/guest/${name}-broken-img-${index}.png` });
      } catch (e) { }
    }
  }

  // Helper Function: Remove Overlays and Blur
  async function removeOverlaysAndBlur(page: Page) {
    await page.evaluate(() => {
      // 1. Remove popup/overlay/loader elements
      const selectors = '[class*="overlay"], [class*="modal"], [class*="popup"], [id*="overlay"], [id*="modal"], [id*="popup"], [class*="cookie"], [class*="loader"], [class*="loading"], [id*="loader"], [class*="spinner"], [class*="preloader"]';
      document.querySelectorAll(selectors).forEach(el => el.remove());

      // 2. Faster way to remove blurs: Inject a style tag
      const style = document.createElement('style');
      style.id = 'antigravity-speed-up';
      style.innerHTML = `
        * { 
          filter: none !important; 
          backdrop-filter: none !important; 
          transition: none !important;
          animation: none !important;
        }
        body { 
          overflow: auto !important; 
        }
      `;
      document.head.appendChild(style);
    }).catch(() => { });
  }

  // --- START OF TEST EXECUTION ---
  test.setTimeout(300000); // 300s timeout

  // [Test Case: Validation and Scrolling]
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500); // Reduced wait
  await removeOverlaysAndBlur(page);
  await page.waitForTimeout(200); // Buffer for full rendering
  await page.screenshot({ path: `screenshots/guest/${pageName}-load.png` });

  await checkBrokenImages(page, pageName);
  await captureScrollSteps(page, pageName);

  // [Test Case: Comprehensive Redirection Check]
  const catName = 'home-redirection';
  const categories = [
    { name: 'HeaderLinks', selector: 'header a, .header a, nav a' },
    { name: 'FooterLinks', selector: 'footer a, .footer a' },
    { name: 'ContentLinks', selector: 'main a, .content a, .products a, .categories a' },
    { name: 'Buttons', selector: 'button, .btn, .button, [role="button"]' }
  ];

  for (const cat of categories) {
    console.log(`Checking Category: ${cat.name}`);
    
    for (let i = 0; i < 3; i++) { // Limit to 3 items for stability
      // Re-navigate if we are not on the correct page
      const currentUrl = page.url();
      if (!currentUrl.includes(':6022') || currentUrl.includes('redirection')) {
          await page.goto('/').catch(() => {});
          if (page.isClosed()) break;
          await page.waitForLoadState('domcontentloaded', { timeout: 10000 }).catch(() => {});
          await page.waitForTimeout(500).catch(() => {});
          await removeOverlaysAndBlur(page);
      }
      if (page.isClosed()) break;

      const items = page.locator(cat.selector);
      const count = await items.count();
      if (i >= count) break;

      const item = items.nth(i);
      if (!(await item.isVisible().catch(() => false))) continue;

      const initialUrl = page.url();
      let itemText = `item-${i}`;
      try {
        itemText = (await item.innerText()).trim().substring(0, 30).replace(/[^a-z0-9]/gi, '-') ||
          (await item.getAttribute('alt'))?.replace(/[^a-z0-9]/gi, '-') ||
          `item-${i}`;
      } catch (e) { }

      console.log(`Testing ${cat.name} ${i}: ${itemText}`);
      try {
        if (await item.isVisible()) { await item.scrollIntoViewIfNeeded({ timeout: 1000 }).catch(() => {}); }
        await item.hover().catch(() => { });
        await page.waitForTimeout(500);

        const [newPage] = await Promise.all([
          context.waitForEvent('page', { timeout: 2000 }).catch(() => null),
          item.evaluate((el: HTMLElement) => el.click()).catch(() => {})
        ]);

        if (newPage) {
          console.log(`  New tab opened: ${newPage.url()}`);
          await newPage.waitForLoadState('load').catch(() => {});
          await newPage.waitForTimeout(1000);
          await newPage.screenshot({ path: `screenshots/guest/${catName}-${cat.name}-${itemText}-target-newtab.png` }).catch(() => {});
          await newPage.close().catch(() => {});
        } else {
          await page.waitForLoadState('load', { timeout: 5000 }).catch(() => { });
          await page.waitForTimeout(500);
          await page.keyboard.press('Escape').catch(() => {});
          await page.mouse.click(1, 200).catch(() => {});
          await page.evaluate(() => {
            document.querySelectorAll('button[aria-label*="lose"], .close, .cart-close, .close-cart, [class*="close"], svg[class*="x"], svg[class*="X"]').forEach(el => (el as HTMLElement).click());
          }).catch(() => {});
          const finalUrl = page.url();
          if (finalUrl !== initialUrl) {
            console.log(`  Redirection detected: ${finalUrl}`);
            await page.screenshot({ path: `screenshots/guest/${catName}-${cat.name}-${itemText}-target.png` }).catch(() => {});
            await page.goBack().catch(() => page.goto('/'));
          } else {
            console.log(`  No redirection for ${cat.name} ${i}`);
            await page.screenshot({ path: `screenshots/guest/${catName}-${cat.name}-${itemText}-no-redir.png` }).catch(() => {});
          }
        }
      } catch (e: any) {
        console.log(`  Interaction failed for ${cat.name} ${i}: ${e.message}`);
        if (e.message.includes('closed')) break;
      }
    }
  }
});



