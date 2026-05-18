import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('Gallery Page Comprehensive QA Scenario', async ({ page }, testInfo) => {
  const pageName = 'Gallery Page';
  const url = 'https://ushodaya.phantasm.solutions/gallery/';
  const homeUrl = 'https://ushodaya.phantasm.solutions/';
  const bugs: any[] = [];

  const logBug = (issue: string, expected: string, actual: string, severity: string) => {
    bugs.push({ page: pageName, issue, expected, actual, severity });
  };

  const snap = async (label: string) => {
    const ss = await page.screenshot({ fullPage: false });
    await testInfo.attach(label, { body: ss, contentType: 'image/png' });
  };

  page.on('console', msg => {
    if (msg.type() === 'error') logBug('Console Error', 'No errors', msg.text(), 'Medium');
  });

  console.log(`Navigating to Gallery: ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await snap('1 - Gallery Page Loaded');

  // FULL PAGE WALKTHROUGH (video evidence)
  console.log('--- PAGE WALKTHROUGH (visible in video) ---');
  await page.evaluate(async () => {
    for (let i = 0; i < document.body.scrollHeight; i += 150) {
      window.scrollTo(0, i);
      await new Promise(r => setTimeout(r, 80));
    }
    for (let i = document.body.scrollHeight; i >= 0; i -= 300) {
      window.scrollTo(0, i);
      await new Promise(r => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1000);
  const fullSs = await page.screenshot({ fullPage: true });
  await testInfo.attach('2 - Gallery Full Page', { body: fullSs, contentType: 'image/png' });

  // GALLERY IMAGE PREVIEWS (JS click, no hover timeout)
  console.log('Testing gallery image previews...');
  const galleryImageCount = await page.locator('img').count();
  console.log(`- Found ${galleryImageCount} images`);
  const imagesToTest = Math.min(galleryImageCount, 5);

  for (let i = 0; i < imagesToTest; i++) {
    const img = page.locator('img').nth(i);
    if (await img.isVisible()) {
      await img.evaluate(node => node.scrollIntoView({ block: 'center' }));
      await page.waitForTimeout(600);
      console.log(`- Clicking image ${i + 1}...`);
      await img.evaluate(node => (node as HTMLElement).click());
      await page.waitForTimeout(1500);
      const closeSelectors = ['.elementor-lightbox-close', '.mfp-close', '.sl-close', '[aria-label="Close"]'];
      for (const sel of closeSelectors) {
        const closeBtn = page.locator(sel);
        if (await closeBtn.isVisible()) { await closeBtn.click().catch(() => {}); break; }
      }
      await page.waitForTimeout(500);
    }
  }

  // SS 3: After gallery interactions
  await snap('3 - Gallery After Image Preview');

  // FOOTER LINKS
  console.log('--- CHECKING FOOTER LINKS ---');
  const footerLinks = await page.locator('footer a, .elementor-location-footer a').all();
  for (const link of footerLinks) {
    if (await link.isVisible()) {
      const href = await link.getAttribute('href');
      const text = await link.innerText().catch(() => '');
      if (href && href !== '#' && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('http')) {
        console.log(`- Footer: ${text.trim() || href}`);
        await link.evaluate(node => node.scrollIntoView({ block: 'center' }));
        await link.click().catch(() => {});
        await page.waitForTimeout(1500);
        await page.goBack().catch(() => page.goto(url));
        await page.waitForLoadState('domcontentloaded');
      }
    }
  }

  // BUTTON REDIRECTIONS
  const buttons = await page.locator('a.elementor-button, .btn, .elementor-button-link').all();
  for (const btn of buttons) {
    if (await btn.isVisible()) {
      const href = await btn.getAttribute('href');
      if (href && href !== '#' && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        await btn.evaluate(node => node.scrollIntoView({ block: 'center' }));
        await page.waitForTimeout(500);
        console.log(`- Clicking button: ${href}`);
        await btn.evaluate(node => (node as HTMLElement).click());
        await page.waitForTimeout(2000);
        await page.goBack().catch(() => page.goto(url));
        await page.waitForLoadState('domcontentloaded');
      }
    }
  }

  console.log('Returning to Home Page...');
  await page.goto(homeUrl, { waitUntil: 'domcontentloaded' });

  if (bugs.length > 0) {
    const resultsDir = path.join(process.cwd(), 'qa-results');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
    let report = '';
    for (const bug of bugs) report += `| ${bug.page} | ${bug.severity} | ${bug.issue} | ${bug.expected} | ${bug.actual} |\n`;
    fs.appendFileSync(path.join(resultsDir, 'bug_report.md'), report);
  }
});
