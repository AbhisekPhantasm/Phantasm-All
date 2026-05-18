import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * HomePage — covers the KRC landing page (/)
 */
export class HomePage extends BasePage {
  readonly heroSection: Locator;
  readonly heroBannerImage: Locator;
  readonly programsSection: Locator;
  readonly contactUsHeaderLink: Locator;

  constructor(page: Page) {
    super(page);
    this.heroSection         = page.locator('section').first();
    this.heroBannerImage     = page.getByRole('img', { name: /KRC/ }).nth(1);
    this.programsSection     = page.getByText('Our Programs');
    this.contactUsHeaderLink = page.getByRole('link', { name: 'Contact Us' }).first();
  }

  async open() {
    await this.goto('/');
  }

  async verifyHeroLoaded() {
    await expect(this.heroBannerImage).toBeVisible();
  }

  async verifyProgramsSectionVisible() {
    await expect(this.programsSection).toBeVisible();
  }

  async clickContactUsFromHeader() {
    await this.contactUsHeaderLink.click();
    await this.page.waitForURL(/Contact-us/);
  }

  async navigateToAbout() {
    await this.navAbout.click();
    await this.page.waitForURL(/about/);
  }

  async navigateToAdmissions() {
    await this.navAdmissions.click();
    await this.page.waitForURL(/admissions/);
  }

  async navigateToIITJEE() {
    await this.navIITJEE.click();
    await this.page.waitForURL(/iit-jee-academy/);
  }

  async navigateToResults() {
    await this.navResults.click();
    await this.page.waitForURL(/results/);
  }

  async navigateToFacilities() {
    await this.navFacilities.click();
    await this.page.waitForURL(/facilities/);
  }
}
