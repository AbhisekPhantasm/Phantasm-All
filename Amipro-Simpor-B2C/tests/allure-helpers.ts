import { Page, TestInfo } from '@playwright/test';

/**
 * Helper to attach a full-page screenshot to the Allure report
 * specifically for brand overview verification.
 */
export async function attachBrandOverviewForAllure(page: Page, testInfo: TestInfo, brand: string) {
  const screenshot = await page.screenshot({ fullPage: true });
  await testInfo.attach(`${brand}-brand-overview`, {
    body: screenshot,
    contentType: 'image/png',
  });
}
