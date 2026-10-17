import {test,expect} from '@playwright/test';

test('brand palette stays consistent across public pages and mobile layouts',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:1440,height:1000});
  const paths=['/','/who-we-are','/industries','/find-work','/looking-for-hire','/blog','/contact','/register','/privacy-policy','/find-work/general-construction-labourers','/labour-hire'];
  for(const path of paths){
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    const palette=await page.evaluate(()=>{
      const style=getComputedStyle(document.documentElement);
      return [style.getPropertyValue('--brand-orange').trim(),style.getPropertyValue('--brand-blue').trim()];
    });
    expect(palette).toEqual(['#F2842F','#30497D']);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path).toBe(true);
    // Palette changes must preserve the established white button text and
    // component-specific gradients rather than forcing a new flat-button UI.
    await expect(page.locator('.header-actions .nav-register')).toHaveCSS('color','rgb(255, 255, 255)');
    if(path==='/register'){
      await expect(page.locator('.account-card')).toHaveCSS('background-color','rgb(255, 255, 255)');
      expect(await page.locator('.account-backdrop').evaluate(el=>getComputedStyle(el).backgroundImage)).toContain('rgb(4, 22, 47)');
    }
    if(['/','/looking-for-hire','/register'].includes(path))await page.screenshot({path:`scratch/brand-${path==='/'?'home':path.slice(1)}-desktop.png`,fullPage:true});
  }
  await page.setViewportSize({width:390,height:844});
  for(const path of ['/','/find-work','/looking-for-hire','/contact','/register']){
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),path).toBe(true);
    await page.screenshot({path:`scratch/brand-${path==='/'?'home':path.slice(1)}-mobile.png`,fullPage:true});
  }
  expect(errors).toEqual([]);
});

test('hire and about hero backgrounds use the exact requested blue',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  for(const [path,selector] of [['/who-we-are','.about-brand-hero'],['/looking-for-hire','.hire-hero']]){
    await page.goto(path);
    await expect(page.locator(selector)).toBeVisible();
    const gradient=await page.locator(selector).evaluate(el=>getComputedStyle(el).backgroundImage);
    const colors=gradient.match(/rgb\([^)]+\)/g);
    expect(colors.length).toBeGreaterThan(0);
    expect(colors.every(color=>color==='rgb(48, 73, 125)')).toBe(true);
    await page.screenshot({path:`scratch/exact-brand-${path.slice(1)}.png`,fullPage:true});
  }
});
