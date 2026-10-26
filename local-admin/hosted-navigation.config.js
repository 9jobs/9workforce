import base from './workflow.config.js';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testMatch:'hosted-navigation.spec.js',webServer:{...base.webServer,command:'node tests/hosted-ui-server.mjs'}});
