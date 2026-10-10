import config from './playwright.config.js';
export default {...config,testMatch:'responsive.spec.js',timeout:90000,outputDir:'scratch/responsive-test-results',use:{...config.use,reducedMotion:'reduce'}};
