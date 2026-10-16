import {test,expect} from '@playwright/test';

for(const width of [1280,390,320]) {
  test(`blog filters, high-resolution image slots and article flow (${width}px)`,async({page})=>{
    await page.setViewportSize({width,height:950});
    await page.route('**/api/submissions',route=>route.abort());
    await page.goto('/blog');
    await expect(page.locator('.blog-card')).toHaveCount(5);
    const imageOrder=['hero-construction-workforce-v2','general-labour','toolbox-talk','project-team','trade-team'];
    for(let i=0;i<5;i++) {
      const image=page.locator('.blog-card-photo>img').nth(i);
      await expect(image).toHaveAttribute('src',`/assets/${imageOrder[i]}.webp`);
      await image.scrollIntoViewIfNeeded();
      await expect.poll(()=>image.evaluate(e=>e.complete&&e.naturalWidth>=1600)).toBe(true);
    }
    await page.getByRole('button',{name:'Recruitment',exact:true}).click();
    await expect(page.locator('.blog-card')).toHaveCount(1);
    await expect(page.locator('.blog-card h2')).toContainText('General Labourers vs Skilled Labourers');
    await page.getByRole('button',{name:'All Articles',exact:true}).click();
    await page.getByRole('searchbox',{name:'Search construction articles'}).fill('no-matching-article');
    await expect(page.locator('.blog-empty')).toBeVisible();
    await page.getByRole('button',{name:'View all articles',exact:true}).click();
    await expect(page.locator('.blog-card')).toHaveCount(5);
    await page.locator('.blog-card .blog-read').first().click();
    await expect(page.locator('.blog-prose-section')).toHaveCount(9);
    await expect(page.locator('.blog-inline-photo img')).toHaveAttribute('src','/assets/toolbox-talk.webp');
    const related=page.locator('.blog-related-grid article>a>img');
    for(const [index,name] of ['general-labour','toolbox-talk','project-team'].entries())await expect(related.nth(index)).toHaveAttribute('src',`/assets/${name}.webp`);
    await expect(page.locator('.blog-breadcrumb')).toHaveCount(0);
    await expect(page.locator('.blog-article-heading .blog-eyebrow')).toHaveCount(0);
    await expect(page.locator('.blog-page')).not.toContainText(/Published |min read|October 14, 2024/);
    if(width<=780) {
      await page.locator('.blog-mobile-toc summary').click();
      await page.locator('.blog-mobile-toc a').nth(1).click();
    } else await page.locator('.blog-toc a').nth(1).click();
    await expect(page).toHaveURL(/#article-section-2$/);
    await page.getByRole('button',{name:'Copy Link',exact:true}).click();
    await expect(page.getByRole('button',{name:'Copied',exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await expect(page.locator('.site-header')).toHaveCount(1);
    await expect(page.locator('.site-footer')).toHaveCount(1);
    await page.locator('.blog-article-cta .blog-cta-actions a').first().click();
    await expect(page).toHaveURL(/\/request-workers$/);
    await expect(page.locator('.worker-request-form')).toBeVisible();
  });
}

test('Blog uses the existing menu and preserves the existing footer',async({page})=>{
  await page.setViewportSize({width:390,height:950});
  await page.goto('/');
  await page.getByRole('button',{name:'Open navigation',exact:true}).click();
  await page.locator('#main-navigation>a[href="/blog"]').click();
  await expect(page).toHaveURL(/\/blog$/);
  await expect(page.locator('.blog-intro h1')).toHaveText('Construction Insights & Updates.');
  await page.locator('.site-footer-bottom').scrollIntoViewIfNeeded();
  await expect(page.locator('.site-footer-bottom p')).toContainText('9 JOBS PTY. LTD.');
  await expect(page.locator('.site-footer-bottom nav>a')).toHaveCount(3);
  await page.goto('/blog/missing-article');
  await expect(page).toHaveURL(/\/blog$/);
});
