import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import pages from '../src/pages.json' with { type: 'json' };

const dist = new URL('../dist/', import.meta.url).pathname;
const paths = pages.map((page) => page.path);
assert.equal(new Set(paths).size, paths.length, 'src/pages.json contains duplicate paths');
assert.equal(paths[0], '/', 'The homepage must remain the first page entry');

const missingRoutes = [];
const brokenLocalLinks = [];
for (const page of pages) {
  const outputPath = join(dist, page.path === '/' ? 'index.html' : `${page.path.slice(1)}index.html`);
  let html;
  try {
    html = await readFile(outputPath, 'utf8');
  } catch {
    missingRoutes.push(page.path);
    continue;
  }

  const expectedCanonical = `https://siamtefl.com${page.path}`;
  assert.ok(html.includes(`<link rel="canonical" href="${expectedCanonical}">`), `Canonical mismatch: ${page.path}`);
  assert.ok(html.includes(`<title>${page.title.replaceAll('&', '&amp;')}</title>`), `Title missing: ${page.path}`);
  assert.ok(html.includes(`name="description" content="${page.description.replaceAll('&', '&amp;')}"`), `Description missing: ${page.path}`);
  assert.ok(html.includes('property="og:title"'), `Open Graph title missing: ${page.path}`);
  assert.ok(html.includes('property="og:description"'), `Open Graph description missing: ${page.path}`);
  assert.ok(html.includes('property="og:image"'), `Open Graph image missing: ${page.path}`);
  assert.ok(html.includes('name="twitter:card" content="summary_large_image"'), `Twitter card missing: ${page.path}`);
  assert.ok(html.includes('type="application/ld+json"'), `Structured data missing: ${page.path}`);
  assert.ok(html.includes('id="main"'), `Main content missing: ${page.path}`);
  assert.ok(!html.includes('{{AFFILIATE}}'), `Unresolved template token: ${page.path}`);

  for (const [, target] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (!target.startsWith('/') || target.startsWith('//')) continue;
    const pathname = decodeURIComponent(new URL(target, 'https://siamtefl.com').pathname);
    if (paths.includes(pathname)) continue;
    const filePath = join(dist, pathname.replace(/^\/+/, ''));
    try {
      await stat(filePath);
    } catch {
      brokenLocalLinks.push(`${page.path} -> ${target}`);
    }
  }
}

assert.deepEqual(missingRoutes, [], `Generated pages missing: ${missingRoutes.join(', ')}`);
assert.deepEqual(brokenLocalLinks, [], `Broken local links: ${brokenLocalLinks.join(', ')}`);

const sitemap = await readFile(join(dist, 'sitemap.xml'), 'utf8');
for (const path of paths) assert.ok(sitemap.includes(`<loc>https://siamtefl.com${path}</loc>`), `Sitemap route missing: ${path}`);
assert.equal((sitemap.match(/<url>/g) || []).length, pages.length, 'Sitemap route count does not match pages.json');
assert.match(await readFile(join(dist, 'robots.txt'), 'utf8'), /Sitemap: https:\/\/siamtefl\.com\/sitemap\.xml/);
assert.equal((await readFile(join(dist, 'CNAME'), 'utf8')).trim(), 'siamtefl.com');
assert.equal(await readFile(join(dist, 'assets/app.js'), 'utf8'), await readFile(new URL('../src/app.js', import.meta.url), 'utf8'), 'App script was changed during output');
assert.equal(await readFile(join(dist, 'assets/site.css'), 'utf8'), await readFile(new URL('../src/styles.css', import.meta.url), 'utf8'), 'Stylesheet was changed during output');

const app = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
assert.ok(app.includes("const consentKey='siamtefl_analytics_consent'"), 'Analytics consent storage key changed');
assert.ok(app.includes("event:'affiliate_click'"), 'affiliate_click tracking event is missing');
assert.ok(app.includes('G-90601G33WS'), 'GA4 measurement ID is missing');

console.log(`Verified ${pages.length} routes, SEO metadata, structured data, sitemap, local links, GA4 consent and affiliate tracking.`);
