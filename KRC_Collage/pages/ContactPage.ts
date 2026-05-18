import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * ContactPage — covers /Contact-us
 */
export class ContactPage extends BasePage {
  readonly pageHeading: Locator;
  readonly contactForm: Locator;
  readonly nameField: Locator;
  readonly emailField: Locator;
  readonly phoneField: Locator;
  readonly messageField: Locator;
  readonly submitButton: Locator;
  readonly addressText: Locator;
  readonly phoneLink: Locator;
  readonly emailLink: Locator;
  readonly courseField: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading  = page.getByRole('heading').first();
    this.contactForm  = page.locator('form').first();
    this.nameField    = page.getByRole('textbox', { name: /name/i }).first();
    this.emailField   = page.getByRole('textbox', { name: /email/i }).first();
    this.phoneField   = page.getByRole('textbox', { name: /phone|mobile/i }).first();
    this.messageField = page.getByRole('textbox', { name: /message/i }).first();
    this.submitButton = page.getByRole('button', { name: /send|submit/i });
    this.addressText  = page.getByText(/Kanuru|Dedipya Road/i).first();
    this.phoneLink    = page.getByRole('link', { name: /98485 48321/ });
    this.emailLink    = page.getByRole('link', { name: /krcvijayawada5/i });
    this.courseField   = page.locator('select').first();
  }

  async open() {
    await this.goto('/Contact-us');
  }

  async verifyPageLoaded() {
    await this.verifyURL('/Contact-us');
    await expect(this.pageHeading).toBeVisible();
  }

  async verifyContactInfoVisible() {
    await expect(this.phoneLink).toBeVisible();
    await expect(this.emailLink).toBeVisible();
    await expect(this.addressText).toBeVisible();
  }

  async fillContactForm(data: {
    name: string;
    email: string;
    phone?: string;
    course?: string;
    message: string;
  }) {
    if (await this.nameField.isVisible())
      await this.nameField.fill(data.name);
    if (await this.emailField.isVisible())
      await this.emailField.fill(data.email);
    if (data.phone && await this.phoneField.isVisible())
      await this.phoneField.fill(data.phone);
    if (data.course && await this.courseField.isVisible())
      await this.courseField.selectOption(data.course);
    if (await this.messageField.isVisible())
      await this.messageField.fill(data.message);
  }

  async submitContactForm() {
    await this.submitButton.click();
  }

  async verifyPhoneLinkNavigates() {
    const href = await this.phoneLink.getAttribute('href');
    expect(href).toContain('tel:');
  }

  async verifyEmailLinkNavigates() {
    const href = await this.emailLink.getAttribute('href');
    expect(href).toContain('mailto:');
  }
}
