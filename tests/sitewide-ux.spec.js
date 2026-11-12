import { test, expect } from '@playwright/test';
import pages from '../src/pages.json' with { type: 'json' };

const base = 'http://127.0.0.1:4173';
const viewports = [
  { name: 'desktop-1440', width: 1440, height: 1000 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-320', width: 320, height: 740 },
];

for (const viewport of viewports) {
  test(`all ${pages.length} routes at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const route of pages) {
      const response = await page.goto(`${base}${route.path}`);
      expect(response?.status(), `${route.path} status`).toBe(200);
      await expect(page.locator('main#main')).toBeVisible();
      await expect(page.locator('h1')).toHaveCount(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route.path} overflow`).toBe(true);

      const audit = await page.evaluate(() => {
        const main = document.querySelector('main');
        const visible = el => { const s=getComputedStyle(el), r=el.getBoundingClientRect(); return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0; };
        const px = el => parseFloat(getComputedStyle(el).fontSize);
        const body = [...main.querySelectorAll('p,li')].filter(visible).filter(el => !el.matches('.source-note,.legal-note,.fine-print,.fine,.table-hint,.hero-caveat,.course-disclosure,.eyebrow,.hero-trust,.breadcrumbs li,.breadcrumbs ol *'));
        const support = [...main.querySelectorAll('figcaption,table th,table td,label,.hint,.note')].filter(visible);
        const tables = [...main.querySelectorAll('table')].map(t => { const w=t.closest('.table-scroll,[role="region"]')||[...function*(){for(let e=t.parentElement;e&&e!==main;e=e.parentElement)yield e}()].find(e=>['auto','scroll'].includes(getComputedStyle(e).overflowX)); return {width:t.getBoundingClientRect().width,wrapper:!!w,overflow:w?getComputedStyle(w).overflowX:'none',scrollable:w?w.scrollWidth>w.clientWidth:false}; });
        return {smallBody:body.filter(e=>px(e)<17).slice(0,4).map(e=>`${e.tagName}.${e.className}=${px(e)}px`),smallSupport:support.filter(e=>px(e)<14).slice(0,4).map(e=>`${e.tagName}.${e.className}=${px(e)}px`),tables};
      });
      expect(audit.smallBody, `${route.path} body text under 17px`).toEqual([]);
      expect(audit.smallSupport, `${route.path} support text under 14px`).toEqual([]);
      for (const [i,t] of audit.tables.entries()) {
        expect(t.wrapper || t.width <= viewport.width, `${route.path} table ${i} lacks a wrapper`).toBe(true);
        if (viewport.width <= 700 && t.scrollable) expect(t.overflow).toMatch(/auto|scroll/);
      }

      const localHrefs = await page.locator('main a[href^="/"]').evaluateAll(links => [...new Set(links.map(a=>a.getAttribute('href').split('#')[0]).filter(Boolean))]);
      for (const href of localHrefs) {
        const pathname = new URL(href, base).pathname;
        if (pages.some(p=>p.path===pathname)) continue;
        const asset = await page.request.get(`${base}${pathname}`);
        expect(asset.status(), `${route.path} local target ${pathname}`).toBe(200);
      }

      if (route.path === '/') {
        await expect(page.locator('h1')).toContainText('Know your options.');
        for (const href of ['/teach-english-thailand-no-experience/','/tefl-course-comparison-thailand/','/calculator/']) await expect(page.locator(`.home-hero .hero-actions a[href="${href}"]`)).toBeVisible();
        if (viewport.width <= 700) {
          const cap=page.locator('.home-hero .hero-photo figcaption');
          expect(await cap.evaluate(e=>parseFloat(getComputedStyle(e).fontSize))).toBeGreaterThanOrEqual(14);
          const ratio=await cap.evaluate(el=>{const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number);const lin=c=>{c/=255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4};const L=s=>rgb(s).map(lin).reduce((a,c,i)=>a+c*[.2126,.7152,.0722][i],0);const a=L(getComputedStyle(el).backgroundColor),b=L(getComputedStyle(el).color);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)});
          expect(ratio).toBeGreaterThanOrEqual(4.5);
        }
      }
      if (route.path === '/calculator/') {
        await expect(page.locator('#budget-calculator')).toBeVisible();
        await expect(page.locator('#calc-total')).toContainText('฿');
        await expect(page.locator('[data-calculator-course-link]')).toBeVisible();
      }
    }
  });
}

test('responsive navigation, keyboard focus, SEO tags and provider links', async ({page}) => {
  await page.setViewportSize({width:1440,height:900});
  await page.goto(`${base}/`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href','https://siamtefl.com/');
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  await expect(page.locator('meta[name="p:domain_verify"]')).toHaveAttribute('content','62a9ccd130a8c03caa319b87a0aa39d2');
  await expect(page.locator('.menu-toggle')).toBeHidden();
  await expect(page.locator('#nav')).toHaveCSS('display','flex');
  await page.setViewportSize({width:700,height:900});
  await expect(page.locator('.menu-toggle')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await expect(page.locator('.skip-link')).toHaveCSS('left','0px');
  await page.keyboard.press('Tab');
  await expect(page.locator('header .brand')).toBeFocused();
  await page.setViewportSize({width:700,height:900});
  await page.keyboard.press('Tab');
  const menu=page.locator('.menu-toggle');
  await expect(menu).toBeFocused();
  expect(await menu.evaluate(e=>getComputedStyle(e).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect(page.locator('#nav')).toHaveClass(/open/);
  await expect(page.locator('#nav a').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();

  for (const [path,selector] of [
    ['/tefl-course-comparison-thailand/','a[href^="https://seetefl.com/"]'],
    ['/see-tefl-chiang-mai-review/','a[data-affiliate][data-provider="see_tefl"]'],
    ['/world-tesol-academy-review/','a[data-affiliate][data-provider="world_tesol_academy"]'],
    ['/teflen-review/','a[data-affiliate][data-provider="teflen"]'],
    ['/essential-tefl-review/','a[href*="essentialtefl.com"][data-affiliate]'],
  ]) { await page.goto(`${base}${path}`); await expect(page.locator(selector).first(),`${path} provider link`).toBeVisible(); }
  const app=await (await import('node:fs/promises')).readFile(new URL('../src/app.js',import.meta.url),'utf8');
  expect(app).toContain("const analyticsId='G-90601G33WS'");
  expect(app).toContain("event:'affiliate_click'");
});
