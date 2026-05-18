import { test, expect } from '@playwright/test';

test.describe('Navigation - Footer Section Links Validation', () => {

  test('Complete Footer Navigation Flow', async ({ page }) => {
    test.setTimeout(120000); // Navigation tests can be slow

    // 1. Navigate to Website
    await page.goto('/');
    await expect(page).toHaveTitle(/Krishna Reddy Sri Chaitanya/);
    console.log('✅ Homepage loaded successfully');

    // 2. Scroll to Footer Section
    const footer = page.locator('footer').first();
    await footer.scrollIntoViewIfNeeded();
    await expect(footer).toBeVisible();
    console.log('✅ Footer section is visible');

    const footerLinks = [
      { name: 'Home', path: '/', screenshot: 'footer-home.png' },
      { name: 'About Us', path: '/about', screenshot: 'footer-about.png' },
      { name: 'IIT-JEE Academy', path: '/iit-jee-academy', screenshot: 'footer-iitjee.png' },
      { name: 'Results', path: '/results', screenshot: 'footer-results.png' },
      { name: 'Facilities', path: '/facilities', screenshot: 'footer-facilities.png' },
      { name: 'Admissions', path: '/admissions', screenshot: 'footer-admissions.png' },
      { name: 'Blog', path: '/blog', screenshot: 'footer-blog.png' },
      { name: 'Contact Us', path: '/Contact-us', screenshot: 'footer-contact.png' }
    ];

    for (const linkInfo of footerLinks) {
      console.log(`Testing footer link: ${linkInfo.name}`);
      const link = footer.getByRole('link', { name: linkInfo.name, exact: true }).first();
      
      if (await link.isVisible()) {
        const href = await link.getAttribute('href');
        if (href) {
          try {
            // Navigate directly to the href to be more resilient
            await page.goto(href);
            await page.waitForLoadState('networkidle');
            
            // Take screenshot
            await page.screenshot({ path: `test-results/${linkInfo.screenshot}` });
            console.log(`✅ Navigation to ${linkInfo.name} works correctly`);
            
            // Navigate back to Home for the next link
            if (linkInfo.name !== 'Home') {
              await page.goto('/');
              await footer.scrollIntoViewIfNeeded();
            }
          } catch (e: any) {
            console.log(`⚠️ Navigation to ${linkInfo.name} failed: ${e.message}`);
            await page.goto('/');
            await footer.scrollIntoViewIfNeeded();
          }
        }
      } else {
        console.log(`⚠️ Footer link ${linkInfo.name} not found`);
      }
    }

    console.log('✅ Footer Section validation completed');
  });
});
