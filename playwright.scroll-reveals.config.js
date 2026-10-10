import config from './playwright.config.js';
export default {...config,testMatch:'scroll-reveals.spec.js',timeout:120000,outputDir:'scratch/scroll-reveals-results'};
