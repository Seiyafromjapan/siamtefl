import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4173';
const widths=[320,390,768,1440];

test('offer comparison works at requested widths and records clear preview screenshots',async({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('siamtefl_analytics_consent','granted');
    window.__offerEvents=[];
    window.gtag=(...args)=>window.__offerEvents.push(args);
  });
  await page.goto(`${base}/offer-comparison/`);
  await expect(page.locator('h1')).toHaveText('Compare two teaching job offers');
  await expect(page.locator('[data-offer-example]')).toBeVisible();
  await page.getByRole('button',{name:'Try an example'}).click();
  await expect(page.locator('#result-A-total')).toHaveText('฿452,000');
  await expect(page.locator('#result-B-total')).toHaveText('฿480,000');
  await expect(page.locator('#after-difference')).toContainText('฿70,000 more for Offer B');
  await expect(page.locator('#hours-comparison')).toContainText('20 teaching / 40 total');
  const eventNames=await page.evaluate(()=>window.__offerEvents.map(event=>event[1]));
  expect(eventNames).toEqual(['offer_comparison_start','offer_comparison_example','offer_comparison_complete']);
  const eventArgs=await page.evaluate(()=>window.__offerEvents);
  expect(eventArgs.every(event=>event.length===2)).toBe(true);
  for(const width of widths){
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`horizontal overflow at ${width}px`).toBe(true);
    await expect(page.locator('[name="A-salary"]')).toBeVisible();
    await expect(page.locator('#offer-difference')).toBeVisible();
    const screenshots='qa/previews';await mkdir(screenshots,{recursive:true});
    await page.screenshot({path:`${screenshots}/offer-comparison-${width}px.png`,fullPage:true});
  }
  await page.locator('[name="A-housing"]').fill('0');
  await page.locator('[name="A-housing-months"]').fill('');
  await expect(page.locator('#result-A-allowances')).toHaveText('฿12,000');
  await page.getByRole('button',{name:'Reset'}).click();
  await expect(page.locator('#result-A-total')).toContainText('Incomplete');
  await expect(page.locator('[name="A-salary"]')).toHaveValue('');
  await expect(page.locator('.offer-product')).toHaveCount(0);
});

test('invalid inputs are announced and zero amounts need no payment periods',async({page})=>{
  await page.goto(`${base}/offer-comparison/`);
  await page.locator('[name="A-housing"]').fill('0');
  await page.locator('[name="A-other"]').fill('0');
  await expect(page.locator('#result-A-allowances')).toHaveText('฿0');
  await page.locator('[name="A-rent"]').fill('0');
  await expect(page.locator('#result-A-rent')).toHaveText('฿0');
  await page.locator('[name="A-salary"]').fill('-1');
  await expect(page.locator('#A-salary-error')).toContainText('0 or a positive');
  await expect(page.locator('[name="A-salary"]')).toHaveAttribute('aria-invalid','true');
  await expect(page.locator('.offer-product')).toHaveCount(0);
});
