import {chromium,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),admin=await context.newPage(),website=await context.newPage();
const panel='http://127.0.0.1:3002',live='https://9workforce.com.au',headers={'X-Workspace-Role':'admin'};
let id;
async function action(row,name){const menu=row.locator('.op-row-actions details');if(await menu.getAttribute('open')===null)await menu.locator('summary').click();await menu.getByRole('button',{name,exact:true}).click();}
try{
 await admin.goto(panel+'/admin/job-posts');await admin.getByRole('button',{name:'Create Job Post',exact:true}).click();const dialog=admin.getByRole('dialog');
 await dialog.getByLabel('Job title',{exact:true}).fill('[Verification] Construction Crew');await dialog.getByLabel('Location',{exact:true}).fill('Melbourne');await dialog.getByLabel('Workers required',{exact:true}).fill('2');await dialog.getByLabel('Pay rate',{exact:true}).fill('Confirmed per role');await dialog.getByLabel('Description',{exact:true}).fill('Temporary publishing verification; removed automatically.');await dialog.getByRole('button',{name:'Save Job Post',exact:true}).click();
 const row=admin.locator('tbody tr').filter({hasText:'[Verification] Construction Crew'});await expect(row).toBeVisible({timeout:30000});
 const snapshot=await (await admin.request.get(panel+'/api/workspace/data',{headers})).json();id=snapshot.jobs.find(j=>j.title==='[Verification] Construction Crew').id;
 let response=await website.request.get(live+'/api/jobs');expect(response.status()).toBe(200);expect((await response.json()).jobs.some(j=>j.id===id)).toBeFalsy();
 await action(row,'Edit');await dialog.getByLabel('Job title',{exact:true}).fill('[Verification] Updated Construction Crew');await dialog.getByRole('combobox',{name:'Status',exact:true}).selectOption('Open');await dialog.getByRole('button',{name:'Save Job Post',exact:true}).click();
 const updated=admin.locator('tbody tr').filter({hasText:'[Verification] Updated Construction Crew'});await expect(updated).toBeVisible({timeout:30000});
 await website.goto(live+'/find-work');const card=website.locator('.published-jobs article').filter({hasText:'[Verification] Updated Construction Crew'});await expect(card).toContainText('Melbourne',{timeout:45000});await card.scrollIntoViewIfNeeded();await website.screenshot({path:'local-admin/proof/live-published-job-card.png'});
 response=await website.request.get(live+'/api/jobs');const jobs=(await response.json()).jobs;expect(jobs.some(j=>j.id===id)).toBeTruthy();expect(JSON.stringify(jobs)).not.toMatch(/employerId|requestId|publicationRevision|password/);expect((await website.request.post(live+'/api/jobs',{data:{title:'Unauthorized'}})).status()).toBe(405);
 await admin.bringToFront();await updated.getByRole('combobox',{name:/Status for/}).selectOption('Closed');await website.bringToFront();await expect(card).toHaveCount(0,{timeout:20000});
 await admin.bringToFront();await updated.getByRole('combobox',{name:/Status for/}).selectOption('Open');await website.reload();await expect(card).toBeVisible({timeout:30000});
 await admin.bringToFront();await action(updated,'Delete');await dialog.getByRole('button',{name:'Confirm delete',exact:true}).click();await expect(updated).toHaveCount(0,{timeout:30000});await website.reload();await expect(card).toHaveCount(0);expect((await (await website.request.get(live+'/api/jobs')).json()).jobs.some(j=>j.id===id)).toBeFalsy();
 writeFileSync('local-admin/proof/live-jobs-verification.json',JSON.stringify({website:live+'/find-work',verifiedAt:new Date().toISOString(),create:true,edit:true,publish:true,close:true,delete:true,publicWritesBlocked:true,testJobRemoved:true},null,2));
 console.log('PASS: live Admin create/edit/publish/close/delete; public website card verified; temporary test job removed.');
}finally{
 if(id){const cleanup=await admin.request.delete(panel+'/api/workspace/jobs/'+id,{headers});if(!cleanup.ok())throw Error('Test job cleanup failed: '+cleanup.status());}
 await browser.close();
}
