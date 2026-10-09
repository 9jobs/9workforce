import {test,expect} from '@playwright/test';

async function prepare(page){
  await page.goto('/');
  const section=page.locator('.labour-orbit');
  await expect(section).toBeAttached();
  await page.evaluate(()=>document.fonts.ready);
  await page.locator('.construction-journey').evaluate(e=>e.scrollIntoView());
  await expect(page.locator('.construction-journey')).toHaveAttribute('data-mode',/animated|static/);
  return section.evaluate(e=>Math.max(0,scrollY+e.getBoundingClientRect().top+(e.getBoundingClientRect().height-innerHeight)/2));
}
for(const motion of ['no-preference','reduce'])for(const width of [1440,390]){
  test(`fast wheel entry is captured and reverses through every role (${motion}, ${width}px)`,async({page})=>{
    await page.emulateMedia({reducedMotion:motion});
    await page.setViewportSize({width,height:950});
    const anchor=await prepare(page);
    await page.evaluate(y=>scrollTo({top:y-350,behavior:'instant'}),anchor);
    await page.mouse.move(8,350); // Pointer outside the card/section still captures entry.
    await page.mouse.wheel(0,5000);
    await expect.poll(()=>page.evaluate(()=>scrollY)).toBeCloseTo(anchor,0);
    await expect(page.locator('.labour-orbit-card.is-active .labour-orbit-card-number')).toHaveText('01 / 08');
    for(let index=1;index<=7;index++){
      await page.mouse.wheel(0,120);
      await page.waitForTimeout(160);
      await page.mouse.wheel(0,120);
      await expect(page.locator('.labour-orbit-card.is-active .labour-orbit-card-number')).toHaveText(`${String(index+1).padStart(2,'0')} / 08`);
      expect(Math.abs(await page.evaluate(()=>scrollY)-anchor)).toBeLessThan(2);
      if(index<7)await page.waitForTimeout(400);
    }
    // A continuous fling must stay captured after reaching the final card.
    for(let n=0;n<8;n++)await page.mouse.wheel(0,5000);
    expect(Math.abs(await page.evaluate(()=>scrollY)-anchor)).toBeLessThan(2);
    await page.waitForTimeout(400);
    await page.mouse.wheel(0,500);
    await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(anchor+100);
    await page.waitForTimeout(200);
    await page.mouse.wheel(0,-5000);
    await expect.poll(()=>page.evaluate(()=>scrollY)).toBeCloseTo(anchor,0);
    await expect(page.locator('.labour-orbit-card.is-active .labour-orbit-card-number')).toHaveText('08 / 08');
    for(let index=6;index>=0;index--){
      await page.mouse.wheel(0,-120);await page.waitForTimeout(160);await page.mouse.wheel(0,-120);
      await expect(page.locator('.labour-orbit-card.is-active .labour-orbit-card-number')).toHaveText(`${String(index+1).padStart(2,'0')} / 08`);
      expect(Math.abs(await page.evaluate(()=>scrollY)-anchor)).toBeLessThan(2);
      if(index>0)await page.waitForTimeout(400);
    }
    await page.waitForTimeout(400);await page.mouse.wheel(0,-500);
    await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThan(anchor-100);
  });
}
test('role select text clears its search icon on desktop and mobile',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  for(const width of [1440,390]){
    await page.setViewportSize({width,height:950});await page.goto('/');
    const field=page.locator('.home-search-keyword');
    const gap=await field.evaluate(e=>{
      const icon=e.querySelector('.home-search-field-icon').getBoundingClientRect();
      const select=e.querySelector('select');
      return select.getBoundingClientRect().left+parseFloat(getComputedStyle(select).paddingLeft)-icon.right;
    });
    expect(gap).toBeGreaterThanOrEqual(8);
    await field.screenshot({path:`scratch/search-role-spacing-${width}.png`});
  }
});
test('native page jumps cannot bypass an unfinished sequence in either direction',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  const anchor=await prepare(page);
  await page.evaluate(y=>scrollTo({top:y-300,behavior:'instant'}),anchor);
  await page.waitForTimeout(60);
  await page.evaluate(y=>scrollTo({top:y+2500,behavior:'instant'}),anchor);
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeCloseTo(anchor,0);
  await expect(page.locator('.labour-orbit-card.is-active .labour-orbit-card-number')).toHaveText('01 / 08');
  await page.keyboard.press('End');
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeCloseTo(anchor,0);
  await page.mouse.move(8,350);
  for(let i=0;i<14;i++)await page.mouse.wheel(0,120);
  await expect(page.locator('.labour-orbit-card.is-active .labour-orbit-card-number')).toHaveText('08 / 08');
  await page.waitForTimeout(400);
  await page.evaluate(y=>scrollTo({top:y+1000,behavior:'instant'}),anchor);
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(anchor+900);
  await page.evaluate(y=>scrollTo({top:y-1000,behavior:'instant'}),anchor);
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeCloseTo(anchor,0);
  await expect(page.locator('.labour-orbit-card.is-active .labour-orbit-card-number')).toHaveText('08 / 08');
  await page.keyboard.press('Home');
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeCloseTo(anchor,0);
});
test('mobile touch scrolling is captured on entry and rotates the cards',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setViewportSize({width:390,height:844});
  const anchor=await prepare(page);
  await page.evaluate(y=>scrollTo({top:y-200,behavior:'instant'}),anchor);
  const session=await page.context().newCDPSession(page);
  const point=y=>[{x:8,y}];
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:point(700)});
  await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:point(250)});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeCloseTo(anchor,0);
  await expect(page.locator('.labour-orbit-card.is-active .labour-orbit-card-number')).toHaveText('01 / 08');
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:point(700)});
  await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:point(580)});
  await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:point(460)});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(page.locator('.labour-orbit-card.is-active .labour-orbit-card-number')).toHaveText('02 / 08');
  expect(Math.abs(await page.evaluate(()=>scrollY)-anchor)).toBeLessThan(2);
});
