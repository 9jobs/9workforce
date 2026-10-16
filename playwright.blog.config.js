import config from './playwright.config.js';
export default {...config,testMatch:'blog.spec.js',outputDir:'scratch/blog-test-results',use:{...config.use,baseURL:process.env.PREVIEW_URL||'http://localhost:3000',channel:process.env.PLAYWRIGHT_CHANNEL||'chrome'}};
