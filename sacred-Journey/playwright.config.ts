import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Config for Sacred Journey Automation
 * Requirements: 1280x720 viewport, headed mode, Allure integration, full-screen video.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 2, // Increased to 2 for 2x speed


  // ── Allure Reporting Integration ──────────────────────────────────────────
  reporter: [
    ['html'],
    ['allure-playwright', { 
      outputFolder: 'allure-results',
      detail: true,
      suiteTitle: true
    }]
  ],

  use: {
    baseURL: 'http://31.97.61.59:7004',
    
    // Headed locally when HEADED=1 (hub/Jenkins); headless on CI (HEADED unset/0)
    headless: process.env.HEADED !== '1',

    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    
    // ── Screenshots & Video ──────────────────────────────────────────────────
    screenshot: 'on',
    video: {
      mode: 'on',
      size: { width: 1280, height: 720 } // Resolution 1280x720
    },

    // ── Viewport matches Video Resolution ────────────────────────────────────
    viewport: { width: 1280, height: 720 },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});