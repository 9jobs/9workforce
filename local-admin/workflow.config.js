import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',testMatch:'workflow.spec.js',workers:1,timeout:60000,use:{baseURL:'http://127.0.0.1:3003',channel:'msedge',headless:true,viewport:{width:1440,height:1000}},webServer:{command:'node tests/ui-server.mjs',url:'http://127.0.0.1:3003',reuseExistingServer:false},outputDir:'./test-results',reporter:'list'});
