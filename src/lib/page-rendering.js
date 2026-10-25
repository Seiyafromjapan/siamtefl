const breadcrumbHubs = {
  '/teach-english-thailand-no-experience/': { path: '/teach-english-thailand-no-experience/', label: 'Start Here' },
  '/where-to-find-teaching-jobs-thailand/': { path: '/where-to-find-teaching-jobs-thailand/', label: 'Find a Job' },
  '/move-to-thailand-before-finding-teaching-job/': { path: '/where-to-find-teaching-jobs-thailand/', label: 'Find a Job' },
  '/how-to-choose-tefl-course-thailand/': { path: '/how-to-choose-tefl-course-thailand/', label: 'Choose TEFL' },
  '/tefl-course-comparison-thailand/': { path: '/tefl-course-comparison-thailand/', label: 'Compare TEFL' },
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
  '/tefl-course-comparison-thailand/': 'tefl',
  '/see-tefl-chiang-mai-review/': 'tefl',
  '/world-tesol-academy-review/': 'tefl',
  '/120-hour-tefl-certificate-thailand/': 'tefl',
  '/online-vs-in-person-tefl-thailand/': 'tefl',
  '/120-hour-vs-level-5-tefl-thailand/': 'tefl',
  '/standard-vs-all-in/': 'tefl',
  '/celta-vs-tefl-thailand/': 'tefl',
  '/tefl-job-placement-guarantee-thailand/': 'tefl',
  '/tefl-course-deposit-refund-thailand/': 'tefl',
  '/essential-tefl-review/': 'tefl',
  '/first-time-english-teacher-salary-thailand/': 'budget',
  '/can-you-save-money-teaching-english-thailand/': 'budget',
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
  tefl: breadcrumbHubs['/tefl-course-comparison-thailand/'],
  budget: breadcrumbHubs['/money-to-move-to-thailand-to-teach/'],
  teach: breadcrumbHubs['/teaching-large-classes-thailand/']
};

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function cellText(cell) {
  return cell.replace(/<[^>]+>/g, '').replaceAll('&amp;', '&').trim();
}

function amountFromCell(cell) {
  const amount = cellText(cell).match(/[฿]?\s*([\d,]+)/)?.[1];
  return amount ? Number(amount.replaceAll(',', '')) : null;
}

export function renderSavingsScenarioVisual(page) {
  const marker = '<!-- SAVINGS_SCENARIO_VISUAL -->';
  if (page.path !== '/can-you-save-money-teaching-english-thailand/' || !page.content.includes(marker)) {
    return page.content;
  }
  const table = page.content.match(/<table class="price-table">([\s\S]*?)<\/table>/)?.[1];
  if (!table) return page.content.replace(marker, '');
  const rows = [...table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(([, row]) =>
    [...row.matchAll(/<th[^>]*>([\s\S]*?)<\/th>|<td[^>]*>([\s\S]*?)<\/td>/g)].map(([, th, td]) => th ?? td)
  );
  const headings = rows[0]?.slice(1).map(cellText) ?? [];
  const values = Object.fromEntries(rows.slice(1).map((row) => [cellText(row[0] ?? ''), row.slice(1)]));
  const salaries = headings.map((heading, index) => ({
    salary: heading.match(/฿[\d,]+/)?.[0] ?? heading,
    tax: amountFromCell(values['Estimated income tax / month*']?.[index] ?? ''),
    costs: ['Rent and utilities', 'Food and household basics', 'Local transport and phone', 'Health, personal, work and visa reserve', 'Social life and local trips']
      .reduce((sum, label) => sum + (amountFromCell(values[label]?.[index] ?? '') ?? 0), 0),
    left: amountFromCell(values['Illustrative amount left']?.[index] ?? '')
  }));
  const maxLeft = Math.max(...salaries.map(({ left }) => left ?? 0), 1);
  const cards = salaries.map(({ salary, tax, costs, left }) => {
    const width = Math.max(4, Math.round((left / maxLeft) * 100));
    const money = (value) => `฿${value.toLocaleString('en-US')}`;
    return `<li class="savings-card"><h3>${escapeHtml(salary)} <span>gross / month</span></h3><dl><div><dt>Estimated tax</dt><dd>${money(tax)}</dd></div><div><dt>Budgeted costs</dt><dd>${money(costs)}</dd></div><div class="savings-left"><dt>Illustrative amount left</dt><dd>${money(left)}</dd></div></dl><div class="savings-bar" role="img" aria-label="Illustrative amount left: ${money(left)} per month"><span style="width:${width}%"></span></div></li>`;
  }).join('');
  return page.content.replace(marker, `<section class="savings-visual" aria-label="Illustrative monthly savings scenarios"><p class="eyebrow">Illustrative scenarios</p><ul>${cards}</ul><p class="table-hint">Amounts are taken from the table above. The bar compares the illustrative amount left after modeled tax and listed costs; it is not a guaranteed saving.</p></section>`);
}

export function addBreadcrumbs(page) {
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
    content: page.path === '/' && !oldNav ? `${nav}${page.content}` : oldNav ? page.content.replace(oldNav[0], nav) : `${nav}${page.content}`,
    schema: { '@context': 'https://schema.org', '@graph': graph }
  };
}
