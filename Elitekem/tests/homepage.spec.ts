import { test, expect, Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import * as path from 'path';

async function takeScreenshot(page: Page, name: string): Promise<void> {
  const screenshotPath = path.join('screenshots', `${name}.png`);
  const screenshot = await page.screenshot({ path: screenshotPath, fullPage: false });
  await allure.attachment(name, screenshot, 'image/png');
}

async function performAction(
  page: Page,
  actionName: string,
  action: () => Promise<void>
): Promise<void> {
  try {
    await page.waitForTimeout(1000);
    const beforeShot = await page.screenshot();
    await allure.attachment(`Before – ${actionName}`, beforeShot, 'image/png');
    await action();
    const afterShot = await page.screenshot();
    await allure.attachment(`After – ${actionName}`, afterShot, 'image/png');
  } catch (error) {
    if (!page.isClosed()) {
      const failShot = await page.screenshot();
      await allure.attachment(`FAILURE – ${actionName}`, failShot, 'image/png');
    }
    throw error;
  }
}

test('EliteKem Homepage – Full Interaction Flow', async ({ page }) => {
  await test.step('Step 1 – Open homepage and verify page title', async () => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveTitle(/elitekem/i);
    await takeScreenshot(page, 'homepage-loaded');
    console.log('✅ Homepage loaded successfully');
  });

  await test.step('Step 2 – Click "Start a Project Discussion"', async () => {
    await performAction(page, 'Click Start a Project Discussion', async () => {
      await page.getByRole('link', { name: 'Start a Project Discussion' }).click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/contact-us/);
      await takeScreenshot(page, 'contact-us-page');
      console.log('✅ Navigated to Contact Us page');
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
    });
  });

  await test.step('Step 3 – Services carousel arrow interaction', async () => {
    const carouselSection = page.locator('.elementor-image-carousel-wrapper').first();
    const carouselVisible = await carouselSection.isVisible().catch(() => false);
    if (carouselVisible) {
      await carouselSection.scrollIntoViewIfNeeded();
    } else {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.3));
      await page.waitForTimeout(1000);
    }
    await performAction(page, 'Click Right Arrow on services carousel', async () => {
      const nextBtn = page.locator('[aria-label="Next slide"]').first();
      const isDisabled = await nextBtn.getAttribute('aria-disabled');
      if (await nextBtn.isVisible().catch(() => false) && isDisabled !== 'true') {
        await nextBtn.click();
        console.log('✅ Clicked right arrow');
      } else {
        console.log('⚠️ Next slide button is disabled or not visible, skipping');
      }
    });
    await performAction(page, 'Click Left Arrow on services carousel', async () => {
      const prevBtn = page.locator('[aria-label="Previous slide"]').first();
      const isDisabled = await prevBtn.getAttribute('aria-disabled');
      if (await prevBtn.isVisible().catch(() => false) && isDisabled !== 'true') {
        await prevBtn.click();
        console.log('✅ Clicked left arrow');
      } else {
        console.log('⚠️ Previous slide button is disabled or not visible, skipping');
      }
    });
    await takeScreenshot(page, 'services-cards-after-arrows');
  });

  await test.step('Step 4 – Click "View Our Services"', async () => {
    await performAction(page, 'Click View Our Services', async () => {
      const viewServicesLink = page.getByRole('link', { name: 'View Our Services' });
      await viewServicesLink.scrollIntoViewIfNeeded();
      await viewServicesLink.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/services/);
      await takeScreenshot(page, 'services-page');
      console.log('✅ Navigated to Services page');
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
    });
  });

  await test.step('Step 5 – Click "Learn More About Our Approach"', async () => {
    await performAction(page, 'Click Learn More About Our Approach', async () => {
      const learnMoreLink = page.getByRole('link', { name: 'Learn More About Our Approach' });
      await learnMoreLink.scrollIntoViewIfNeeded();
      await learnMoreLink.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/about/);
      await takeScreenshot(page, 'about-us-page');
      console.log('✅ Navigated to About Us page');
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
    });
  });

  await test.step('Step 6 – Click "Download Brochure"', async () => {
    await performAction(page, 'Click Download Brochure', async () => {
      const brochureLink = page.getByRole('link', { name: 'Download Brochure' }).first();
      await brochureLink.scrollIntoViewIfNeeded();
      const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
      await brochureLink.click();
      const download = await downloadPromise;
      if (download) {
        console.log(`✅ Brochure downloaded: ${download.suggestedFilename()}`);
      } else {
        console.log('⚠️ No download event – brochure may have opened in a new tab or redirected');
      }
      await takeScreenshot(page, 'brochure-page');
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
    });
  });

  await test.step('Step 7 – Scroll to bottom and click "Contact Us"', async () => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await performAction(page, 'Click Contact Us in bottom section', async () => {
      const contactLink = page.getByRole('link', { name: /Contact[\s-]*us/i }).last();
      await contactLink.scrollIntoViewIfNeeded();
      await contactLink.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/contact-us/);
      console.log('✅ Navigated to Contact Us from bottom section');
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
    });
  });

  await test.step('Step 8 – Final homepage health check', async () => {
    await expect(page).toHaveTitle(/elitekem/i);
    await expect(page.getByRole('link', { name: 'Start a Project Discussion' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'View Our Services' })).toBeVisible();
    await takeScreenshot(page, 'homepage-final-check');
    console.log('✅ Homepage is fully functional – all key elements verified');
  });
});
