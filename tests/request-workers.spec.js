import {test,expect} from '@playwright/test';
const fill=async form=>{
  await form.getByLabel('Name',{exact:true}).fill('Local Preview Test');
  await form.getByLabel('Company',{exact:true}).fill('[LOCAL TEST] 9Workforce form verification');
  await form.getByLabel('Mobile',{exact:true}).fill('0400000000');
  await form.getByLabel('Email',{exact:true}).fill('support@9workforce.com.au');
  await form.getByRole('button',{name:'CONTINUE'}).click();
  await form.getByLabel('Site suburb / location').fill('Melbourne - local preview test');
  await form.getByLabel('Workers required').selectOption('General Labourers');
  await form.getByLabel('How many workers?').fill('2');
  await form.getByLabel('Start date').fill('2026-10-12');
  await form.getByLabel('What do you need?').fill('[LOCAL TEST ONLY] Verify the new Request Workers form and email delivery. No workers are requested; please disregard this test enquiry.');
};

test('new request page matches fields, is responsive and leaves contact page intact',async({page})=>{
  for(const width of [1440,768,390,320]) {
    await page.setViewportSize({width,height:1000});await page.goto('/request-workers');
    const form=page.getByRole('form',{name:'Request construction workers'});
    await expect(form).toBeVisible();
    expect(await form.locator('input,select,textarea').evaluateAll(es=>es.map(e=>e.name))).toEqual(['fullName','company','email','phone','siteLocation','workersRequired','workerCount','startDate','requirements']);
    await expect(form.getByLabel('Name',{exact:true})).toBeVisible();
    await expect(form.getByLabel('Site suburb / location')).toBeHidden();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:`scratch/request-workers-${width}.png`,fullPage:true});
    await fill(form);
    await expect(form.getByLabel('Site suburb / location')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:`scratch/request-workers-step2-${width}.png`,fullPage:true});
  }
  await page.goto('/');await page.getByRole('link',{name:'REQUEST WORKERS',exact:true}).filter({visible:true}).first().click();
  await expect(page).toHaveURL(/\/request-workers$/);
  await page.goto('/contact');await expect(page.getByRole('form',{name:'Contact enquiry'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Contact us.'})).toBeVisible();
});

test('required fields, failure retry and successful mocked submission',async({page})=>{
  let requests=0,payload;
  await page.route('**/api/submissions',async route=>{requests++;payload=route.request().postDataJSON();await route.fulfill({status:requests===1?500:200,contentType:'application/json',body:JSON.stringify(requests===1?{error:'Unable to send test request'}:{ok:true})})});
  await page.goto('/request-workers');const form=page.getByRole('form',{name:'Request construction workers'});
  await form.getByRole('button',{name:'CONTINUE'}).click();expect(requests).toBe(0);
  await expect(form.getByLabel('Name',{exact:true})).toBeVisible();
  await fill(form);
  await expect(form.getByLabel('Name',{exact:true})).toBeHidden();
  await form.getByRole('button',{name:'Back',exact:true}).click();
  await expect(form.getByLabel('Company',{exact:true})).toHaveValue('[LOCAL TEST] 9Workforce form verification');
  await form.getByRole('button',{name:'CONTINUE'}).click();
  await expect(form.getByLabel('Site suburb / location')).toHaveValue('Melbourne - local preview test');
  await form.getByRole('button',{name:'GET MY WORKFORCE'}).click();
  await expect(page.getByRole('alert')).toHaveText('Unable to send test request');
  await expect(form.getByLabel('Company',{exact:true})).toHaveValue('[LOCAL TEST] 9Workforce form verification');
  await form.getByRole('button',{name:'GET MY WORKFORCE'}).click();await expect(page.getByRole('heading',{name:'Request received.'})).toBeVisible();
  expect(payload.type).toBe('contact');expect(payload.fields.applicationForm).toBe('workerRequest');expect(payload.fields.workerCount).toBe('2');
});

test('server rejects invalid worker requests before sending email',async({request})=>{
  const response=await request.post('/api/submissions',{data:{type:'contact',fields:{email:'test@example.com',applicationForm:'workerRequest'}}});
  expect(response.status()).toBe(400);expect((await response.json()).error).toContain('required');
});

test('live labelled test request is accepted after database save and SMTP delivery',async({page})=>{
  test.skip(process.env.TEST_LIVE_EMAIL !== '1', 'Live email checks are opt-in to avoid sending repeated test enquiries.');
  await page.goto('/request-workers');const form=page.getByRole('form',{name:'Request construction workers'});await fill(form);
  const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/submissions')&&r.request().method()==='POST');
  await form.getByRole('button',{name:'GET MY WORKFORCE'}).click();const response=await responsePromise;
  const result=await response.json();console.log(JSON.stringify({liveRequestStatus:response.status(),result}));
  expect(response.status()).toBe(200);expect(result.ok).toBe(true);
  await expect(page.getByRole('heading',{name:'Request received.'})).toBeVisible();
});
