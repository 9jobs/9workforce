import base from './workflow.config.js';
import {defineConfig} from '@playwright/test';
export default defineConfig({...base,testMatch:'submission-notifications.spec.js'});
