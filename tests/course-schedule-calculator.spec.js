import { test, expect } from '@playwright/test';

const base = 'http://127.0.0.1:4173';

for (const width of [1440, 768, 390, 320]) {
  test(`course-date page is readable and static at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 960 }, javaScriptEnabled: false });
    const page = await context.newPage();
    const response = await page.goto(`${base}/tefl-course-dates-thailand/`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.job-table-scroll[aria-label="2027 TEFL course dates by month"]')).toBeVisible();
    await expect(page.locator('.schedule-month-jump[aria-label="Jump to month"] a').first()).toHaveAttribute('href', '#course-month-2027-01');
    await expect(page.locator('main')).toContainText('6 September–1 October');
    await expect(page.locator('main')).toContainText('19 April–18 May');
    await expect(page.locator('main')).toContainText('US$900');
    await expect(page.locator('main')).toContainText('Official sources checked 17 November 2026');
    await page.locator('.schedule-month-jump a[href="#course-month-2027-09"]').click();
    await expect(page).toHaveURL(/#course-month-2027-09$/);
    await expect(page.locator('#course-month-2027-09')).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await context.close();
  });
}

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
]) {
  test(`calculator uses shared prices, preserves CTA behavior and avoids duplicate deposit at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(() => localStorage.setItem('siamtefl_analytics_consent', 'denied'));
    await page.goto(`${base}/calculator/`);
    const course = page.locator('#course');
    const total = page.locator('#calc-total');
    const payment = page.locator('#calc-course-payment');
    const cta = page.locator('[data-calculator-course-link]');
    await expect(total).toHaveText('฿153,000');
    await expect(payment).toContainText('Provider-listed deposit: ฿20,000');
    await expect(payment).toContainText('Calculated remainder after the provider-listed deposit: ฿25,000');
    await expect(payment).toContainText('not added again');
    await expect(page.locator('.calculator-course-sources a')).toHaveCount(4);
    await expect(cta).toHaveAttribute('href', 'https://www.essentialtefl.com/?ref=suThaiJapan');
    await expect(cta).toHaveAttribute('data-placement', 'calculator-result');

    await course.selectOption('level5');
    await expect(total).toHaveText('฿158,000');
    await expect(payment).toContainText('Provider-listed deposit: ฿20,000');
    await expect(payment).toContainText('Calculated remainder after the provider-listed deposit: ฿30,000');
    await course.selectOption('internship');
    await expect(total).toHaveText('฿198,000');
    await course.selectOption('allin');
    await expect(total).toHaveText('฿222,000');
    await expect(cta).toHaveAttribute('href', 'https://www.essentialtefl.com/courses');
    await page.locator('#allInHousing').uncheck();
    await expect(total).toHaveText('฿238,000');
    await page.locator('#allInHousing').check();
    await expect(total).toHaveText('฿222,000');

    await page.locator('#accommodation').fill('20000');
    await expect(total).toHaveText('฿226,000');
    await page.locator('#months').fill('1');
    await expect(total).toHaveText('฿193,000');
    await page.locator('#months').fill('3');
    await expect(total).toHaveText('฿259,000');
    await page.locator('#months').fill('2');
    await page.locator('#accommodation').fill('16000');

    await page.locator('#advanceRent').fill('16000');
    await expect(total).toHaveText('฿222,000');
    await page.locator('#food').fill('12500');
    await expect(total).toHaveText('฿227,000');
    await page.locator('#food').fill('10000');
    await page.locator('#advanceRent').fill('0');
    await expect(total).toHaveText('฿222,000');
    await page.locator('#accommodation').fill('16000');
    await page.locator('#months').fill('2');
    await expect(total).toHaveText('฿222,000');
    await page.locator('#allInHousing').check();
    await expect(total).toHaveText('฿222,000');
    await course.selectOption('custom');
    for (const id of ['months','accommodation','rentDeposit','advanceRent','food','transport','flight','emergency','other','documents','delayMonths']) await page.locator(`#${id}`).fill('0');
    await page.locator('#customFee').fill('25000');
    await expect(total).toHaveText('฿25,000');
    await page.locator('#customFee').fill('-1000');
    await expect(total).toHaveText('฿0');
    await page.locator('#customFee').fill('25000');
    await page.locator('#months').fill('2');
    await page.locator('#accommodation').fill('-12000');
    await expect(page.locator('#accommodation')).toHaveValue('0');
    await expect(page.locator('#calc-breakdown .breakdown-row').filter({ hasText: 'Accommodation runway' })).toContainText('฿0');
    await expect(total).toHaveText('฿25,000');
    await page.locator('#months').fill('-2');
    await expect(page.locator('#months')).toHaveValue('0');
    await expect(page.locator('#calc-total')).toHaveText('฿25,000');
    await page.locator('#months').fill('30');
    await expect(page.locator('#months')).toHaveValue('24');
    await expect(total).toHaveText('฿25,000');
    await page.locator('#months').evaluate(input => { input.value = 'NaN'; input.dispatchEvent(new Event('input', { bubbles: true })); });
    await expect(page.locator('#months')).toHaveValue('');
    await expect(total).toHaveText('฿25,000');
    await page.locator('#customFee').fill('');
    await expect(total).toHaveText('฿0');
    await page.reload();
    await expect(course).toHaveValue('standard');
    await expect(total).toHaveText('฿153,000');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('calculator affiliate click still respects consent and emits one event after consent', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.__gaEvents = [];
    window.gtag = (...args) => window.__gaEvents.push(args);
    localStorage.setItem('siamtefl_analytics_consent', 'denied');
  });
  await page.goto(`${base}/calculator/`);
  const cta = page.locator('[data-calculator-course-link]');
  await cta.evaluate(element => element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
  await expect.poll(() => page.evaluate(() => window.__gaEvents.filter(args => args[0] === 'event').length)).toBe(0);
  await page.locator('#privacy-settings').click();
  await page.locator('[data-analytics-consent="granted"]').click();
  await cta.evaluate(element => element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
  await expect.poll(() => page.evaluate(() => window.__gaEvents.filter(args => args[0] === 'event').length)).toBe(1);
  const event = await page.evaluate(() => window.__gaEvents.find(args => args[0] === 'event'));
  expect(event[1]).toBe('affiliate_click');
  expect(event[2].placement).toBe('calculator-result');
});

test('TEFLen sticky CTA still follows its existing mobile-only controls', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('siamtefl_analytics_consent', 'denied'));
  await page.goto(`${base}/teflen-review/`);
  const sticky = page.locator('#teflen-sticky-cta');
  await expect(sticky).toBeHidden();
  const overview = page.locator('.article-content .callout').filter({ hasText: 'Quick assessment' });
  const disclosure = page.locator('#teflen-affiliate-disclosure');
  await expect(overview).toHaveCount(1);
  await expect(disclosure).toHaveCount(1);
  await disclosure.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const disclosure = document.querySelector('#teflen-affiliate-disclosure');
    window.scrollTo(0, window.scrollY + disclosure.getBoundingClientRect().bottom + 1);
  });
  await expect(sticky).toBeVisible();
  await sticky.locator('.teflen-sticky-close').click();
  await expect(sticky).toBeHidden();
});
