import { expect, test } from '@playwright/test';

const baseUrl = 'http://127.0.0.1:4173';
const gaMeasurementId = 'G-90601G33WS';
const gaScriptStub = `
  window.__gaCalls = (window.dataLayer || []).map(command => Array.from(command));
  const queuedGtag = window.gtag;
  window.gtag = function (...args) {
    window.__gaCalls.push(args);
    queuedGtag.apply(window, args);
  };
`;

async function installAnalyticsStubs(page) {
  await page.route('https://www.googletagmanager.com/gtag/js**', route =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: gaScriptStub })
  );
  await page.route('https://www.google-analytics.com/**', route => route.abort());
  await page.route('https://seetefl.com/**', route => route.abort());
  await page.route('https://www.seetefl.com/**', route => route.abort());
  await page.route('https://www.worldtesolacademy.com/**', route => route.abort());
}

async function analyticsCalls(page) {
  return page.evaluate(() => window.__gaCalls || []);
}

async function providerEvents(page) {
  const calls = await analyticsCalls(page);
  return calls.filter(call => call[0] === 'event' && call[1] === 'provider_outbound_click');
}

test('first visit and declined analytics do not load the GA tag or send clicks', async ({ page }) => {
  await installAnalyticsStubs(page);
  const gaScriptRequests = [];
  page.on('request', request => {
    if (request.url().includes('googletagmanager.com/gtag/js')) gaScriptRequests.push(request.url());
  });

  await page.goto(`${baseUrl}/tefl-course-comparison-thailand/`);
  await expect(page.getByRole('button', { name: 'Decline' })).toBeVisible();
  expect(gaScriptRequests).toHaveLength(0);

  await page.getByRole('button', { name: 'Decline' }).click();
  expect(await page.evaluate(() => localStorage.getItem('siamtefl_analytics_consent'))).toBe('denied');
  expect(gaScriptRequests).toHaveLength(0);

  await page.locator('a[href="https://seetefl.com/"]').first().click();
  expect(gaScriptRequests).toHaveLength(0);
  expect(await analyticsCalls(page)).toHaveLength(0);
});

test('consent gates page setup and sends one minimal outbound event per provider click', async ({ page }) => {
  await installAnalyticsStubs(page);
  const gaScriptRequests = [];
  page.on('request', request => {
    if (request.url().includes('googletagmanager.com/gtag/js')) gaScriptRequests.push(request.url());
  });

  await page.goto(`${baseUrl}/tefl-course-comparison-thailand/`);
  await expect(page.getByRole('button', { name: 'Allow analytics' })).toBeVisible();
  expect(gaScriptRequests).toHaveLength(0);

  await page.getByRole('button', { name: 'Allow analytics' }).click();
  await page.waitForFunction(() => Array.isArray(window.__gaCalls));
  expect(await page.evaluate(id => window.__gaCalls.some(call => call[0] === 'config' && call[1] === id), gaMeasurementId)).toBe(true);
  expect(gaScriptRequests).toHaveLength(1);

  await page.locator('a[href="https://seetefl.com/"]').first().click();
  let events = await providerEvents(page);
  expect(events).toHaveLength(1);
  expect(events[0]).toEqual(['event', 'provider_outbound_click', {
    provider: 'see_tefl',
    placement: 'comparison_hub',
    destination: 'seetefl.com'
  }]);

  await page.locator('a[href="https://www.worldtesolacademy.com/"]').first().click();
  events = await providerEvents(page);
  expect(events).toHaveLength(2);
  expect(events[1]).toEqual(['event', 'provider_outbound_click', {
    provider: 'world_tesol_academy',
    placement: 'comparison_hub',
    destination: 'www.worldtesolacademy.com'
  }]);

  await page.goto(`${baseUrl}/see-tefl-chiang-mai-review/`);
  await page.waitForFunction(() => Array.isArray(window.__gaCalls));
  await page.locator('a[href="https://seetefl.com/"]').first().click();
  events = await providerEvents(page);
  expect(events).toHaveLength(1);
  expect(events[0][2].placement).toBe('provider_review');

  await page.goto(`${baseUrl}/world-tesol-academy-review/`);
  await page.waitForFunction(() => Array.isArray(window.__gaCalls));
  await page.locator('a[href="https://www.worldtesolacademy.com/"]').first().click();
  events = await providerEvents(page);
  expect(events).toHaveLength(1);
  expect(events[0][2]).toEqual({
    provider: 'world_tesol_academy',
    placement: 'provider_review',
    destination: 'www.worldtesolacademy.com'
  });

  await page.goto(`${baseUrl}/essential-tefl-review/`);
  await page.waitForFunction(() => Array.isArray(window.__gaCalls));
  await page.locator('a[data-affiliate]').first().click();
  const calls = await analyticsCalls(page);
  expect(calls.filter(call => call[0] === 'event' && call[1] === 'affiliate_click')).toHaveLength(1);
  expect(calls.some(call => call[0] === 'event' && call[1] === 'provider_outbound_click')).toBe(false);
});
