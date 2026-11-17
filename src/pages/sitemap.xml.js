import pages from '../pages.json';

function lastModified(page) {
  return page.schema?.dateModified
    || page.schema?.['@graph']?.find((item) => item['@type'] === 'Article')?.dateModified;
}

export function GET() {
  const urls = pages.map((page) => {
    const modified = lastModified(page);
    const lastmod = modified ? `<lastmod>${modified}</lastmod>` : '';
    return `  <url><loc>https://siamtefl.com${page.path}</loc>${lastmod}<changefreq>${page.path === '/' ? 'weekly' : 'monthly'}</changefreq><priority>${page.path === '/' ? '1.0' : '0.8'}</priority></url>`;
  });
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(sitemap, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
