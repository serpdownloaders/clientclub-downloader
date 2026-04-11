// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  retries: 1,
  use: {
    headless: true,
    ignoreHTTPSErrors: true,
    ...devices['Desktop Chrome'],
    video: 'off',
    screenshot: 'only-on-failure',
    storageState: process.env.PLAYWRIGHT_STORAGE_STATE || undefined,
  },
  reporter: [['list'], ['json', { outputFile: 'packagist-results.json' }]],
});
