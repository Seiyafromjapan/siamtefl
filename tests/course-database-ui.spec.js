import { test, expect } from '@playwright/test';
import pages from '../src/pages.json' with { type: 'json' };

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';
const comparisonPath = '/tefl-course-comparison-thailand/';
const expectedPage = pages.find(page => page.path === comparisonPath);
const viewports = [1440, 768, 390, 320];

for (const width of viewports) {
  test(`database comparison is readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 980 });
    const response = await page.goto(`${base}${comparisonPath}`);
    expect(response?.status()).toBe(200);
    const comparison = page.getByTestId('course-database-comparison');
    await expect(comparison).toBeVisible();
    await expect(comparison.locator('[data-provider-id]')).toHaveCount(4);
    await expect(comparison.locator('[data-course-id]')).toHaveCount(10);
    await expect(comparison).toContainText('Essential TEFL');
    await expect(comparison).toContainText('SEE TEFL');
    await expect(comparison).toContainText('World TESOL Academy');
    await expect(comparison).toContainText('TEFLen');
    await expect(comparison).toContainText('US$254');
    await expect(comparison).toContainText('US$339');
    await expect(comparison).toContainText('Official pages differ');
    await expect(comparison).toContainText('Not established in the reviewed pages.');
    await expect(comparison).toContainText('Terms & sources');
    await expect(comparison.locator('thead th')).toHaveCount(6);
    const terms = comparison.locator('details').first();
    await expect(terms).toHaveJSProperty('open', false);
    await terms.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(terms).toHaveJSProperty('open', true);
    await expect(terms.locator('.course-data-sources a').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    const table = comparison.locator('.snapshot-table');
    if (width <= 900) {
      await expect(comparison.locator('.table-swipe-hint')).toBeVisible();
      expect(await table.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
    } else {
      expect(await table.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    }

    await expect(page).toHaveTitle(expectedPage.title);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://siamtefl.com${comparisonPath}`);
    const affiliate = page.locator('a[data-affiliate][data-provider="teflen"][data-placement="comparison-table"]');
    await expect(affiliate).toHaveAttribute('href', 'https://teflen.com/siamtefl/');
    await expect(affiliate).toHaveAttribute('rel', 'sponsored nofollow noopener');
    await expect(affiliate).toHaveAttribute('target', '_blank');
    await expect(page.locator('main')).not.toContainText('COURSE_DATABASE_COMPARISON_TABLE');
  });
}

test('comparison data is present in static HTML when JavaScript is disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const response = await page.goto(`${base}${comparisonPath}`);
  expect(response?.status()).toBe(200);
  await expect(page.getByTestId('course-database-comparison').locator('[data-course-id]')).toHaveCount(10);
  await expect(page.getByTestId('course-database-comparison')).toContainText('฿50,000');
  await expect(page.getByTestId('course-database-comparison')).toContainText('US$1,395');
  await expect(page.getByTestId('course-database-comparison')).toContainText('US$254');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test('all review facts and source disclosures render without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  for (const [path, courseCount, requiredText] of [
    ['/essential-tefl-review/', 4, '฿45,000'],
    ['/see-tefl-chiang-mai-review/', 2, 'US$1,395'],
    ['/world-tesol-academy-review/', 2, 'GBP 29'],
    ['/teflen-review/', 2, 'US$254']
  ]) {
    const response = await page.goto(`${base}${path}`);
    expect(response?.status()).toBe(200);
    const panel = page.getByTestId('course-database-review-facts');
    await expect(panel.locator('[data-course-id]')).toHaveCount(courseCount);
    await expect(panel).toContainText(requiredText);
    await expect(panel.locator('details summary').first()).toBeVisible();
    await expect(page.locator('main')).not.toContainText('{{COURSE_FACT:');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await context.close();
});
