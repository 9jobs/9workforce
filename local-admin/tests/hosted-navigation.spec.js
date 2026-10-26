import {test,expect} from '@playwright/test';

test('hosted workspace buttons navigate to authenticated admin screens without local preview requests',async({page})=>{
 const setup=await page.request.post('/api/workspace/register',{headers:{'X-Workspace-Role':'admin'},data:{name:'Navigation Admin',email:'navigation@example.test',password:'NavigationTestPassword123'}});
 expect(setup.ok()).toBeTruthy();
 const previews=[];
 await page.route('**/api/workspace/preview',route=>{previews.push(route.request().url());return route.fulfill({status:403,json:{error:'Local previews disabled'}});});
 await page.goto('/workspace');
 await page.getByRole('button',{name:/Admin Manage workforce operations/}).click();
 await expect(page).toHaveURL(/\/admin$/);
 await expect(page.getByRole('button',{name:'Job Posts',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Job Posts',exact:true}).click();
 await expect(page).toHaveURL(/\/admin\/job-posts$/);
 await expect(page.getByRole('button',{name:'Create Job Post',exact:true})).toBeVisible();
 await page.goto('/workspace');
 await page.locator('[data-workspace="admin"]').click();
 await expect(page).toHaveURL(/\/admin$/);
 await page.goto('/workspace');
 await page.locator('[data-workspace="employer"]').click();
 await expect(page).toHaveURL(/\/admin\/employers$/);
 await page.goto('/workspace');
 await page.locator('[data-workspace="worker"]').click();
 await expect(page).toHaveURL(/\/admin\/workers$/);
 expect(previews).toHaveLength(0);
});
