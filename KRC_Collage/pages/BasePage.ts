import { Page, Locator, expect } from '@playwright/test';

/**
 * BasePage — shared locators and actions available across all KRC pages.
 */
export class BasePage {
  readonly page: Page;

  // ── Navigation ────────────────────────────────────────────────────────
  readonly navHome: Locator;
  readonly navAbout: Locator;
  readonly navIITJEE: Locator;
  readonly navResults: Locator;
  readonly navFacilities: Locator;
  readonly navAdmissions: Locator;
  readonly navBlog: Locator;
  readonly navContactUs: Locator;

  // ── Footer ────────────────────────────────────────────────────────────
  readonly footerPhone: Locator;
  readonly footerEmail: Locator;
  readonly footerCopyright: Locator;
  readonly logo: Locator;

  constructor(page: Page) {
    this.page = page;

    this.navHome        = page.getByRole('link', { name: 'Home' }).first();
    this.navAbout       = page.getByRole('link', { name: 'About Us' }).first();
    this.navIITJEE      = page.getByRole('link', { name: 'IIT-JEE Academy' }).first();
    this.navResults     = page.getByRole('link', { name: 'Results' }).first();
    this.navFacilities  = page.getByRole('link', { name: 'Facilities' }).first();
    this.navAdmissions  = page.getByRole('link', { name: 'Admissions' }).first();
    this.navBlog        = page.getByRole('link', { name: 'Blog' }).first();
    this.navContactUs   = page.getByRole('link', { name: 'Contact Us' }).first();

    this.footerPhone     = page.getByRole('link', { name: /98485 48321/ });
    this.footerEmail     = page.getByRole('link', { name: /krcvijayawada5@gmail\.com/ });
    this.footerCopyright = page.getByText(/Krishna Reddy Chaitanya All Rights Reserved/);
    this.logo            = page.getByRole('img', { name: /KRC Logo/ }).first();
  }

  /** Navigate to a given path */
  async goto(path: string = '/') {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  /** Verify all primary nav links are visible */
  async verifyNavLinksVisible() {
    for (const link of [
      this.navHome, this.navAbout, this.navIITJEE, this.navResults,
      this.navFacilities, this.navAdmissions, this.navBlog, this.navContactUs,
    ]) {
      await expect(link).toBeVisible();
    }
  }

  /** Verify footer is rendered with contact info */
  async verifyFooter() {
    await expect(this.footerPhone).toBeVisible();
    await expect(this.footerEmail).toBeVisible();
    await expect(this.footerCopyright).toBeVisible();
  }

  /** Verify the KRC logo is visible */
  async verifyLogo() {
    await expect(this.logo).toBeVisible();
  }

  /** Verify the page title contains expected text */
  async verifyTitle(expectedText: string) {
    await expect(this.page).toHaveTitle(new RegExp(expectedText, 'i'));
  }

  /** Verify the page URL contains expected path */
  async verifyURL(expectedPath: string) {
    await expect(this.page).toHaveURL(new RegExp(expectedPath));
  }
}
