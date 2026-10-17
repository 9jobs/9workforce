import {test,expect} from '@playwright/test';
import http from 'node:http';
import {mkdirSync,mkdtempSync} from 'node:fs';
import {createAccountAuth} from '../lib/accountAuth.js';
import {DatabaseSync} from 'node:sqlite';
import path from 'node:path';

test('register from a protected form, return there, keep email private, and open either flow',async({page})=>{
  mkdirSync('scratch',{recursive:true});
  // Real auth/database with an isolated test account; no SMTP credentials means
  // this repeatable browser check does not email the support inbox.
  const auth=await createAccountAuth(mkdtempSync('scratch/account-flow-'),{});
  const server=http.createServer((req,res)=>auth.handler(req,res));
  await new Promise(resolve=>server.listen(3019,'127.0.0.1',resolve));
  try{
    await page.route('**/api/auth/**',async route=>{
      const request=route.request();
      const target=new URL(request.url());
      const response=await route.fetch({url:`http://localhost:3019${target.pathname}${target.search}`,headers:{...request.headers(),host:'localhost:3019',origin:'http://localhost:3019'}});
      await route.fulfill({response});
    });
    await page.setViewportSize({width:1440,height:1000});
    await page.goto('/');
    await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Looking for Hire',exact:true}).click();
    await expect(page).toHaveURL(/\/looking-for-hire$/);
    await expect(page.getByRole('heading',{name:'The right support. A stronger site.'})).toBeVisible();
    await expect(page.getByRole('form',{name:'Request construction workers'})).toHaveCount(0);
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.getByRole('heading',{name:"Let's build your workforce."}).scrollIntoViewIfNeeded();
    await expect(page.locator('.hire-entry-main>p')).toHaveCSS('opacity','1');
    await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:'scratch/hire-page-desktop.png',fullPage:true});
    await page.setViewportSize({width:390,height:844});
    await expect(page.getByRole('navigation',{name:'Main navigation'})).not.toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:'scratch/hire-page-mobile.png',fullPage:true});
    await page.locator('.hire-actions').getByRole('link',{name:'Request Workers',exact:true}).click();
    await expect(page).toHaveURL(/\/looking-for-hire#hire-request$/);
    await page.locator('.hire-signin-card').getByRole('link',{name:'Sign in / Register',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Welcome back.'})).toBeVisible();
    expect(new URL(page.url()).searchParams.get('next')).toBe('/request-workers');
    await page.locator('.account-mode-switch').getByRole('button',{name:'Register',exact:true}).click();
    await page.getByLabel('Full name').fill('Private Account');
    await page.getByLabel('Email address').fill('private-account@example.com');
    await page.getByLabel('Password',{exact:true}).fill('Example-test-password-42');
    await page.getByRole('checkbox').check();
    await page.getByRole('button',{name:'Create account',exact:true}).click();
    await expect(page).toHaveURL(/\/request-workers$/);
    await expect(page.getByRole('heading',{name:'Build your workforce.'})).toBeVisible();
    await page.goto('/register');
    await expect(page.getByRole('heading',{name:'Choose your next step.'})).toBeVisible();
    await expect(page.locator('.account-card')).not.toContainText('private-account@example.com');
    await expect(page.locator('.account-card')).not.toContainText('Private Account');
    await expect(page.locator('.account-brand img')).toHaveAttribute('src','/assets/9workforce-footer-logo.webp');
    await page.screenshot({path:'scratch/account-simple-choices.png'});
    await page.locator('.account-choices').getByRole('link',{name:/Register for Work/}).click();
    await expect(page).toHaveURL(/\/find-work#register$/);
    await page.goto('/register');
    await page.locator('.account-choices').getByRole('link',{name:/Request Workers/}).click();
    await expect(page).toHaveURL(/\/request-workers$/);
    await page.goto('/register');
    await page.setViewportSize({width:390,height:844});
    await expect(page.getByRole('heading',{name:'Choose your next step.'})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.locator('.account-card').scrollIntoViewIfNeeded();
    await page.screenshot({path:'scratch/account-simple-choices-mobile.png'});
    await page.getByRole('button',{name:'Sign out',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Create your account.'})).toBeVisible();
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('hero and direct worker forms require login, then return to the chosen form',async({page})=>{
  const db=new DatabaseSync('data/accounts.sqlite',{readOnly:true});
  const user=db.prepare("SELECT email FROM user WHERE name='Local Test' AND email LIKE 'local-account-%@example.com' ORDER BY createdAt DESC LIMIT 1").get();db.close();
  test.skip(!user,'An existing local test account is required');
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('/');
  await expect(page.locator('.header-actions .nav-work')).toHaveCount(0);
  await page.locator('.homepage-hero-actions').getByRole('link',{name:/Register for workers/}).click();
  await expect(page.getByRole('heading',{name:'Welcome back.'})).toBeVisible();
  expect(new URL(page.url()).searchParams.get('next')).toBe('/find-work#register');
  for(const form of ['workerRegistration','workerRequest','roleApplication']){
    const response=await page.request.post('/api/submissions',{data:{type:'contact',fields:{applicationForm:form}}});
    expect(response.status()).toBe(401);
  }
  await page.getByLabel('Email address').fill(user.email);
  await page.getByLabel('Password',{exact:true}).fill('Local-test-password-42');
  await page.locator('.account-card form').getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page).toHaveURL(/\/find-work#register$/);
  await page.locator('.worker-form input[name="fullName"]').fill('Editable signed-in form');
  const validation=await page.request.post('/api/submissions',{data:{type:'contact',fields:{applicationForm:'workerRequest'}}});
  expect(validation.status()).toBe(400);
  await page.goto('/request-workers');
  await expect(page.getByRole('heading',{name:'Build your workforce.'})).toBeVisible();
  await page.goto('/register');
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  const role='/find-work/general-construction-labourers/apply?location=Melbourne';
  await page.goto(role);
  await expect(page.getByRole('heading',{name:'Welcome back.'})).toBeVisible();
  expect(new URL(page.url()).searchParams.get('next')).toBe(role);
});

test('Google-only account can set a password through a single-use email link',async({page})=>{
  const root=mkdtempSync('scratch/password-flow-');
  let resetUrl;
  const auth=await createAccountAuth(root,{}, {sendResetPassword:async({url})=>{resetUrl=url;}});
  const db=new DatabaseSync(path.join(root,'data/accounts.sqlite'));
  const now=new Date().toISOString();
  db.prepare('INSERT INTO user (id,name,email,emailVerified,createdAt,updatedAt) VALUES (?,?,?,?,?,?)').run('google-test','Google Test','google-only@example.com',1,now,now);
  db.prepare('INSERT INTO account (id,accountId,providerId,userId,createdAt,updatedAt) VALUES (?,?,?,?,?,?)').run('google-account','google-test-sub','google','google-test',now,now);
  const server=http.createServer((req,res)=>auth.handler(req,res));
  await new Promise(resolve=>server.listen(3019,'127.0.0.1',resolve));
  try{
    await page.route('**/api/auth/**',async route=>{
      const request=route.request();const target=new URL(request.url());
      const response=await route.fetch({url:`http://localhost:3019${target.pathname}${target.search}`,headers:{...request.headers(),host:'localhost:3019',origin:'http://localhost:3019'}});
      await route.fulfill({response});
    });
    await page.goto('/register?mode=signin');
    await page.getByLabel('Email address').fill('google-only@example.com');
    await page.getByLabel('Password',{exact:true}).fill('New-test-password-42');
    await page.locator('form').getByRole('button',{name:'Sign in',exact:true}).click();
    await expect(page.getByRole('alert')).toContainText('Registered with Google?');
    await page.getByRole('button',{name:'Forgot / set password via email'}).click();
    await expect(page.getByRole('status')).toContainText('secure password link');
    await expect.poll(()=>Boolean(resetUrl)).toBe(true);
    const callback=await page.request.get(resetUrl,{maxRedirects:0});
    const destination=new URL(callback.headers().location,'http://localhost:3001');
    await page.goto(`/register${destination.search}`);
    await expect(page.getByRole('heading',{name:'Set your password.'})).toBeVisible();
    await page.getByLabel('Password',{exact:true}).fill('New-test-password-42');
    await page.getByRole('button',{name:'Save password'}).click();
    await expect(page.getByRole('status')).toContainText('Password updated.');
    await page.getByLabel('Email address').fill('google-only@example.com');
    await page.getByLabel('Password',{exact:true}).fill('New-test-password-42');
    await page.locator('form').getByRole('button',{name:'Sign in',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Choose your next step.'})).toBeVisible();
    const token=destination.searchParams.get('token');
    const reuse=await page.request.post('http://localhost:3019/api/auth/reset-password',{headers:{Origin:'http://localhost:3019'},data:{token,newPassword:'Another-test-password-42'}});
    expect(reuse.ok()).toBe(false);
  }finally{db.close();await new Promise(resolve=>server.close(resolve));}
});
