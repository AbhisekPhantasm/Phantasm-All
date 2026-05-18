import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ResultsPage — covers /results
 */
export class ResultsPage extends BasePage {
  readonly pageHeading: Locator;
  readonly resultCards: Locator;
  readonly resultImages: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading  = page.getByRole('heading').first();
    this.resultCards  = page.locator('[class*="result"], [class*="card"], article').first();
    this.resultImages = page.getByRole('img').nth(2);
  }

  async open() {
    await this.goto('/results');
  }

  async verifyPageLoaded() {
    await this.verifyURL('/results');
    await expect(this.pageHeading).toBeVisible();
  }

  async verifyResultsContentVisible() {
    // At least one image beyond the logo should be present
    await expect(this.resultImages).toBeVisible();
  }
}
