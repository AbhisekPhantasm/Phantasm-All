import type { Page, Locator } from '@playwright/test';

/**
 * Base Page Object — extend per application page.
 * Keep assertions out of POM (prefer spec `expect`), unless your org standard differs.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  protected byTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }
}
