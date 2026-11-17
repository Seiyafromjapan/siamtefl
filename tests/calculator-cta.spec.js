import { test, expect } from '@playwright/test';

const base = 'http://127.0.0.1:4173';
const referral = 'https://www.essentialtefl.com/?ref=suThaiJapan';

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`calculator course CTA follows selection on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(`${base}/calculator/`);
    const course = page.locator('#course');
    const cta = page.locator('[data-calculator-course-link]');
    const total = page.locator('#calc-total');

    await expect(course).toHaveValue('standard');
    await expect(cta).toHaveAttribute('href', referral);
    await expect(cta).toHaveAttribute('rel', 'sponsored nofollow noopener');
    await expect(cta).toHaveAttribute('target', '_blank');
    await expect(cta).toHaveAttribute('data-affiliate');
    await expect(cta).toHaveAttribute('data-placement', 'calculator-result');
    const initialTotal = await total.textContent();

    await course.selectOption('level5');
    await expect(cta).toHaveAttribute('href', referral);
    await expect(cta).toContainText('View in-person course details');
    await expect(total).not.toHaveText(initialTotal);
    await course.selectOption('standard');
    await expect(cta).toHaveAttribute('href', referral);

    for (const option of ['internship', 'allin', 'custom']) {
      await course.selectOption(option);
      await expect(cta).toHaveAttribute('href', 'https://www.essentialtefl.com/courses');
      await expect(cta).toHaveAttribute('rel', 'noopener');
      await expect(cta).not.toHaveAttribute('data-affiliate');
      await expect(cta).not.toHaveAttribute('data-placement');
      await course.selectOption('level5');
      await expect(cta).toHaveAttribute('href', referral);
      await expect(cta).toHaveAttribute('data-placement', 'calculator-result');
    }

    await page.locator('#food').fill('12500');
    await expect(total).not.toHaveText(initialTotal);
    await page.reload();
    await expect(course).toHaveValue('standard');
    await expect(cta).toHaveAttribute('href', referral);
    await expect(cta).toHaveAttribute('data-affiliate');
  });
}

test('calculator affiliate click respects consent and sends one placement event', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.__gaEvents = [];
    window.gtag = (...args) => window.__gaEvents.push(args);
    localStorage.setItem('siamtefl_analytics_consent', 'denied');
  });
  await page.goto(`${base}/calculator/`);
  const cta = page.locator('[data-calculator-course-link]');
  await expect(cta).toHaveAttribute('data-affiliate');
  await cta.evaluate(el => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
  await expect.poll(() => page.evaluate(() => window.__gaEvents.filter(args => args[0] === 'event').length)).toBe(0);

  await page.locator('#privacy-settings').click();
  await page.locator('[data-analytics-consent="granted"]').click();
  await cta.evaluate(el => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
  await expect.poll(() => page.evaluate(() => window.__gaEvents.filter(args => args[0] === 'event').length)).toBe(1);
  const event = await page.evaluate(() => window.__gaEvents.find(args => args[0] === 'event'));
  expect(event[1]).toBe('affiliate_click');
  expect(event[2].placement).toBe('calculator-result');
});
