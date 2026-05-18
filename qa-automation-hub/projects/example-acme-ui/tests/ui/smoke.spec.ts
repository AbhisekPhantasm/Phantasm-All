import { test, expect, BasePage } from '@qa-hub/playwright-framework';

class PlaywrightDocsHome extends BasePage {
  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveTitle(/Playwright/);
  }
}

test.describe('@smoke Example ACME UI', () => {
  test('loads Playwright docs home (sample)', async ({ page, logger }) => {
    logger.info('Starting sample UI check');
    const home = new PlaywrightDocsHome(page);
    await home.goto('/');
    await home.expectLoaded();
  });
});
