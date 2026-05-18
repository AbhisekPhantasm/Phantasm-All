import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * AboutPage — covers /about
 */
export class AboutPage extends BasePage {
  readonly pageHeading: Locator;
  readonly missionStatement: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading      = page.getByRole('heading').first();
    this.missionStatement = page.getByText(/passionate education/i);
  }

  async open() {
    await this.goto('/about');
  }

  async verifyPageLoaded() {
    await this.verifyURL('/about');
    await expect(this.pageHeading).toBeVisible();
  }

  async verifyMissionStatementVisible() {
    await expect(this.missionStatement).toBeVisible();
  }
}
