import {test,expect} from '@playwright/test';

const pages=['/','/who-we-are','/industries','/labour-hire','/employers','/find-work','/contact','/request-workers','/work-search','/privacy-policy','/modern-slavery-statement','/workcover-terms','/find-work/formwork-and-concrete-labourers','/find-work/formwork-and-concrete-labourers/apply'];
const protectedNodes='.construction-journey,.labour-orbit-display,.about-coordination-scene,.about-service-coverage,form,.site-header,[role="alert"],[role="status"],[role="dialog"]';

for(const width of [1440,1280,768,390]) {
  test(`all public pages reveal safely at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:950});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    for(const path of pages) {
      await page.goto(path);await page.evaluate(()=>document.fonts.ready);
      await expect.poll(()=>page.locator('[data-scroll-reveal-state]').count()).toBeGreaterThan(0);
      const safety=await page.locator('[data-scroll-reveal-state]').evaluateAll((elements,selector)=>({
        protected:elements.some(element=>element.closest(selector)),
        nested:elements.some(element=>!element.dataset.scrollRevealText&&element.parentElement.closest('[data-scroll-reveal-state]')),
      }),protectedNodes);
      expect(safety,{path,width}).toEqual({protected:false,nested:false});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path).toBe(true);
      // Rapid scrolling must reveal the footer and keep completed nodes visible.
      if(path==='/'){
        await page.locator('.construction-journey').evaluate(e=>e.scrollIntoView());
        await expect(page.locator('.construction-journey')).toHaveAttribute('data-mode',/animated|static/);
        await page.waitForTimeout(150);
        const carousel=page.locator('.labour-orbit');
        await carousel.evaluate(e=>{scrollTo({top:Math.round(scrollY+e.getBoundingClientRect().top+(e.getBoundingClientRect().height-innerHeight)/2),behavior:'instant'});e.focus({preventScroll:true});});
        await page.waitForTimeout(100);await page.keyboard.press('End');await page.mouse.wheel(0,180);
      }
      const footer=page.locator('.site-footer');
      if(await footer.count()){
        await footer.evaluate(e=>e.scrollIntoView({block:'end'}));
        for(const target of await footer.locator('[data-scroll-reveal-state]').all()){
          await target.evaluate(e=>e.scrollIntoView({block:'center'}));
          await expect(target).toHaveAttribute('data-scroll-reveal-state','complete');
        }
        await expect(footer.locator('[data-scroll-reveal-state="pending"]')).toHaveCount(0);
        await expect(footer.locator('[data-scroll-reveal-state="running"]')).toHaveCount(0);
        const complete=footer.locator('[data-scroll-reveal-state="complete"]').first();
        await expect(complete).toBeVisible();
        expect(await complete.evaluate(e=>getComputedStyle(e).opacity)).toBe('1');
      }
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}

test('two columns follow actual desktop positions and switch to fade-up when stacked',async({page})=>{
  await page.setViewportSize({width:1440,height:950});await page.goto('/industries');
  const cards=page.locator('.work-area-photo-card');
  await expect(cards.first().locator('[data-scroll-reveal-variant="right"]')).toHaveCount(1);
  await expect(cards.first().locator('[data-scroll-reveal-variant="left"]')).toHaveCount(1);
  for(const card of await cards.all()){
    const columns=await card.locator('[data-scroll-reveal-variant]:not([data-scroll-reveal-text])').evaluateAll(elements=>elements.map(e=>({left:e.getBoundingClientRect().left,variant:e.dataset.scrollRevealVariant})).sort((a,b)=>a.left-b.left));
    expect(columns.map(column=>column.variant)).toEqual(['right','left']);
  }
  await page.setViewportSize({width:390,height:950});await page.goto('/industries');
  await expect(cards.first().locator('[data-scroll-reveal-variant="up"]:not([data-scroll-reveal-text])')).toHaveCount(2);
});

test('reduced motion and unavailable animation APIs never hide content',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const path of pages){await page.goto(path);await expect(page.locator('[data-scroll-reveal-state]')).toHaveCount(0);}
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/who-we-are');
  await expect.poll(()=>page.locator('[data-scroll-reveal-state]').count()).toBeGreaterThan(0);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('[data-scroll-reveal-state]')).toHaveCount(0);
  await expect(page.locator('.about-company-story-copy')).toHaveCSS('opacity','1');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.addInitScript(()=>{window.IntersectionObserver=undefined;});
  await page.goto('/contact');await expect(page.locator('[data-scroll-reveal-state]')).toHaveCount(0);
  await expect(page.getByRole('form',{name:'Contact enquiry'})).toBeVisible();
});

test('interaction immediately completes parent reveals without animating form fields',async({page})=>{
  await page.goto('/request-workers');
  const form=page.getByRole('form',{name:'Request construction workers'});
  await form.getByLabel('Name',{exact:true}).fill('Local animation check');
  await expect(page.locator('.worker-request-body')).toHaveAttribute('data-scroll-reveal-state','complete');
  await expect(form.locator('[data-scroll-reveal-state]')).toHaveCount(0);
  await expect(form.getByLabel('Name',{exact:true})).toHaveValue('Local animation check');
});

test('card stagger changes only visual entrance and never repeats on return scroll',async({page})=>{
  await page.goto('/employers');
  await page.evaluate(()=>document.fonts.ready);
  const cards=page.locator('.hire-steps > li');
  await expect(cards.first()).toHaveAttribute('data-scroll-reveal-state','pending');
  const before=await cards.evaluateAll(elements=>elements.map(e=>[e.offsetWidth,e.offsetHeight]));
  const delays=await cards.evaluateAll(elements=>elements.map(e=>e.getAnimations()[0].effect.getTiming().delay));
  expect(delays).toEqual([0,100,200,300]);
  await page.locator('.hire-process').evaluate(e=>e.scrollIntoView({block:'center'}));
  await expect(cards.locator('[data-scroll-reveal-state="pending"]')).toHaveCount(0);
  for(const card of await cards.all())await expect(card).toHaveAttribute('data-scroll-reveal-state','complete');
  expect(await cards.evaluateAll(elements=>elements.map(e=>[e.offsetWidth,e.offsetHeight]))).toEqual(before);
  await page.evaluate(()=>scrollTo(0,0));await page.locator('.hire-process').evaluate(e=>e.scrollIntoView({block:'center'}));
  expect(await cards.evaluateAll(elements=>elements.every(e=>e.dataset.scrollRevealState==='complete'&&e.getAnimations().length===0))).toBe(true);
});

test('headings and copy have independent fade-up, including each construction scene',async({page})=>{
  await page.goto('/industries');
  const text=page.locator('.work-area-photo-card').first().locator('h2,h3,p');
  for(const element of await text.all()){
    await expect(element).toHaveAttribute('data-scroll-reveal-text','true');
    await expect(element).toHaveAttribute('data-scroll-reveal-variant','up');
  }
  await page.goto('/');
  const scene=page.locator('.construction-journey');
  await scene.evaluate(element=>element.scrollIntoView());
  await expect(scene).toHaveAttribute('data-mode','animated');
  const panels=scene.locator('[data-story-copy],.construction-cta');
  for(const [index,progress] of [0,.29,.72,.94].entries()){
    await scene.evaluate((element,progress)=>{
      const spacer=element.closest('.pin-spacer');
      scrollTo(0,scrollY+spacer.getBoundingClientRect().top+(spacer.offsetHeight-element.offsetHeight)*progress);
    },progress);
    await expect(panels.nth(index).locator('h2')).toHaveAttribute('data-story-text-reveal','complete');
    expect(await panels.nth(index).locator('h2').evaluate(element=>getComputedStyle(element).transform)).toBe('none');
  }
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(scene).toHaveAttribute('data-mode','static');
  await expect(scene.locator('[data-story-text-reveal]')).toHaveCount(0);
  await expect(scene.locator('.construction-cta h2')).toBeVisible();
});
