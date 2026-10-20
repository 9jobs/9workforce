import {test,expect} from '@playwright/test';
import fs from 'node:fs';

test('welcome page is responsive and its action opens or focuses workspace selection',async({page})=>{
  await page.setViewportSize({width:1920,height:1080});
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'Your next step. A clearer workspace.'})).toBeVisible();
  await page.getByRole('button',{name:'Choose your workspace',exact:true}).click();
  await expect(page.locator('.workspace-role[data-workspace="admin"]')).toBeFocused();
  await page.screenshot({path:'local-admin/proof/welcome-wide.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.reload();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:'local-admin/proof/welcome-mobile.png',fullPage:true});
  await page.getByRole('button',{name:'Choose your workspace',exact:true}).click();
  await expect(page.locator('.workspace-sidebar')).toBeInViewport();
  await page.locator('.workspace-role[data-workspace="worker"]').click();
  await expect(page.getByRole('heading',{name:'Worker Dashboard',exact:true})).toBeVisible();
});

test('workspace picker opens separate dashboards with dedicated sidebars',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  for(const [role,heading]of [['admin','Admin Dashboard'],['worker','Worker Dashboard'],['employer','Employer Dashboard']]){
    await page.goto('/');
    await expect(page.locator('.workspace-role')).toHaveCount(3);
    await expect(page.locator('.workspace-menu-item')).toHaveCount(0);
    await expect(page.getByRole('heading',{name:'Admin Dashboard',exact:true})).toHaveCount(0);
    await page.screenshot({path:'local-admin/proof/workspace-picker.png',fullPage:true});
    await page.locator(`.workspace-role[data-workspace="${role}"]`).click();
    await expect(page).toHaveURL(new RegExp('/'+role+'$'));
    await expect(page.getByRole('heading',{name:heading,exact:true})).toBeVisible();
    await page.evaluate(()=>document.fonts.ready);
    const images=await page.locator('img').filter({visible:true}).evaluateAll(imgs=>imgs.map(img=>({src:img.getAttribute('src'),loaded:img.complete&&img.naturalWidth>0,w:img.getBoundingClientRect().width,h:img.getBoundingClientRect().height})));
    expect(images.length).toBeGreaterThan(0);
    expect(images.filter(img=>!img.loaded||!img.src.startsWith('/assets/')||img.w<=0||img.h<=0)).toEqual([]);
    await page.screenshot({path:`local-admin/proof/${role}-desktop.png`,fullPage:true});
    await expect(page.locator('.workspace-role')).toHaveCount(0);
    await expect(page.locator(`#menu-${role}`)).toBeVisible();
    await expect(page.getByRole('heading',{name:heading,exact:true})).toHaveCSS('font-family',/Inter/);
    for(const other of ['admin','worker','employer'].filter(id=>id!==role))await expect(page.locator(`#menu-${other}`)).toHaveCount(0);
    await page.reload();
    await expect(page.locator(`#menu-${role}`)).toBeVisible();
    await page.getByRole('button',{name:'Back to workspaces'}).click();
    await expect(page.locator('.workspace-role')).toHaveCount(3);
    await expect(page.locator('.workspace-menu-item')).toHaveCount(0);
    await page.goBack();
    await expect(page.getByRole('heading',{name:heading,exact:true})).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('sidebar has separate employer and worker actions with mobile navigation',async({page})=>{
  await page.goto('/');
  await page.locator('.workspace-role[data-workspace="employer"]').click();
  await expect(page.getByRole('heading',{name:'Employer Dashboard',exact:true})).toBeVisible();
  await page.locator('#menu-employer').getByRole('button',{name:'My Requests',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading',{name:'My Requests',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Close dialog'}).click();
  await page.getByRole('button',{name:'Back to workspaces'}).click();
  await page.locator('.workspace-role[data-workspace="worker"]').click();
  await expect(page.locator('#menu-worker').getByRole('button',{name:'Documents',exact:true})).toBeVisible();
  await expect(page.locator('#menu-admin').getByRole('button',{name:'Settings',exact:true})).not.toBeVisible();
  await page.screenshot({path:'local-admin/proof/worker-sidebar.png'});
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Open workspace navigation'}).click();
  await expect(page.locator('.workspace-sidebar')).toBeInViewport();
  await page.locator('#menu-worker').getByRole('button',{name:'Documents',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Upload Documents',exact:true})).toBeVisible();
});

test('local worker and employer actions persist, database search works, and public site receives no writes',async({page})=>{
  const externalWrites=[];page.on('request',request=>{if(request.method()!=='GET'&&!request.url().startsWith('http://127.0.0.1:3002'))externalWrites.push(request.url())});
  await page.goto('/admin');
  await page.getByRole('button',{name:'+ Add Worker',exact:true}).click();
  await page.getByLabel('Full name',{exact:true}).fill('Local Preview Worker');
  await page.getByLabel('Trade / role').fill('Civil Labourer');
  await page.getByLabel('Location',{exact:true}).fill('Melbourne');
  await page.getByLabel('Email',{exact:true}).fill('preview@example.com');
  await page.getByRole('button',{name:'Save Worker',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('saved locally');
  await expect(page.locator('[data-node-id="8:1542"]')).toHaveText('95');
  await page.reload();
  await expect(page.locator('[data-node-id="8:1542"]')).toHaveText('95');
  await page.getByRole('button',{name:'Workers',exact:true}).click();
  await expect(page).toHaveURL(/\/admin\/workers$/);
  await expect(page.locator('.local-worker-row')).toContainText('Local Preview Worker');
  const broken=await page.locator('img').evaluateAll(imgs=>imgs.filter(img=>!img.complete||!img.naturalWidth).map(img=>img.src));
  expect(broken).toEqual([]);
  await page.screenshot({path:'local-admin/proof/worker-database.png',fullPage:true});
  await page.getByLabel('All Trades',{exact:true}).selectOption('Civil Labourer');
  await expect(page.locator('.local-worker-row')).toBeVisible();
  await page.getByLabel('All Trades',{exact:true}).selectOption('');
  await page.locator('[data-node-id="8:3470"] input').fill('Liam');
  const rows=page.locator('[data-node-id="8:3477"]>div').filter({visible:true});
  expect(await rows.count()).toBeLessThan(9);
  await page.screenshot({path:'local-admin/proof/worker-database-filtered.png',fullPage:true});
  await page.goto('/employer');
  await page.getByRole('button',{name:/\+ Request Workers/}).click();
  await page.getByLabel('Workers required / trade').fill('Civil Labourers');
  await page.getByLabel('Number of workers').fill('4');
  await page.getByLabel('Site address').fill('435 Bourke St, Melbourne');
  await page.getByLabel('Start date').fill('2026-11-01');
  await page.getByRole('button',{name:'Save Request Workers'}).click();
  await expect(page.getByRole('status')).toContainText('saved locally');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('9workforce-local-panel-v1')).requests.length)).toBe(1);
  expect(externalWrites).toEqual([]);
});

test('dashboard table fills its card at wide sizes and dashboards fit mobile screens',async({page})=>{
  await page.setViewportSize({width:1920,height:1080});
  await page.goto('/admin');
  const dimensions=await page.locator('.dashboard-request-table').evaluate(table=>({table:table.getBoundingClientRect().width,container:table.parentElement.getBoundingClientRect().width}));
  expect(dimensions.table/dimensions.container).toBeGreaterThan(.98);
  await page.screenshot({path:'local-admin/proof/admin-wide-clean.png',fullPage:true});
  for(const role of ['admin','worker','employer']){
    await page.setViewportSize({width:390,height:844});
    await page.goto('/'+role);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:`local-admin/proof/${role}-mobile-clean.png`,fullPage:true});
  }
});

test('worker availability, profile, documents and shift acknowledgement work locally',async({page})=>{
  await page.goto('/worker');
  await page.locator('[data-name="Job Card 1"]').getByRole('button',{name:'Quick Apply',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Application submitted');
  await page.locator('[data-name="Job Card 1"]').getByRole('button',{name:'Quick Apply',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('already applied');
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('9workforce-local-panel-v1')).applications.length)).toBe(1);
  await page.getByRole('button',{name:'Update Availability',exact:true}).click();
  await page.getByLabel('Availability',{exact:true}).selectOption('Available from next week');
  await page.getByRole('button',{name:'Save availability'}).click();
  await expect(page.getByRole('status')).toContainText('saved locally');
  await page.getByRole('button',{name:'Upload Documents',exact:true}).click();
  await page.locator('dialog input[type=file]').setInputFiles({name:'white-card.txt.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\nLocal preview document\n%%EOF')});
  await expect(page.locator('dialog').getByRole('link',{name:/white-card.txt.pdf/})).toBeVisible();
  await page.getByRole('button',{name:'Close dialog'}).click();
  await page.getByRole('button',{name:'Edit Profile',exact:true}).click();
  await page.getByLabel('Full name',{exact:true}).fill('Local Worker Profile');
  await page.getByLabel('Trade / role').fill('Civil Labourer');
  await page.getByLabel('Email',{exact:true}).fill('local-worker@example.com');
  await page.getByLabel('Phone',{exact:true}).fill('0400000000');
  await page.getByRole('button',{name:'Save profile'}).click();
  await page.getByRole('button',{name:'Acknowledge Shift',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('Shift acknowledged');
  await page.reload();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('9workforce-local-panel-v1')).acknowledged)).toBe(true);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('9workforce-local-panel-v1')).documents.length)).toBe(1);
  await expect(page.getByRole('button',{name:'Shift Acknowledged',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Edit Profile',exact:true}).click();
  await expect(page.getByLabel('Full name',{exact:true})).toHaveValue('Local Worker Profile');
});
