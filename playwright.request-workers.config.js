import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'request-workers.spec.js',
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: process.env.PREVIEW_URL || 'http://localhost:3000',
    channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge',
    headless: true,
    reducedMotion: 'reduce',
  },
  outputDir: 'scratch/request-workers-results',
  reporter: 'list',
});
