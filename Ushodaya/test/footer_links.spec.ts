import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('Footer Links Comprehensive Redirection Check', async ({ page }, testInfo) => {
  const pageName = 'Footer Links Check';
  const url = 'https://ushodaya.phantasm.solutions/';
  const bugs: any[] = [];

  const logBug = (issue: string, expected: string, actual: string, severity: string) => {
    bugs.push({ page: pageName, issue, expected, actual, severity });
  };

  const snap = async (label: string) => {
    const ss = await page.screenshot({ fullPage: false });
    await testInfo.attach(label, { body: ss, contentType: 'image/png' });
  };

  page.on('console', msg => {
    if (msg.type() === 'error') logBug('Console Error', 'Clean console', msg.text(), 'Medium');
  });

  console.log(`Navigating to: ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Scroll to footer
  console.log('--- SCROLLING TO FOOTER ---');
  const footer = page.locator('footer, .footer, .ekit-template-content-footer, .elementor-location-footer').first();
  if (await footer.isVisible()) {
    await footer.evaluate(node => node.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(1000);
  }
  await snap('1 - Footer Section');

  // Identify footer links
  const footerLinkLocator = page.locator('.footer a, .ekit-template-content-footer a, footer a, .elementor-location-footer a');
  const linkCount = await footerLinkLocator.count();
  console.log(`Found ${linkCount} footer links.`);

  const checkedHrefs = new Set<string>();

  for (let i = 0; i < linkCount; i++) {
    const link = footerLinkLocator.nth(i);
    
    if (!(await link.isVisible())) continue;

    const href = await link.getAttribute('href');
    const text = (await link.innerText()).trim();

    if (!href || href === '#' || href.startsWith('mailto:') || href.startsWith('tel:')) {
      console.log(`- Skipping non-navigation link: "${text}" (${href})`);
      continue;
    }

    if (checkedHrefs.has(href)) continue;
    checkedHrefs.add(href);

    console.log(`- Testing Footer Link ${i + 1}/${linkCount}: "${text}" -> ${href}`);
    
    await link.evaluate(node => node.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(500);

    // Click and wait for navigation
    try {
        await link.click();
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        console.log(`  [RESULT] Currently at: ${currentUrl}`);

        if (currentUrl === url && href !== '/' && href !== url) {
            console.log(`  [WARNING] Link "${text}" might not have redirected.`);
        } else {
            console.log(`  [SUCCESS] Link "${text}" redirected successfully.`);
        }

        await snap(`Redirect - ${text || href}`);
    } catch (e: any) {
        console.log(`  [ERROR] Interaction failed for "${text}": ${e.message}`);
    }

    // Always go back to home for next link
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
        const f = document.querySelector('.footer, .ekit-template-content-footer, footer, .elementor-location-footer');
        if (f) f.scrollIntoView({ block: 'center' });
    });
    await page.waitForTimeout(500);
  }

  if (bugs.length > 0) {
    const resultsDir = path.join(process.cwd(), 'qa-results');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
    let report = '';
    for (const bug of bugs) report += `| ${bug.page} | ${bug.severity} | ${bug.issue} | ${bug.expected} | ${bug.actual} |\n`;
    fs.appendFileSync(path.join(resultsDir, 'bug_report.md'), report);
  }
});
