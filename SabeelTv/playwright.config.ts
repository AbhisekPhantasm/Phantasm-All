import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: 1800000, // 30 minutes global timeout for comprehensive E2E tests
  testDir: './test',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on filesystem. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['allure-playwright', { outputFolder: 'allure-results' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://31.97.61.59:3010/',

    /* Collect trace when retrying a failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Set fixed viewport to ensure Desktop layout and prevent mobile/tablet views */
    viewport: { width: 1920, height: 1080 },

    /* Video recording for all tests */
    video: {
      mode: 'on',
    },

    /* Screenshot for all tests */
    screenshot: 'on',
    headless: process.env.HEADED !== '1',

    /* Force the physical window size to match desktop resolution and ignore high-DPI display scaling to avoid responsive/mobile layout collapsing */
    launchOptions: {
      args: [
        '--window-size=1920,1080',
        '--force-device-scale-factor=1'
      ]
    },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1920, height: 1080 },

        isMobile: false,
        hasTouch: false,
      },
    },
  ],
});
