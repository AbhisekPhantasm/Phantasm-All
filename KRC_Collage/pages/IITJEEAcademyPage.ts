import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * IITJEEAcademyPage — covers /iit-jee-academy
 */
export class IITJEEAcademyPage extends BasePage {
  readonly pageHeading: Locator;
  readonly courseDetails: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading  = page.getByRole('heading').first();
    this.courseDetails = page.locator('main, article, section').first();
  }

  async open() {
    await this.goto('/iit-jee-academy');
  }

  async verifyPageLoaded() {
    await this.verifyURL('/iit-jee-academy');
    await expect(this.pageHeading).toBeVisible();
  }

  async verifyPageTitle() {
    await this.verifyTitle('IIT');
  }
}
