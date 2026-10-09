import {test, expect} from '@playwright/test';

async function ready(page) {
  await page.goto('/');
  const section=page.locator('.construction-journey');
  // Small screens have a taller hero, so lazy initialization needs approach scroll.
  await section.evaluate(el=>el.scrollIntoView());
  await expect(section).toHaveAttribute('data-mode','animated');
  await page.evaluate(()=>document.fonts.ready);
  return section;
}

for(const [width,height] of [[1920,950],[390,844]]) {
  test(`continuous wheel scrolling stays stable in both directions at ${width}px`,async({page},testInfo)=>{
    await page.setViewportSize({width,height});
    await ready(page);
    await scrollToProgress(page,.16);
    await page.evaluate(()=>{
      window.pinSamples=[];window.samplePin=true;
      function sample(time){
        const el=document.querySelector('.construction-journey');
        const rect=el.getBoundingClientRect();
        window.pinSamples.push({time,top:rect.top,left:rect.left,width:rect.width,progress:Number(el.dataset.progress),scroll:scrollY});
        if(window.samplePin)requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    for(const direction of [1,-1]) {
      for(let i=0;i<22;i++) {
        await page.mouse.wheel(0,direction*75);
        await page.waitForTimeout(24);
      }
      await page.waitForTimeout(1150);
    }
    const samples=await page.evaluate(()=>{window.samplePin=false;return window.pinSamples});
    expect(samples.length).toBeGreaterThan(25);
    const drift=Math.max(...samples.map(s=>Math.abs(s.top)));
    const horizontalDrift=Math.max(...samples.map(s=>Math.abs(s.left)));
    expect(drift).toBeLessThanOrEqual(1);
    expect(horizontalDrift).toBeLessThanOrEqual(1);
    expect(Math.max(...samples.map(s=>s.progress))-Math.min(...samples.map(s=>s.progress))).toBeGreaterThan(.2);
    expect(Math.abs(samples.at(-1).progress-.16)).toBeLessThan(.015);
    await testInfo.attach('continuous-scroll-measurements',{body:JSON.stringify({width,samples:samples.length,maxVerticalDrift:drift,maxHorizontalDrift:horizontalDrift},null,2),contentType:'application/json'});
    await scrollToProgress(page,.44);
    await page.screenshot({path:`scratch/construction-smooth-orbit-${width}.png`});
  });
}

async function scrollToProgress(page,p) {
  const section=page.locator('.construction-journey');
  const y=await section.evaluate((el,p)=>{
    const spacer=document.querySelector('.pin-spacer');
    const start=spacer.getBoundingClientRect().top+scrollY;
    return start+(spacer.offsetHeight-el.offsetHeight)*p;
  },p);
  await page.evaluate(y=>scrollTo(0,y),y);
  await expect.poll(async()=>Number(await section.getAttribute('data-progress'))).toBeCloseTo(p,2);
  return section;
}

for(const [width,height] of [[1440,900],[390,844]]) {
  test(`returning from below the section reverses every stage after a resize at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height});
    const section=await ready(page);
    await scrollToProgress(page,.28);
    // Leave this pinned range without crossing the separate role sequence's
    // intentional scroll gate; that sequence has its own bidirectional tests.
    await section.evaluate(el=>scrollTo(0,scrollY+el.closest('.pin-spacer').getBoundingClientRect().bottom+30));
    await expect.poll(async()=>Number(await section.getAttribute('data-progress'))).toBeCloseTo(1,2);
    // A viewport resize/layout refresh while below the section must not reset its tween start.
    await page.setViewportSize({width,height:height-30});
    await page.waitForTimeout(500);
    for(const [name,p] of [['cta',.98],['workers',.77],['site',.56],['concrete',.44],['wireframe',.28],['plan',.09]]) {
      await scrollToProgress(page,p);
      expect(Math.abs((await section.boundingBox()).y)).toBeLessThanOrEqual(1);
      const photoOpacity=Number(await section.locator('.construction-photo').evaluate(el=>getComputedStyle(el).opacity));
      if(p<.57) expect(photoOpacity).toBe(0);
      if(p>.7) expect(photoOpacity).toBe(1);
      await page.screenshot({path:`scratch/construction-return-${name}-${width}.png`});
    }
    await scrollToProgress(page,.98);
    await section.getByRole('button',{name:'GET MY WORKFORCE'}).click();
    await expect(page).toHaveURL(/\/request-workers$/);
  });
}

test('fast exit settles the end frame before immediately re-entering from below',async({page})=>{
  await ready(page);
  await scrollToProgress(page,.28);
  await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
  // Exit must finish the animation immediately, rather than keeping a stale wireframe
  // playhead moving forward when the visitor is already returning upward.
  await page.waitForTimeout(100);
  expect(Number(await page.locator('.construction-journey').getAttribute('data-progress'))).toBe(1);
  await scrollToProgress(page,.77);
  await expect(page.locator('.construction-photo')).toHaveCSS('opacity','1');
  await scrollToProgress(page,.28);
  await expect(page.locator('.construction-photo')).toHaveCSS('opacity','0');
});

test('late 3D loading below the section preserves lower-page position and reverses on return',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.route('**/src/construction/createConstructionScene*',async route=>{
    await new Promise(resolve=>setTimeout(resolve,800));
    await route.continue();
  });
  await page.goto('/');
  await page.locator('.construction-journey').waitFor();
  await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
  const section=page.locator('.construction-journey');
  await expect(section).toHaveAttribute('data-mode','animated');
  await expect.poll(async()=>Number(await section.getAttribute('data-progress'))).toBeCloseTo(1,2);
  expect((await section.boundingBox()).y+ (await section.boundingBox()).height).toBeLessThanOrEqual(1);
  await scrollToProgress(page,.77);
  await scrollToProgress(page,.44);
  await scrollToProgress(page,.09);
  await expect(section.locator('.construction-photo')).toHaveCSS('opacity','0');
});

for(const [width,height] of [[1440,900],[768,1024],[390,844],[320,740],[844,390]]) {
  test(`construction sequence pins and reverses at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const section=await ready(page);
    await expect(page.locator('.homepage-hero + .pin-spacer')).toHaveCount(1);
    await expect(section.locator('canvas')).toHaveCount(1);
    for(const [name,p] of [['blueprint',.09],['model',.28],['concrete',.44],['site',.56],['workers',.77],['cta',.98]]) {
      await scrollToProgress(page,p);
      expect(Math.abs((await section.boundingBox()).y)).toBeLessThan(2);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      if(width===1440||width===390) await page.screenshot({path:`scratch/construction-${name}-${width}.png`});
    }
    const cta=section.getByRole('button',{name:'GET MY WORKFORCE'});
    await expect(cta).toBeVisible();
    const box=await cta.boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x+box.width).toBeLessThanOrEqual(width);
    expect(box.y+box.height).toBeLessThanOrEqual(height);
    await scrollToProgress(page,.28);
    await expect(section.locator('.construction-cta')).toHaveAttribute('inert','');
    await expect(section.locator('.construction-photo')).toHaveCSS('opacity','0');
    await scrollToProgress(page,.98);
    await cta.click();
    await expect(page).toHaveURL(/\/request-workers$/);
    await expect(page.getByRole('form',{name:'Request construction workers'})).toBeVisible();
    await expect(page.locator('.pin-spacer')).toHaveCount(0);
    await expect(page.locator('.construction-canvas')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('requested construction overlays are removed while the scene still renders',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  const section=await ready(page);
  await scrollToProgress(page,.2);
  await expect(section.getByRole('button',{name:'Skip animation'})).toHaveCount(0);
  await expect(section.getByText('PEOPLE BEHIND THE PROGRESS')).toHaveCount(0);
  await expect(section.locator('.construction-bottomline')).toHaveCount(0);
  await expect(section.locator('.construction-progress')).toBeHidden();
  await expect(section.locator('.construction-canvas canvas')).toHaveCount(1);
});

test('viewport changes and returning home do not duplicate canvases or pin spacers',async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await ready(page);
  await scrollToProgress(page,.44);
  await page.setViewportSize({width:390,height:844});
  await scrollToProgress(page,.77);
  await expect(page.locator('.construction-canvas canvas')).toHaveCount(1);
  await expect(page.locator('.pin-spacer')).toHaveCount(1);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await scrollToProgress(page,.98);
  await page.getByRole('button',{name:'GET MY WORKFORCE'}).click();
  await page.getByRole('banner').getByRole('link',{name:'9Work Force home',exact:true}).click();
  const section=page.locator('.construction-journey');
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveAttribute('data-mode','animated');
  await expect(page.locator('.construction-canvas canvas')).toHaveCount(1);
  await expect(page.locator('.pin-spacer')).toHaveCount(1);
});

test('losing WebGL during the sequence releases the pin and shows the static CTA',async({page})=>{
  await ready(page);
  await scrollToProgress(page,.44);
  await page.locator('.construction-canvas canvas').evaluate(canvas=>canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
  await expect(page.locator('.construction-journey')).toHaveAttribute('data-mode','static');
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await expect(page.locator('.construction-canvas canvas')).toHaveCount(0);
});

test('reduced motion is static, unpinned and does not load the 3D engine',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:390,height:844});
  const scripts=[];
  page.on('request',r=>{if(r.resourceType()==='script')scripts.push(r.url())});
  await page.goto('/');
  const section=page.locator('.construction-journey');
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveAttribute('data-mode','static');
  await expect(section.getByRole('button',{name:'GET MY WORKFORCE'})).toBeVisible();
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await expect(section.locator('canvas')).toHaveCount(0);
  expect(scripts.some(url=>/createConstructionScene|ScrollTrigger|three\.js/.test(url))).toBe(false);
  await page.screenshot({path:'scratch/construction-reduced-motion.png'});
  await page.emulateMedia({reducedMotion:'no-preference'});
  await expect(section).toHaveAttribute('data-mode','animated');
  await scrollToProgress(page,.5);
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(section).toHaveAttribute('data-mode','static');
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await expect(section.locator('canvas')).toHaveCount(0);
});

test('no WebGL leaves the enquiry CTA accessible without a scroll trap',async({page})=>{
  await page.addInitScript(()=>{
    const original=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:original.call(this,type,...args)};
  });
  await page.goto('/');
  const section=page.locator('.construction-journey');
  await section.scrollIntoViewIfNeeded();
  await expect(section).toHaveAttribute('data-mode','static');
  await expect(section.getByRole('button',{name:'GET MY WORKFORCE'})).toBeVisible();
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
});
