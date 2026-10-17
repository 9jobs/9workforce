import config from './playwright.config.js';
export default {...config,testMatch:'brand-theme.spec.js',timeout:90000,outputDir:'scratch/brand-test-results',use:{...config.use,reducedMotion:'reduce'}};
