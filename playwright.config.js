// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,          // 60s per test (AI API calls are slow)
  retries: process.env.CI ? 2 : 0,  // retry twice in CI, zero locally
  workers: 1,               // run sequentially — API rate limits
  reporter: [
    ['list'],               // console output
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',  // saves screenshot on failure
    video: 'retain-on-failure',     // saves video on failure
    trace: 'retain-on-failure',     // saves trace for debugging
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    // CI — Chromium only (fast)
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Full local run — all 3 browsers
    ...(process.env.CI ? [] : [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
      // Mobile viewports
      {
        name: 'mobile-chrome',
        use: { ...devices['Pixel 5'] },
      },
      {
        name: 'mobile-safari',
        use: { ...devices['iPhone 13'] },
      },
    ]),
  ],
});
