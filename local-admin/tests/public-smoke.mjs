import {createServer} from 'vite';
import {chromium,expect} from '@playwright/test';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const server=await createServer({configFile:false,root,server:{host:'127.0.0.1',port:3004,strictPort:true}});
await server.listen();let browser;
try{
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 // Existing public UI is exercised with a mocked signed-in session; no real submission or external auth request is made.
 await page.route('**/api/auth/get-session',route=>route.fulfill({json:{user:{id:'public-smoke-user',name:'Public Smoke',email:'smoke@example.test',emailVerified:true},session:{id:'public-smoke-session',userId:'public-smoke-user',expiresAt:'2099-01-01T00:00:00.000Z'}}}));
 await page.route('**/api/account/config',route=>route.fulfill({json:{googleEnabled:true}}));
 await page.route('**/api/submissions',route=>route.abort());
 for(const route of ['/','/who-we-are','/labour-hire','/looking-for-hire','/industries','/contact','/blog','/privacy-policy']){
  await page.goto('http://127.0.0.1:3004'+route);await expect(page.locator('header').first()).toBeVisible();await expect(page.locator('h1').first()).toBeVisible();console.log('PASS public route',route);
 }
 await page.goto('http://127.0.0.1:3004/request-workers');const form=page.getByRole('form',{name:'Request construction workers'});await expect(form).toBeVisible();expect(await form.locator('input,select,textarea').evaluateAll(nodes=>nodes.map(n=>n.name))).toEqual(['fullName','company','email','phone','siteLocation','workersRequired','workerCount','startDate','requirements']);console.log('PASS existing employer request form fields');
 await page.goto('http://127.0.0.1:3004/find-work');await expect(page.locator('input[name=fullName]')).toBeAttached();await expect(page.locator('input[name=resume]')).toBeAttached();await expect(page.locator('select[name=workCategory]')).toBeAttached();console.log('PASS existing worker registration fields');
 await page.unroute('**/api/auth/get-session');await page.route('**/api/auth/get-session',route=>route.fulfill({json:null}));await page.goto('http://127.0.0.1:3004/register?mode=signin');await expect(page.getByRole('heading',{name:'Welcome back.'})).toBeVisible();await expect(page.getByRole('button',{name:'Sign in with Google'})).toBeVisible();console.log('PASS existing login and Google button');
 expect(errors).toEqual([]);console.log('PASS public smoke: no browser errors; no form writes or production connections');
}finally{await browser?.close();await server.close();}

