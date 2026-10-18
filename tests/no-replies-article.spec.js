import { test, expect } from '@playwright/test';

const articlePath = '/no-replies-teaching-jobs-thailand/';
const heroPath = '/images/waiting-for-teaching-job-reply.webp';
const flowPath = '/images/teaching-application-reply-diagnosis.svg';

for (const viewport of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
  test(`${viewport.name} no-replies article imagery, SEO and responsive layout`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const response = await page.goto(`http://127.0.0.1:4173${articlePath}`);
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toHaveText('Why Am I Not Getting Teaching Job Replies in Thailand?');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://siamtefl.com${articlePath}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /Applied for teaching jobs in Thailand/);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', `https://siamtefl.com${heroPath}`);
    await expect(page.locator('meta[property="og:image:type"]')).toHaveAttribute('content', 'image/webp');
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute('content', '1200');
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute('content', '630');
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /Bangkok apartment/);
    await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', `https://siamtefl.com${heroPath}`);

    const jsonLd = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
    const schema = (jsonLd['@graph'] || [jsonLd]).find(node => node['@type'] === 'Article');
    expect(schema).toBeTruthy();
    expect(schema.mainEntityOfPage).toBe(`https://siamtefl.com${articlePath}`);
    expect(schema.image).toBe(`https://siamtefl.com${heroPath}`);

    const hero = page.locator(`img[src="${heroPath}"]`);
    await expect(hero).toBeVisible();
    await expect(hero).toHaveAttribute('alt', /applicant checks a laptop in a Bangkok apartment/);
    await expect(hero).toHaveAttribute('width', '1200');
    await expect(hero).toHaveAttribute('height', '630');
    expect(await hero.evaluate(image => image.complete && image.naturalWidth === 1200 && image.naturalHeight === 630)).toBe(true);

    const flow = page.locator(`img[src="${flowPath}"]`);
    await flow.scrollIntoViewIfNeeded();
    await expect(flow).toBeVisible();
    await expect(flow).toHaveAttribute('loading', 'lazy');
    expect(await flow.evaluate(image => image.complete && image.naturalWidth === 760 && image.naturalHeight === 1420)).toBe(true);
    await expect(page.locator('details.reply-flow-text')).toContainText('Target suitable vacancies');
    await expect(page.locator('details.reply-flow-text')).toContainText('Send a polite follow-up');

    for (const href of [
      '/where-to-find-teaching-jobs-thailand/',
      '/cv-resume-teaching-jobs-thailand/',
      '/thailand-teaching-job-application-documents/',
      '/thailand-teaching-interview-demo-lesson/'
    ]) await expect(page.locator(`a[href="${href}"]`).first()).toHaveAttribute('href', href);

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}
