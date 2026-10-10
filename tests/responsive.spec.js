import {test,expect} from '@playwright/test';

test('work search cards and complete titles fit small phones through wide desktops',async({page})=>{
  for(const width of [320,360,390,600,1024,1440,2560,3840]){
    await page.setViewportSize({width,height:844});await page.goto('/work-search');
    await page.evaluate(()=>document.fonts.ready);
    const cards=page.locator('.home-search-result-list article');
    const geometry=await cards.evaluateAll(elements=>elements.map(e=>({right:e.getBoundingClientRect().right,width:e.offsetWidth,parent:e.parentElement.clientWidth,titleFits:e.querySelector('h2').scrollWidth<=e.querySelector('h2').clientWidth+1})));
    expect(geometry.every(e=>e.right<=width+1&&e.width<=e.parent&&e.titleFits),String(width)).toBe(true);
  }
});

test('landscape tablets keep the home search and support highlights inside their containers',async({page})=>{
  for(const width of [900,1024,1100,1180,1200]){
    await page.setViewportSize({width,height:768});await page.goto('/');await page.evaluate(()=>document.fonts.ready);
    expect(await page.locator('.home-search-form').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length)).toBe(2);
    await page.locator('.solutions-intro').scrollIntoViewIfNeeded();await page.waitForTimeout(700);
    expect(await page.locator('.solutions-highlights strong,.solutions-highlights small').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().left>=0&&e.getBoundingClientRect().right<=innerWidth))).toBe(true);
    await expect(page.locator('.home-search-submit').first()).toContainText('Find Construction Work');
  }
});

test('calendar remains fully reachable in portrait and short landscape viewports',async({page})=>{
  for(const [width,height] of [[320,667],[667,375],[844,390]]){
    await page.setViewportSize({width,height});await page.goto('/employers');
    const trigger=page.getByRole('button',{name:'Available start date',exact:true});
    await trigger.scrollIntoViewIfNeeded();await page.waitForTimeout(200);await trigger.click();
    const calendar=page.locator('.premium-calendar');await expect(calendar).toBeVisible();
    const bounds=await calendar.boundingBox();expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);expect(bounds.y+bounds.height).toBeLessThanOrEqual(height);
    const today=calendar.getByRole('button',{name:'Today',exact:true});await today.scrollIntoViewIfNeeded();await today.click();
    await expect(calendar).toHaveCount(0);
    expect(await page.locator('input[name="availableStartDate"]').inputValue()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  }
});

test('mobile menu stays accessible in short landscape and closes on navigation',async({page})=>{
  for(const [width,height] of [[320,568],[667,375],[1024,600]]){
    await page.setViewportSize({width,height});await page.goto('/contact');
    await page.getByRole('button',{name:'Open navigation',exact:true}).click();
    const nav=page.locator('.site-header nav.open');await expect(nav).toBeVisible();
    const bounds=await nav.boundingBox();expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);expect(bounds.y+bounds.height).toBeLessThanOrEqual(height);
    await nav.getByRole('link',{name:'Join Our Crew',exact:true}).click();
    await expect(page).toHaveURL(/\/find-work$/);await expect(page.locator('.site-header nav.open')).toHaveCount(0);
  }
});

test('all candidate application stages, address suggestions and uploads fit small screens',async({page})=>{
  await page.route('**/api/locations**',route=>route.fulfill({json:{results:[{label:'Melbourne, VIC, Australia'}]}}));
  await page.route('**/api/submissions',route=>route.fulfill({json:{ok:true}}));
  for(const [width,height] of [[320,667],[844,390],[1024,768]]){
    await page.setViewportSize({width,height});await page.goto('/find-work/formwork-and-concrete-labourers/apply');
    const form=page.locator('.application-form');
    await form.locator('[name="fullName"]').fill('Responsive Test');
    await form.locator('[name="phone"]').fill('0412345678');
    await form.locator('[name="email"]').fill('responsive@example.com');
    await form.getByRole('button',{name:'Continue',exact:true}).click();
    await page.getByRole('combobox',{name:'Enter your Address',exact:true}).fill('Mel');
    await page.getByRole('option',{name:'Melbourne, VIC, Australia'}).click();
    await form.locator('[name="experienceTickets"]').fill('White Card and site experience');
    await form.getByRole('button',{name:'Continue',exact:true}).click();
    const file={name:'Construction-experience-and-qualifications-'.repeat(3)+'CV.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\nLocal responsive test')};
    await form.locator('[name="resume"]').setInputFiles(file);
    await form.locator('[name="coverLetter"]').setInputFiles({...file,name:'Cover-letter.pdf'});
    const bounds=await form.locator('label:visible,.application-upload b:visible').evaluateAll(elements=>elements.map(e=>({left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,clipped:e.scrollWidth>e.clientWidth+1})));
    expect(bounds.every(e=>e.left>=0&&e.right<=width&&!e.clipped),String(width)).toBe(true);
    await form.getByRole('button',{name:'Submit application',exact:true}).click();
    await expect(page.locator('.application-received-page')).toBeVisible();
  }
});
