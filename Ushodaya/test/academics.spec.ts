import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('Academics Page Comprehensive QA Scenario', async ({ page }, testInfo) => {
  const pageName = 'Academics Page';
  const url = 'https://ushodaya.phantasm.solutions/academic-overview/';
  const homeUrl = 'https://ushodaya.phantasm.solutions/';
  const bugs: any[] = [];

  const logBug = (issue: string, expected: string, actual: string, severity: string) => {
    bugs.push({ page: pageName, issue, expected, actual, severity });
  };

  const snap = async (label: string) => {
    const ss = await page.screenshot({ fullPage: true });
    await testInfo.attach(label, { body: ss, contentType: 'image/png' });
  };

  page.on('console', msg => {
    if (msg.type() === 'error') logBug('Console Error', 'No errors', msg.text(), 'Medium');
  });

  console.log(`Navigating to Academics: ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await snap('1 - Academics Page Loaded');

  // WALKTHROUGH
  await page.evaluate(async () => {
    for (let i = 0; i < document.body.scrollHeight; i += 200) {
      window.scrollTo(0, i);
      await new Promise(r => setTimeout(r, 50));
    }
    window.scrollTo(0, 0);
  });
  const fullSs = await page.screenshot({ fullPage: true });
  await testInfo.attach('2 - Academics Full Page', { body: fullSs, contentType: 'image/png' });

  await test.step('Button Redirection Testing', async () => {
    const buttons = await page.locator('a.elementor-button, .btn, .elementor-button-link').all();
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      if (await btn.isVisible()) {
        const text = (await btn.innerText()).trim() || `Button ${i+1}`;
        const href = await btn.getAttribute('href');
        if (href && href !== '#' && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
          await btn.evaluate(node => node.scrollIntoView({ block: 'center' }));
          await page.waitForTimeout(500);
          
          await snap(`Before Click: ${text}`);
          console.log(`- Clicking button: ${text} -> ${href}`);
          
          await btn.evaluate(node => (node as HTMLElement).click());
          await page.waitForTimeout(2000);
          
          await snap(`After Redirect: ${text}`);
          
          await page.goBack().catch(() => page.goto(url));
          await page.waitForLoadState('domcontentloaded');
          await page.waitForTimeout(1000);
          await snap(`Back on Academics from ${text}`);
        }
      }
    }
  });

  await test.step('Footer Link Testing', async () => {
    const footerLinks = await page.locator('footer a, .elementor-location-footer a').all();
    for (let i = 0; i < Math.min(footerLinks.length, 10); i++) {
      const link = footerLinks[i];
      if (await link.isVisible()) {
        const href = await link.getAttribute('href');
        const text = (await link.innerText()).trim() || `Footer Link ${i+1}`;
        if (href && href !== '#' && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('http')) {
          await link.evaluate(node => node.scrollIntoView({ block: 'center' }));
          await page.waitForTimeout(500);
          
          await snap(`Before Footer Click: ${text}`);
          console.log(`- Footer: ${text} -> ${href}`);
          
          await link.click().catch(() => {});
          await page.waitForTimeout(1500);
          
          await snap(`After Footer Redirect: ${text}`);
          
          await page.goBack().catch(() => page.goto(url));
          await page.waitForLoadState('domcontentloaded');
          await page.waitForTimeout(1000);
          await snap(`Back on Academics from Footer ${text}`);
        }
      }
    }
  });

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
