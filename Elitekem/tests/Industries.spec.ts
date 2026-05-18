import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Capture a VIEWPORT-ONLY screenshot — no fullPage to keep video stable.
 * Attaches to Allure report AND saves to screenshots folder.
 */
async function snap(page: any, name: string) {
  const buffer = await page.screenshot({ path: path.join('screenshots', `${name}.png`) });
  await test.info().attach(name, { body: buffer, contentType: 'image/png' });
}

test('Campaign Page – Industry Week Services Flow', async ({ page }) => {

  await test.step('Navigate to Home Page', async () => {
    await page.goto('https://elitekem.com/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await snap(page, 'industry_01_home_page');
    console.log('✅ Home page loaded');
  });

  await test.step('Click Industries We Serve', async () => {
    await page.locator('a', { hasText: /industries we serve/i }).first().click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await snap(page, 'industry_02_industries_page_loaded');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
    console.log('✅ Industries page loaded');
  });

  await test.step('View Industries Page Content', async () => {
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
    await snap(page, 'industry_03_page_content_scrolled');
    console.log('✅ Page content visible after scroll');
  });

  await test.step('Explore Our Capabilities', async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    const exploreBtn = page.locator('a, button', { hasText: /explore our capabilities/i }).first();

    if (await exploreBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await snap(page, 'industry_04a_before_explore_click');
      await exploreBtn.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      await snap(page, 'industry_04b_explore_capabilities_page');
      console.log('✅ Explore Our Capabilities page opened');

      await page.goBack();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);
      await snap(page, 'industry_04c_returned_to_industries');
      console.log('✅ Navigated back to Industries');
    } else {
      await snap(page, 'industry_04_explore_not_found');
      console.log('ℹ️ Explore Our Capabilities button not found');
    }
  });

  await test.step('Scroll to Start a Conversation', async () => {
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(500);
    await snap(page, 'industry_05_scrolled_down');
    console.log('✅ Scrolled down to lower sections');
  });

  await test.step('Click Start a Conversation', async () => {
    const startConvoLink = page.locator('a, button', { hasText: /start a conversation/i }).first();

    if (await startConvoLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await startConvoLink.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      await snap(page, 'industry_06a_conversation_page');
      console.log('✅ Start a Conversation page opened');

      await page.goBack();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(500);
      await snap(page, 'industry_06b_returned_from_conversation');
      console.log('✅ Navigated back');
    } else {
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(500);

      if (await startConvoLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await startConvoLink.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);
        await snap(page, 'industry_06a_conversation_page');
        await page.goBack();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(500);
      } else {
        await snap(page, 'industry_06_conversation_not_found');
        console.log('ℹ️ Start a Conversation not found');
      }
    }
  });

  await test.step('Validate Page Bottom Content', async () => {
    await page.evaluate(() => window.scrollBy(0, 2000));
    await page.waitForTimeout(1000);
    await snap(page, 'industry_07_page_bottom');

    const anySection = page.locator('section, .section, article, div[class*="elementor"]').first();
    await expect(anySection).toBeVisible();
    console.log('✅ Page bottom content validated');
  });

  await test.step('Scroll Back to Top', async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(800);
    await snap(page, 'industry_08_back_to_top');
    console.log('✅ Scrolled back to top');
  });

  await test.step('Final Validation', async () => {
    const pageTitle = await page.title();
    expect(pageTitle).not.toBe('');
    const mainContent = page.locator('main, .main-content, #main, body').first();
    await expect(mainContent).toBeVisible();
    await snap(page, 'industry_09_final_validation');
    console.log(`✅ Flow completed – Title: "${pageTitle}"`);
  });
});
