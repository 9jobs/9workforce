import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests',testMatch:['local-accounts.spec.js','account-access-flow.spec.js'],workers:1,timeout:45000,
  use:{baseURL:'http://localhost:3001',browserName:'chromium',channel:'msedge',headless:true},
  outputDir:'scratch/account-test-results',reporter:'list',
});
