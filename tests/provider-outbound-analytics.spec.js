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
  await page.addInitScript(() => {
    document.addEventListener('click', event => {
      if (event.target.closest('a[href]')) event.preventDefault();
    }, true);
  });
  await page.route('https://www.googletagmanager.com/gtag/js**', route =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: gaScriptStub })
  );
  await page.route('https://www.google-analytics.com/**', route => route.abort());
  await page.route('https://seetefl.com/**', route => route.abort());
  await page.route('https://www.seetefl.com/**', route => route.abort());
  await page.route('https://www.worldtesolacademy.com/**', route => route.abort());
  await page.route('https://essentialtefl.com/**', route => route.abort());
  await page.route('https://www.essentialtefl.com/**', route => route.abort());
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

  await page.locator('a[href^="https://seetefl.com/"]').first().click();
  expect(gaScriptRequests).toHaveLength(0);
  expect(await analyticsCalls(page)).toHaveLength(0);

  await page.goto(`${baseUrl}/see-tefl-chiang-mai-review/`);
  await page.locator('a[data-affiliate][data-provider="see_tefl"]').click();
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

  await page.locator('a[href^="https://seetefl.com/"]').first().click();
  let events = await providerEvents(page);
  expect(events).toHaveLength(1);
  expect(events[0]).toEqual(['event', 'provider_outbound_click', {
    provider: 'see_tefl',
    placement: 'comparison_hub',
    destination: 'seetefl.com'
  }]);

  await page.locator('a[href^="https://www.worldtesolacademy.com/"]').first().click();
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

  await page.locator('a[data-affiliate][data-provider="see_tefl"]').click();
  const seeAffiliateEvents = (await analyticsCalls(page)).filter(call => call[0] === 'event' && call[1] === 'affiliate_click');
  expect(seeAffiliateEvents).toHaveLength(1);
  expect(seeAffiliateEvents[0][2]).toMatchObject({
    provider: 'see_tefl',
    page_path: '/see-tefl-chiang-mai-review/',
    placement: 'provider_review',
    destination: 'seetefl.com'
  });

  await page.goto(`${baseUrl}/world-tesol-academy-review/`);
  await page.waitForFunction(() => Array.isArray(window.__gaCalls));
  await page.locator('a[href^="https://www.worldtesolacademy.com/"]').first().click();
  events = await providerEvents(page);
  const wtaAffiliateEvents = (await analyticsCalls(page)).filter(call => call[0] === 'event' && call[1] === 'affiliate_click');
  expect(wtaAffiliateEvents).toHaveLength(1);
  expect(wtaAffiliateEvents[0][2]).toMatchObject({
    provider: 'world_tesol_academy',
    page_path: '/world-tesol-academy-review/',
    placement: 'review-120-hour',
    destination: 'www.worldtesolacademy.com'
  });
  expect(wtaAffiliateEvents).toHaveLength(1);

  await page.goto(`${baseUrl}/essential-tefl-review/`);
  await page.waitForFunction(() => Array.isArray(window.__gaCalls));
  await page.locator('a[data-affiliate]').first().click();
  const calls = await analyticsCalls(page);
  expect(calls.filter(call => call[0] === 'event' && call[1] === 'affiliate_click')).toHaveLength(1);
  expect(calls.some(call => call[0] === 'event' && call[1] === 'provider_outbound_click')).toBe(false);

  await page.locator('.next-steps a[href="/120-hour-vs-level-5-tefl-thailand/"]').first().click();
  const internalCalls = await analyticsCalls(page);
  expect(internalCalls.filter(call => call[0] === 'event' && call[1] === 'internal_navigation_click')).toHaveLength(1);
});

test('World TESOL Academy review has disclosed, accessible affiliate links to each course', async ({ page }) => {
  await page.goto(`${baseUrl}/world-tesol-academy-review/`);
  const links = page.locator('a[data-affiliate][data-provider="world_tesol_academy"]');
  await expect(links).toHaveCount(2);
  await expect(links.nth(0)).toHaveAttribute('href', 'https://www.worldtesolacademy.com/tesol-course-enrollment/?study=140057');
  await expect(links.nth(1)).toHaveAttribute('href', 'https://www.worldtesolacademy.com/level-5-tesol-diploma/?study=140057');
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /sponsored/);
    await expect(link).toHaveAttribute('rel', /noopener/);
    await expect(link).toHaveAttribute('aria-label', /new tab/);
  }
  await expect(page.locator('.affiliate-options a[href="/affiliate-disclosure/"]')).toHaveCount(1);
});

test('review and comparison pages consistently disclose approved SEE TEFL and WTA affiliate links', async ({ page }) => {
  for (const route of ['/tefl-course-comparison-thailand/','/see-tefl-chiang-mai-review/','/world-tesol-academy-review/']) {
    await page.goto(`${baseUrl}${route}`);
    await expect(page.locator('body')).not.toContainText(/pending|application pending|no referral link on this page|currently has no referral link/i);
  }
  await page.goto(`${baseUrl}/`);
  await expect(page.locator('body')).toContainText('approved affiliate relationships');
  await page.goto(`${baseUrl}/see-tefl-chiang-mai-review/`);
  const seeLink = page.locator('a[data-affiliate][data-provider="see_tefl"]').first();
  await expect(seeLink).toHaveAttribute('href', 'https://seetefl.com?ap_id=SiamTEFL');
  await expect(seeLink).toHaveAttribute('rel', /sponsored/);
});
