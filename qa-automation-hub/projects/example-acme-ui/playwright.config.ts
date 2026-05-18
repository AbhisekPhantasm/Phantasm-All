import { defineConfig, devices } from '@playwright/test';
import { getBrowserFromEnv, isHeadedFromEnv } from '@qa-hub/shared-core';

const browser = getBrowserFromEnv();
const headed = isHeadedFromEnv();

const browserProjects =
  browser === 'firefox'
    ? [{ name: 'firefox', use: { ...devices['Desktop Firefox'] } }]
    : browser === 'webkit'
      ? [{ name: 'webkit', use: { ...devices['Desktop Safari'] } }]
      : [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }];

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? Number(process.env.PW_WORKERS ?? 4) : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    [
      'allure-playwright',
      {
        detail: true,
        outputFolder: 'allure-results',
        suiteTitle: false,
      },
    ],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://playwright.dev',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: !headed,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: browserProjects,
});
