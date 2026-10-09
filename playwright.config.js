import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'construction-journey.spec.js',
  timeout: 45000,
  workers: 1,
  use: {
    baseURL: process.env.PREVIEW_URL || 'http://127.0.0.1:3001',
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge',
    headless: true,
    screenshot: 'only-on-failure',
  },
  reporter: 'list',
  outputDir: 'scratch/construction-test-results',
});
