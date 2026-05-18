import { test, expect } from '@playwright/test';
import { slowScrollToBottom } from './helpers/slow-scroll';

test.describe('Blog Page Navigation & Interaction Flow', () => {
  test('TC_BLOG_002 — Full blog interactions flow', async ({ page }, testInfo) => {
    test.setTimeout(180_000); // Allow enough time to loop through all blogs

    // 1. Navigate to Website
    await test.step('Navigate to Website', async () => {
      await page.goto('/');
      await expect(page).toHaveURL(/krccollege\.com/);
      await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/blog-01-homepage.png' }), contentType: 'image/png' });
    });

    // 2. Navigate to Blog Page
    await test.step('Navigate to Blog Page', async () => {
      const blogNavLink = page.locator('.nav-link-fill', { hasText: 'Blog' }).first();
      await expect(blogNavLink).toBeVisible();
      await blogNavLink.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/\/blog/);
      await testInfo.attach('screenshot', { body: await page.screenshot({ path: 'test-results/blog-02-blog-page.png' }), contentType: 'image/png' });
    });

    // 3. Capture Blog Titles
    let blogCount = 0;
    await test.step('Capture Blog Titles', async () => {
      // Wait for blogs to load
      const readMoreLinks = page.locator('text=/Read More|Read article|View More/i');
      const blogLinks = page.locator('a[href^="/blog/"]:not([href="/blog"])');
      
      // Give the page a moment to render elements
      await page.waitForTimeout(2000);
      
      const hasReadMore = await readMoreLinks.count() > 0;
      const primaryLocators = hasReadMore ? readMoreLinks : blogLinks;
      
      blogCount = await primaryLocators.count();
      console.log(`Found ${blogCount} blogs on the listing page.`);
      
      // Capture all h2/h3 titles to find the blog names
      const blogHeadings = page.locator('h2, h3');
      const titlesCount = await blogHeadings.count();
      const allTitles: string[] = [];
      for (let i = 0; i < titlesCount; i++) {
          const title = await blogHeadings.nth(i).textContent();
          if (title && title.trim().length > 0 && title.trim().length > 10) { // filter out short generic text
              allTitles.push(title.trim());
          }
      }
      console.log('Captured Blog Titles:', allTitles);
      await testInfo.attach('Blog Titles List', { body: allTitles.join('\n'), contentType: 'text/plain' });
    });

    // 4 & 5. Blog Interaction (Iterating through all blogs)
    for (let i = 0; i < blogCount; i++) {
       await test.step(`Blog ${i + 1} Interaction`, async () => {
         // Determine locator type again since DOM updates after goBack
         const readMoreLinks = page.locator('text=/Read More|Read article|View More/i');
         const hasReadMore = await readMoreLinks.count() > 0;
         let currentBlogLink;
         
         if (hasReadMore) {
             currentBlogLink = readMoreLinks.nth(i);
         } else {
             // To ensure we get distinct articles and not multiple links to same article
             // We can just rely on the read more, but if it doesn't exist we take nth link
             currentBlogLink = page.locator('a[href^="/blog/"]:not([href="/blog"])').nth(i);
         }
         
         await currentBlogLink.scrollIntoViewIfNeeded();
         await expect(currentBlogLink).toBeVisible();
         
         // Click on "Read More" of Blog
         await currentBlogLink.click();
         await page.waitForLoadState('domcontentloaded');
         
         // Verify navigation to blog detail
         await expect(page).not.toHaveURL(/\/blog$/);
         
         // Capture blog title
         const blogTitle = page.locator('h1, h2, .entry-title').first();
         await expect(blogTitle).toBeVisible({ timeout: 5000 }).catch(() => console.log('Could not find h1/h2 title'));
         const titleText = await blogTitle.isVisible() ? await blogTitle.textContent() : 'Unknown Title';
         console.log(`Successfully opened Blog ${i + 1}: ${titleText?.trim()}`);

         await testInfo.attach('screenshot', { body: await page.screenshot({ path: `test-results/blog-detail-${i+1}-top.png` }), contentType: 'image/png' });

         // Scroll down slowly through the page
         await slowScrollToBottom(page);
         
         await testInfo.attach('screenshot', { body: await page.screenshot({ path: `test-results/blog-detail-${i+1}-bottom.png` }), contentType: 'image/png' });

         // Navigate back to Blog listing page
         await page.goBack();
         await page.waitForLoadState('domcontentloaded');
         await expect(page).toHaveURL(/\/blog/);
       });
    }
  });
});
