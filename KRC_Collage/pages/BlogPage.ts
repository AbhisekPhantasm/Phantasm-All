import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * BlogPage — covers /blog
 */
export class BlogPage extends BasePage {
  readonly pageHeading: Locator;
  readonly blogPosts: Locator;
  readonly firstPostLink: Locator;

  constructor(page: Page) {
    super(page);
    this.pageHeading   = page.getByRole('heading').first();
    this.blogPosts     = page.locator('article, [class*="post"], [class*="blog"]');
    this.firstPostLink = page.locator('article a, [class*="post"] a').first();
  }

  async open() {
    await this.goto('/blog');
  }

  async verifyPageLoaded() {
    await this.verifyURL('/blog');
    await expect(this.pageHeading).toBeVisible();
  }

  async getBlogPostCount(): Promise<number> {
    return await this.blogPosts.count();
  }

  async clickFirstBlogPost() {
    if (await this.firstPostLink.isVisible()) {
      await this.firstPostLink.click();
    }
  }
}
