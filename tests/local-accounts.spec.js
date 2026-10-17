import {test,expect} from '@playwright/test';

test('construction model animates beside the form and pauses for reduced motion',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.goto('/register');
  await expect(page.getByRole('heading',{name:'Create your account.'})).toBeVisible();
  const scene=page.locator('.account-construction');
  await expect(scene).toHaveAttribute('data-renderer','webgl');
  await expect(page.locator('.account-globe')).toHaveCount(0);
  const before=await scene.getAttribute('data-progress');
  await expect.poll(()=>scene.getAttribute('data-progress')).not.toBe(before);
  await expect(page.locator('.account-card')).toHaveCSS('background-color','rgb(255, 255, 255)');
  await page.screenshot({path:'scratch/account-construction-desktop.png'});
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(scene).toHaveAttribute('data-motion','paused');
  const paused=await scene.getAttribute('data-progress');
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  expect(await scene.getAttribute('data-progress')).toBe(paused);
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'scratch/account-construction-mobile.png',fullPage:true});
});

test('register, persist a session, sign out, reject a wrong password and sign back in',async({page})=>{
  test.skip(process.env.SKIP_SIGNUP_EMAIL==='1','Real notification delivery is covered by the dedicated live registration check');
  const email=`local-account-${Date.now()}@example.com`;
  const password='Local-test-password-42';
  await page.goto('/');
  await page.locator('.header-actions').getByRole('link',{name:'Register',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Create your account.'})).toBeVisible();
  const config=await (await page.request.get('/api/account/config')).json();
  if(!config.googleEnabled){
    await page.getByRole('button',{name:'Sign in with Google',exact:true}).click();
    await expect(page.getByRole('alert')).toContainText('not configured');
  }
  await page.getByLabel('Full name').fill('Local Test');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password',{exact:true}).fill(password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Continue to sign in.');
  await page.getByLabel('Password',{exact:true}).fill(password);
  await page.locator('.account-card form').getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Choose your next step.'})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading',{name:'Choose your next step.'})).toBeVisible();
  await expect(page.locator('.header-actions').getByRole('link',{name:'My Account'})).toBeVisible();
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await page.locator('.account-mode-switch').getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Welcome back.'})).toBeVisible();
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password',{exact:true}).fill('Wrong-password-42');
  await page.locator('.account-card form').getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByLabel('Password',{exact:true}).fill(password);
  await page.locator('.account-card form').getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Choose your next step.'})).toBeVisible();
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
});

test('configured Google button starts OAuth with the correct localhost callback',async({page})=>{
  const config=await (await page.request.get('/api/account/config')).json();
  test.skip(!config.googleEnabled,'Google OAuth credentials are not configured');
  // Keep this repeatable check at the provider boundary; live Google sign-in is
  // checked separately without automating personal account login or consent.
  await page.route('https://accounts.google.com/**',route=>route.fulfill({contentType:'text/html',body:'<h1>Google sign-in started</h1>'}));
  // OAuth must use a top-level server redirect even if client API fetches fail.
  await page.route('**/api/account/config',route=>route.abort());
  await page.route('**/api/auth/sign-in/social',route=>route.abort());
  await page.goto('/register');
  await page.getByRole('button',{name:'Sign in with Google',exact:true}).click();
  await page.waitForURL(url=>url.hostname==='accounts.google.com');
  const url=new URL(page.url());
  expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3001/api/auth/callback/google');
  expect(url.searchParams.get('code_challenge_method')).toBe('S256');
  expect(url.searchParams.get('state')).toBeTruthy();
});

test('mobile registration fits the screen and navigation opens registration',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await page.getByRole('button',{name:'Open navigation'}).click();
  await expect(page.locator('.nav-mobile-actions').getByRole('link',{name:/Register for Work/})).toHaveCount(0);
  await page.locator('.nav-mobile-actions').getByRole('link',{name:'Register Start your journey',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Create your account.'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:'scratch/account-mobile.png',fullPage:true});
});
