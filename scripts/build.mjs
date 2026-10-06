import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const dist = join(root, 'dist');
const base = await readFile(join(root, 'src/site.js'), 'utf8');
const css = await readFile(join(root, 'src/styles.css'), 'utf8');
const js = await readFile(join(root, 'src/app.js'), 'utf8');
const pages = JSON.parse(await readFile(join(root, 'src/pages.json'), 'utf8'));
const affiliate = 'https://www.essentialtefl.com/?ref=suThaiJapan';

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const page of pages) {
  const pageDir = page.path === '/' ? dist : join(dist, page.path.slice(1));
  await mkdir(pageDir, { recursive: true });
  const html = base
    .replaceAll('{{TITLE}}', page.title)
    .replaceAll('{{DESCRIPTION}}', page.description)
    .replaceAll('{{OG_TITLE}}', page.ogTitle || page.title)
    .replaceAll('{{OG_DESCRIPTION}}', page.ogDescription || page.description)
    .replaceAll('{{CANONICAL}}', `https://siamtefl.com${page.path}`)
    .replaceAll('{{PATH}}', page.path)
    .replaceAll('{{KEYWORDS}}', page.keywords || 'TEFL Thailand, TEFL Bangkok, teach English Thailand')
    .replaceAll('{{OG_IMAGE}}', `https://siamtefl.com${page.socialImage || '/images/adult-class-social.jpg'}`)
    .replaceAll('{{OG_IMAGE_TYPE}}', page.socialImageType || 'image/jpeg')
    .replaceAll('{{OG_ALT}}', (page.socialImageAlt || 'Generic classroom stock photo of an instructor and adult learners; not a verified TEFL or Essential TEFL training location.').replaceAll('&', '&amp;').replaceAll('\"', '&quot;'))
    .replaceAll('{{OG_WIDTH}}', page.socialImageWidth || 1800)
    .replaceAll('{{OG_HEIGHT}}', page.socialImageHeight || 1013)
    .replaceAll('{{CONTENT}}', page.content)
    .replaceAll('{{SCHEMA}}', JSON.stringify(page.schema || {}))
    .replaceAll('{{CSS}}', css)
    .replaceAll('{{JS}}', js)
    .replaceAll('{{DATE}}', '2026-10-01')
    .replaceAll('{{AFFILIATE}}', affiliate);
  await writeFile(join(pageDir, 'index.html'), html);
}

await writeFile(join(dist, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://siamtefl.com/sitemap.xml\n');
await writeFile(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(p => `  <url><loc>https://siamtefl.com${p.path}</loc><lastmod>${p.schema?.dateModified || '2026-10-01'}</lastmod><changefreq>${p.path === '/' ? 'weekly' : 'monthly'}</changefreq><priority>${p.path === '/' ? '1.0' : '0.8'}</priority></url>`).join('\n')}\n</urlset>\n`);
await writeFile(join(dist, '404.html'), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Page not found | SiamTEFL</title><link rel="stylesheet" href="/assets/site.css"><main class="wrap section"><p class="eyebrow">404 · LOST IN BANGKOK?</p><h1>This page took a wrong turn.</h1><p>Head back to the decision guide and find your route.</p><a class="button" href="/">Explore SiamTEFL</a></main>`);
await mkdir(join(dist, 'assets'), { recursive: true });
await cp(join(root, 'public'), dist, { recursive: true });
await writeFile(join(dist, 'assets/site.css'), css);
await writeFile(join(dist, 'assets/app.js'), js);
await writeFile(join(dist, 'CNAME'), 'siamtefl.com\n');
await writeFile(join(dist, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Cache-Control: public, max-age=3600\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n');
console.log(`Built ${pages.length} pages into dist/`);
