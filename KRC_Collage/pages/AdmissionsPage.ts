import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * AdmissionsPage — covers /admissions
 */
export class AdmissionsPage extends BasePage {
  readonly pageHeading: Locator;
  readonly admissionForm: Locator;
  readonly nameField: Locator;
  readonly phoneField: Locator;
  readonly emailField: Locator;
  readonly messageField: Locator;
  readonly submitButton: Locator;
  readonly courseField: Locator;
  readonly enquirySection: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading    = page.getByRole('heading').first();
    this.admissionForm  = page.locator('form').first();
    this.nameField      = page.getByRole('textbox', { name: /name/i }).first();
    this.phoneField     = page.getByRole('textbox', { name: /phone|mobile/i }).first();
    this.emailField     = page.getByRole('textbox', { name: /email/i }).first();
    this.messageField   = page.getByRole('textbox', { name: /message|query/i }).first();
    this.submitButton   = page.getByRole('button', { name: /submit|apply|enquire/i });
    this.courseField    = page.locator('select').first();
    this.enquirySection = page.locator('section, div').filter({ hasText: /admission|enquiry/i }).first();
  }

  async open() {
    await this.goto('/admissions');
  }

  async verifyPageLoaded() {
    await this.verifyURL('/admissions');
    await expect(this.pageHeading).toBeVisible();
  }

  async fillEnquiryForm(data: {
    name: string;
    phone: string;
    email: string;
    course?: string;
    message?: string;
  }) {
    if (await this.nameField.isVisible())
      await this.nameField.fill(data.name);
    if (await this.phoneField.isVisible())
      await this.phoneField.fill(data.phone);
    if (await this.emailField.isVisible())
      await this.emailField.fill(data.email);
    if (data.course && await this.courseField.isVisible())
      await this.courseField.selectOption(data.course);
    if (data.message && await this.messageField.isVisible())
      await this.messageField.fill(data.message);
  }

  async submitEnquiryForm() {
    await this.submitButton.click();
  }

  async verifyFormPresent() {
    await expect(this.admissionForm).toBeVisible();
  }
}
