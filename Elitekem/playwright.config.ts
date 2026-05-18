import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  workers: 1,

  // Optimized timeout for fast execution
  timeout: 180_000,

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['allure-playwright'],
  ],

  use: {
    baseURL: 'https://elitekem.com',

    // Record video at Full HD 1920x1080 resolution
    video: {
      mode: 'on',
      size: { width: 1920, height: 1080 },
    },

    // Take screenshots automatically
    screenshot: 'on',

    // Trace on failure
    trace: 'retain-on-failure',

    // Force strict Desktop emulation
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,

    launchOptions: {
      slowMo: 0,
    },

    actionTimeout: 20_000,
    navigationTimeout: 40_000,
  },

  outputDir: 'test-results',

  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
      },
    },
  ],
});
