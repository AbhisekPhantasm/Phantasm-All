import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('Academic Achievements Page Comprehensive QA Scenario', async ({ page }, testInfo) => {
  const pageName = 'Academic Achievements';
  const url = 'https://ushodaya.phantasm.solutions/academic-achievements/';
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

  // SS 1: Initial page load
  await snap('1 - Academic Achievements Page Loaded');

  // PAGE WALKTHROUGH (video)
  console.log('--- PAGE WALKTHROUGH ---');
  await page.evaluate(async () => {
    for (let i = 0; i < document.body.scrollHeight; i += 200) {
      window.scrollTo(0, i);
      await new Promise(r => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);

  // SS 2: Full page after scroll
  const fullSs = await page.screenshot({ fullPage: true });
  await testInfo.attach('2 - Academic Achievements Full Page (After Scroll)', { body: fullSs, contentType: 'image/png' });

  // BUTTON REDIRECTIONS
  console.log('Testing button redirections...');
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
        
        // Simple redirection check
        const currentUrl = page.url();
        if (currentUrl === url) {
            console.log(`[WARNING] Button with href ${href} did not change the URL or redirected back to the same page.`);
        } else {
            console.log(`[SUCCESS] Redirected to: ${currentUrl}`);
        }

        await page.goBack().catch(() => page.goto(url));
        await page.waitForLoadState('domcontentloaded');
      }
    }
  }

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

  // SS 3: Footer area
  const footer = page.locator('footer, .elementor-location-footer').first();
  if (await footer.isVisible()) {
    await footer.evaluate(node => node.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(500);
  }
  await snap('3 - Academic Achievements Footer Section');

  if (bugs.length > 0) {
    const resultsDir = path.join(process.cwd(), 'qa-results');
    if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });
    let report = '';
    for (const bug of bugs) report += `| ${bug.page} | ${bug.severity} | ${bug.issue} | ${bug.expected} | ${bug.actual} |\n`;
    fs.appendFileSync(path.join(resultsDir, 'bug_report.md'), report);
  }
});
