import { test, expect } from '@playwright/test';

const articlePath = '/teaching-english-thailand-after-40/';
const screenshotDir = 'test-results/screenshots';

test('desktop 1440 by 900 renders article and key content', async ({ page }) => {
  const exceptions = [];
  page.on('pageerror', error => exceptions.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await page.goto(`http://127.0.0.1:4173${articlePath}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toContainText('Teaching English in Thailand after 40');

  const hero = page.locator('.page-hero img, figure img').first();
  await expect(hero).toBeVisible();
  await expect.poll(() => hero.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(page.locator('.age-40-article table.age-40-stack-table')).toHaveCount(3);
  await expect(page.locator('.budget-chart')).toBeVisible();
  await expect(page.locator('.budget-chart')).toContainText('฿35,000');
  await expect(page.locator('.budget-chart')).toContainText('฿30,000');
  await expect(page.locator('.budget-chart')).toContainText('฿5,000');
  await expect(page.locator('.career-checklist-items input[type="checkbox"]')).toHaveCount(7);
  const reviewCta = page.locator('a[href="/essential-tefl-review/"]').last();
  await reviewCta.scrollIntoViewIfNeeded();
  await expect(reviewCta).toBeVisible();
  expect(await reviewCta.getAttribute('href')).toBe('/essential-tefl-review/');
  await reviewCta.click();
  await expect(page).toHaveURL(/\/essential-tefl-review\/$/);
  await page.goBack();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `${screenshotDir}/desktop-1440.png`, fullPage: true });
  expect(exceptions).toEqual([]);
});

test('mobile 390 by 844 keeps content usable and checklist interactive', async ({ page }) => {
  const exceptions = [];
  page.on('pageerror', error => exceptions.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto(`http://127.0.0.1:4173${articlePath}`);
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1')).toBeVisible();
  const hero = page.locator('.page-hero img, figure img').first();
  await expect(hero).toBeVisible();
  await expect.poll(() => hero.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
  await expect(page.locator('.age-40-article table.age-40-stack-table')).toHaveCount(3);
  await expect(page.locator('.budget-chart')).toBeVisible();

  const checklist = page.locator('[data-career-checklist]');
  const boxes = checklist.locator('input[type="checkbox"]');
  const count = checklist.locator('[data-checklist-count]');
  const progress = checklist.locator('[data-checklist-progress]');
  await expect(boxes).toHaveCount(7);
  await boxes.nth(0).check();
  await boxes.nth(1).check();
  await expect(count).toHaveText('2 of 7 complete');
  await expect(progress).toHaveJSProperty('value', 2);
  await page.screenshot({ path: `${screenshotDir}/mobile-checklist.png`, fullPage: true });

  await boxes.nth(1).uncheck();
  await expect(count).toHaveText('1 of 7 complete');
  await expect(progress).toHaveJSProperty('value', 1);
  await boxes.nth(0).focus();
  await expect(boxes.nth(0)).toBeFocused();
  await page.keyboard.press('Space');
  await expect(boxes.nth(0)).not.toBeChecked();
  await expect(count).toHaveText('0 of 7 complete');
  await page.keyboard.press('Space');
  await expect(boxes.nth(0)).toBeChecked();
  await expect(count).toHaveText('1 of 7 complete');
  await checklist.locator('[data-checklist-reset]').click();
  await expect(count).toHaveText('0 of 7 complete');
  await expect(progress).toHaveJSProperty('value', 0);
  expect(await boxes.evaluateAll(inputs => inputs.every(input => !input.checked))).toBe(true);
  await expect(boxes.first()).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `${screenshotDir}/mobile-390.png`, fullPage: true });

  const reviewCta = page.locator('a[href="/essential-tefl-review/"]').last();
  await reviewCta.scrollIntoViewIfNeeded();
  await expect(reviewCta).toBeVisible();
  await expect(reviewCta).toHaveAttribute('href', '/essential-tefl-review/');
  await reviewCta.click();
  await expect(page).toHaveURL(/\/essential-tefl-review\/$/);
  expect(exceptions).toEqual([]);
});
