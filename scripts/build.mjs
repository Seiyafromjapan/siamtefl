import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const dist = join(root, 'dist');
const base = await readFile(join(root, 'src/site.js'), 'utf8');
const css = await readFile(join(root, 'src/styles.css'), 'utf8');
const js = await readFile(join(root, 'src/app.js'), 'utf8');
const pages = JSON.parse(await readFile(join(root, 'src/pages.json'), 'utf8'));
const affiliate = 'https://www.essentialtefl.com/?ref=suThaiJapan';

const breadcrumbHubs = {
  '/teach-english-thailand-no-experience/': { path: '/teach-english-thailand-no-experience/', label: 'Start Here' },
  '/where-to-find-teaching-jobs-thailand/': { path: '/where-to-find-teaching-jobs-thailand/', label: 'Find a Job' },
  '/how-to-choose-tefl-course-thailand/': { path: '/how-to-choose-tefl-course-thailand/', label: 'Choose TEFL' },
  '/money-to-move-to-thailand-to-teach/': { path: '/money-to-move-to-thailand-to-teach/', label: 'Pay & Budget' },
  '/teaching-large-classes-thailand/': { path: '/teaching-large-classes-thailand/', label: 'Teach & Settle' }
};
const clusterFor = {
  '/teach-english-thailand-no-experience/': 'start',
  '/teach-english-thailand-non-native-speaker/': 'start',
  '/thailand-teacher-visa-work-permit/': 'start',
  '/where-to-find-teaching-jobs-thailand/': 'jobs',
  '/too-late-apply-teaching-jobs-thailand/': 'jobs',
  '/teaching-agency-vs-direct-hire-thailand/': 'jobs',
  '/thailand-teaching-job-application-documents/': 'jobs',
  '/cv-resume-teaching-jobs-thailand/': 'jobs',
  '/thailand-teaching-interview-demo-lesson/': 'jobs',
  '/thailand-teaching-contract-checklist/': 'jobs',
  '/how-long-after-tefl-to-get-teaching-job-thailand/': 'jobs',
  '/do-you-need-tefl-to-teach-in-thailand/': 'tefl',
  '/how-to-choose-tefl-course-thailand/': 'tefl',
  '/120-hour-tefl-certificate-thailand/': 'tefl',
  '/online-vs-in-person-tefl-thailand/': 'tefl',
  '/120-hour-vs-level-5-tefl-thailand/': 'tefl',
  '/standard-vs-all-in/': 'tefl',
  '/celta-vs-tefl-thailand/': 'tefl',
  '/tefl-job-placement-guarantee-thailand/': 'tefl',
  '/tefl-course-deposit-refund-thailand/': 'tefl',
  '/essential-tefl-review/': 'tefl',
  '/first-time-english-teacher-salary-thailand/': 'budget',
  '/can-you-live-in-bangkok-on-35000-baht-teaching-salary/': 'budget',
  '/tefl-bangkok-cost/': 'budget',
  '/money-to-move-to-thailand-to-teach/': 'budget',
  '/calculator/': 'budget',
  '/thailand-teacher-school-holiday-pay/': 'budget',
  '/teaching-large-classes-thailand/': 'teach',
  '/teach-english-thailand-without-speaking-thai/': 'teach',
  '/thailand-teacher-visa-work-permit/': 'start'
};
const hubByCluster = {
  start: breadcrumbHubs['/teach-english-thailand-no-experience/'],
  jobs: breadcrumbHubs['/where-to-find-teaching-jobs-thailand/'],
  tefl: breadcrumbHubs['/how-to-choose-tefl-course-thailand/'],
  budget: breadcrumbHubs['/money-to-move-to-thailand-to-teach/'],
  teach: breadcrumbHubs['/teaching-large-classes-thailand/']
};
function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
function breadcrumbData(page) {
  const oldNav = page.content.match(/<nav class="breadcrumbs"[^>]*>([\s\S]*?)<\/nav>/i);
  const labels = oldNav ? [...oldNav[1].matchAll(/<span[^>]*>([\s\S]*?)<\/span>/gi)] : [];
  const current = (labels.at(-1)?.[1] || page.title.replace(/\s*\|\s*SiamTEFL$/, ''))
    .replace(/<[^>]+>/g, '').replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').trim();
  const hub = hubByCluster[clusterFor[page.path]];
  const items = [{ name: 'Home', path: '/' }];
  if (hub && hub.path !== page.path) items.push({ name: hub.label, path: hub.path });
  items.push({ name: current, path: page.path });
  const nav = `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${items.map((item, index) => {
    const last = index === items.length - 1;
    const label = escapeHtml(item.name);
    return `<li>${last ? `<span aria-current="page">${label}</span>` : `<a href="${item.path}">${label}</a>`}</li>`;
  }).join('')}</ol></nav>`;
  const schema = structuredClone(page.schema || {});
  const graph = Array.isArray(schema['@graph']) ? schema['@graph'].filter(item => item['@type'] !== 'BreadcrumbList') : [schema];
  graph.push({
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.name, item: `https://siamtefl.com${item.path}`
    }))
  });
  return {
    nav,
    content: oldNav ? page.content.replace(oldNav[0], nav) : `${nav}${page.content}`,
    schema: { '@context': 'https://schema.org', '@graph': graph }
  };
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const page of pages) {
  const pageDir = page.path === '/' ? dist : join(dist, page.path.slice(1));
  await mkdir(pageDir, { recursive: true });
  const isArticle = page.schema?.['@type'] === 'Article'
    || page.schema?.['@graph']?.some(item => item['@type'] === 'Article');
  const articleSchema = isArticle
    ? (page.schema['@type'] === 'Article' ? page.schema : page.schema['@graph'].find(item => item['@type'] === 'Article'))
    : null;
  const articleMeta = articleSchema
    ? `<meta property="article:published_time" content="${articleSchema.datePublished || ''}">\n  <meta property="article:modified_time" content="${articleSchema.dateModified || ''}">`
    : '';
  const html = base
    .replaceAll('{{TITLE}}', page.title)
    .replaceAll('{{DESCRIPTION}}', page.description)
    .replaceAll('{{OG_TITLE}}', page.ogTitle || page.title)
    .replaceAll('{{OG_DESCRIPTION}}', page.ogDescription || page.description)
    .replaceAll('{{OG_TYPE}}', isArticle ? 'article' : 'website')
    .replaceAll('{{ARTICLE_META}}', articleMeta)
    .replaceAll('{{CANONICAL}}', `https://siamtefl.com${page.path}`)
    .replaceAll('{{PATH}}', page.path)
    .replaceAll('{{KEYWORDS}}', page.keywords || 'TEFL Thailand, TEFL Bangkok, teach English Thailand')
    .replaceAll('{{OG_IMAGE}}', `https://siamtefl.com${page.socialImage || '/images/adult-class-social.jpg'}`)
    .replaceAll('{{OG_IMAGE_TYPE}}', page.socialImageType || 'image/jpeg')
    .replaceAll('{{OG_ALT}}', (page.socialImageAlt || 'Generic classroom stock photo of an instructor and adult learners; not a verified TEFL or Essential TEFL training location.').replaceAll('&', '&amp;').replaceAll('\"', '&quot;'))
    .replaceAll('{{OG_WIDTH}}', page.socialImageWidth || 1800)
    .replaceAll('{{OG_HEIGHT}}', page.socialImageHeight || 1013)
    .replaceAll('{{CONTENT}}', page.path === '/' ? page.content : breadcrumbData(page).content)
    .replaceAll('{{SCHEMA}}', JSON.stringify(page.path === '/' ? page.schema : breadcrumbData(page).schema))
    .replaceAll('{{CSS}}', css)
    .replaceAll('{{JS}}', js)
    .replaceAll('{{DATE}}', '2026-10-01')
    .replaceAll('{{AFFILIATE}}', affiliate);
  await writeFile(join(pageDir, 'index.html'), html);
}

await writeFile(join(dist, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://siamtefl.com/sitemap.xml\n');
await writeFile(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(p => `  <url><loc>https://siamtefl.com${p.path}</loc><lastmod>${p.schema?.dateModified || p.schema?.['@graph']?.find(item => item['@type'] === 'Article')?.dateModified || '2026-10-01'}</lastmod><changefreq>${p.path === '/' ? 'weekly' : 'monthly'}</changefreq><priority>${p.path === '/' ? '1.0' : '0.8'}</priority></url>`).join('\n')}\n</urlset>\n`);
await writeFile(join(dist, '404.html'), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Page not found | SiamTEFL</title><link rel="stylesheet" href="/assets/site.css"><main class="wrap section"><p class="eyebrow">404 · LOST IN BANGKOK?</p><h1>This page took a wrong turn.</h1><p>Head back to the decision guide and find your route.</p><a class="button" href="/">Explore SiamTEFL</a></main>`);
await mkdir(join(dist, 'assets'), { recursive: true });
await cp(join(root, 'public'), dist, { recursive: true });
await writeFile(join(dist, 'assets/site.css'), css);
await writeFile(join(dist, 'assets/app.js'), js);
await writeFile(join(dist, 'CNAME'), 'siamtefl.com\n');
await writeFile(join(dist, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Cache-Control: public, max-age=3600\n/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n');
console.log(`Built ${pages.length} pages into dist/`);
