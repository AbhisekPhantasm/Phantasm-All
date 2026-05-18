import { test, expect } from '@playwright/test';

test('Guest Flow - FAQ Page Comprehensive Automation', async ({ page }) => {
  test.setTimeout(300000);

  // Step 1: Open website as a guest (no login)
  await page.goto('http://31.97.61.59:7004/');

  // Instant Age Verification Handling
  await page.locator('button:has-text("YES")').click({ timeout: 3000 }).catch(() => { });

  // Step 2: Navigate to FAQ page
  await page.getByRole('link', { name: 'FAQ' }).first().click();
  await page.waitForLoadState('networkidle');

  // Step 3: Take screenshot of FAQ page
  await page.screenshot({ path: 'screenshots/guest_faq_initial_load.png', fullPage: true });

  const categories = ['Product', 'Orders & Returns', 'Payment'];

  for (const categoryName of categories) {
    console.log(`Checking category: ${categoryName}`);

    // 1. Click Category - Using exact text match
    const categoryBtn = page.locator('button').filter({ hasText: new RegExp(`^${categoryName}$`, 'i') }).first();
    await categoryBtn.click();
    await page.waitForTimeout(2000); // Wait for tab transition

    // 2. Identify the question headers
    const questionHeaders = page.locator('div[class*="faq_faqHeader"]');
    const count = await questionHeaders.count();
    console.log(`Found ${count} questions in ${categoryName}`);

    for (let i = 0; i < count; i++) {
      const header = questionHeaders.nth(i);
      const toggleIcon = header.locator('span').first();
      const questionText = await header.locator('h3').innerText().catch(() => `Question ${i + 1}`);

      console.log(`  Processing question ${i + 1}: ${questionText}`);

      // 3. Ensure it's closed before opening (if it's not the target state)
      let currentIcon = await toggleIcon.innerText();
      if (currentIcon !== '+') {
        await header.click();
        await expect(toggleIcon).toHaveText('+', { timeout: 5000 });
        await page.waitForTimeout(500);
      }

      // 4. Click to open question
      await header.click();

      // 5. Wait for answer expansion (icon should NO LONGER be '+')
      await expect(toggleIcon).not.toHaveText('+', { timeout: 10000 });
      await page.waitForTimeout(1000); // Wait for animation

      // 6. Take screenshot after opening
      await page.screenshot({ path: `screenshots/faq_${categoryName.replace(/\s+/g, '_')}_q${i + 1}_opened.png` });

      // 7. Click to close question
      await header.click();

      // 8. Wait for answer to close (icon should be '+' again)
      await expect(toggleIcon).toHaveText('+', { timeout: 10000 });
      await page.waitForTimeout(500);
    }
  }

  // 6. After completion, navigate back to Home page
  await page.getByRole('link', { name: 'Home' }).first().click();
  await expect(page).toHaveURL('http://31.97.61.59:7004/');
});
