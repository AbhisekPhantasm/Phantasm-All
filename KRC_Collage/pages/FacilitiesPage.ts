import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * FacilitiesPage — covers /facilities
 */
export class FacilitiesPage extends BasePage {
  readonly pageHeading: Locator;
  readonly facilityImages: Locator;
  readonly facilityDescriptions: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading          = page.getByRole('heading').first();
    this.facilityImages       = page.getByRole('img').nth(2);
    this.facilityDescriptions = page.locator('p').first();
  }

  async open() {
    await this.goto('/facilities');
  }

  async verifyPageLoaded() {
    await this.verifyURL('/facilities');
    await expect(this.pageHeading).toBeVisible();
  }

  async verifyFacilitiesContentVisible() {
    await expect(this.facilityImages).toBeVisible();
  }
}
