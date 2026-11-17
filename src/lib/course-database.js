import courseDatabase from '../data/course-database.json' with { type: 'json' };

export const COURSE_VERIFICATION_STATUSES = courseDatabase.verificationStatuses;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const requiredCourseFields = [
  'location', 'deliveryFormat', 'tuition', 'mandatoryAdditionalFees', 'promotionalPrice', 'promotionConditions', 'promotionExpiry',
  'qualification', 'accreditation', 'advertisedHours', 'guidedLearningHours',
  'totalQualificationTime', 'teachingPractice', 'courseDuration', 'jobSupport',
  'jobGuarantee', 'guaranteeConditions', 'deposit', 'balanceDue', 'refundPolicy', 'accommodation'
];
const evidenceStatuses = new Set(['primary_verified', 'provider_claim', 'conflicting_official_sources']);

function validUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function isDate(value) {
  if (typeof value !== 'string' || !datePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function walkMoney(value, path, errors) {
  if (!value || typeof value !== 'object') return;
  if (Object.hasOwn(value, 'amount')) {
    if (typeof value.amount !== 'number' || value.amount < 0) errors.push(`${path}.amount must be a non-negative number`);
    if (typeof value.currency !== 'string' || !/^[A-Z]{3}$/.test(value.currency)) errors.push(`${path}.currency must be an ISO-style 3-letter code`);
  }
  for (const [key, child] of Object.entries(value)) walkMoney(child, `${path}.${key}`, errors);
}

function validateEvidence(record, fieldPath, statuses, errors) {
  if (!record || typeof record !== 'object' || !Object.hasOwn(record, 'value')) {
    errors.push(`${fieldPath} must be an evidence object with a value property`);
    return;
  }
  if (!statuses.has(record.verificationStatus)) errors.push(`${fieldPath} has an unknown verificationStatus`);
  if (!isDate(record.lastCheckedDate)) errors.push(`${fieldPath}.lastCheckedDate must be a real YYYY-MM-DD date`);
  if (evidenceStatuses.has(record.verificationStatus) && !isDate(record.lastVerifiedDate)) errors.push(`${fieldPath}.lastVerifiedDate is required for verified evidence`);
  if (!evidenceStatuses.has(record.verificationStatus) && record.lastVerifiedDate !== null) errors.push(`${fieldPath}.lastVerifiedDate must be null until the value is verified`);
  if (record.sourceUrl !== null && record.sourceUrl !== undefined && !validUrl(record.sourceUrl)) errors.push(`${fieldPath}.sourceUrl must be an HTTPS URL or null`);
  if (evidenceStatuses.has(record.verificationStatus) && !validUrl(record.sourceUrl)) errors.push(`${fieldPath} needs an HTTPS source for its verification status`);
  if (record.verificationStatus === 'not_applicable' && record.value !== null) errors.push(`${fieldPath} must use null for not_applicable values`);
  if (record.verificationStatus === 'unverified' && record.value !== null && typeof record.verificationNotes !== 'string') errors.push(`${fieldPath} needs verificationNotes when an unverified value is present`);
  walkMoney(record.value, fieldPath, errors);
}

export function validateCourseDatabase(database = courseDatabase, affiliatePrograms = []) {
  const errors = [];
  if (!isDate(database.lastCheckedDate)) errors.push('database.lastCheckedDate must be a real YYYY-MM-DD date');
  const allowedStatuses = new Set(database.verificationStatuses || []);
  for (const status of ['primary_verified', 'provider_claim', 'conflicting_official_sources', 'unverified', 'not_applicable']) {
    if (!allowedStatuses.has(status)) errors.push(`verificationStatuses must include ${status}`);
  }
  for (const key of ['providers', 'courses']) if (!Array.isArray(database[key])) errors.push(`database.${key} must be an array`);
  if (!Array.isArray(database.providers) || !Array.isArray(database.courses)) return errors;

  const providerIds = new Set();
  for (const [index, provider] of database.providers.entries()) {
    const prefix = `providers[${index}]`;
    if (!provider.providerId || providerIds.has(provider.providerId)) errors.push(`${prefix}.providerId is missing or duplicated`);
    providerIds.add(provider.providerId);
    if (!provider.providerName) errors.push(`${prefix}.providerName is required`);
    if (!validUrl(provider.officialWebsite)) errors.push(`${prefix}.officialWebsite must be an HTTPS URL`);
    validateEvidence(provider.providerLocation, `${prefix}.providerLocation`, allowedStatuses, errors);
  }

  const courseIds = new Set();
  for (const [index, course] of database.courses.entries()) {
    const prefix = `courses[${index}]`;
    if (!course.courseId || courseIds.has(course.courseId)) errors.push(`${prefix}.courseId is missing or duplicated`);
    courseIds.add(course.courseId);
    if (!providerIds.has(course.providerId)) errors.push(`${prefix}.providerId references an unknown provider`);
    if (!course.courseName) errors.push(`${prefix}.courseName is required`);
    for (const field of requiredCourseFields) {
      validateEvidence(course[field], `${prefix}.${field}`, allowedStatuses, errors);
      if (field === 'promotionExpiry' && course[field]?.value !== null && !isDate(course[field]?.value)) {
        errors.push(`${prefix}.promotionExpiry.value must be a real YYYY-MM-DD date or null`);
      }
    }
    const balance = course.balanceDue?.value;
    if (balance?.calculation === 'tuition_minus_deposit') {
      const tuition = course.tuition?.value;
      const deposit = course.deposit?.value;
      if (!tuition || !deposit || tuition.currency !== deposit.currency || balance.currency !== tuition.currency || balance.amount !== tuition.amount - deposit.amount) {
        errors.push(`${prefix}.balanceDue calculated remainder must equal tuition minus a same-currency deposit`);
      }
    }
    for (const [variantIndex, variant] of (course.publishedPriceVariants || []).entries()) {
      const path = `${prefix}.publishedPriceVariants[${variantIndex}]`;
      walkMoney(variant.value, path, errors);
      if (!variant.value?.label || !isDate(variant.lastCheckedDate)) errors.push(`${path} needs a label and a real lastCheckedDate`);
      if (!['primary_verified', 'provider_claim', 'conflicting_official_sources', 'unverified'].includes(variant.verificationStatus)) errors.push(`${path}.verificationStatus is invalid`);
      if (evidenceStatuses.has(variant.verificationStatus) && (!validUrl(variant.sourceUrl) || !isDate(variant.lastVerifiedDate))) errors.push(`${path} needs an HTTPS source URL and verified date`);
    }
  }

  const affiliateIds = new Set();
  for (const [index, program] of affiliatePrograms.entries()) {
    const prefix = `affiliatePrograms[${index}]`;
    if (!providerIds.has(program.providerId)) errors.push(`${prefix}.providerId references an unknown provider`);
    if (affiliateIds.has(program.providerId)) errors.push(`${prefix}.providerId is duplicated`);
    affiliateIds.add(program.providerId);
    if (!['confirmed', 'unconfirmed', 'not_applicable'].includes(program.partnershipStatus)) errors.push(`${prefix}.partnershipStatus is invalid`);
    if (typeof program.disclosureRequired !== 'boolean') errors.push(`${prefix}.disclosureRequired must be boolean`);
    for (const url of program.affiliateUrls || []) if (!validUrl(url)) errors.push(`${prefix} contains an invalid affiliate URL`);
    for (const courseId of program.approvedCourseIds || []) if (!courseIds.has(courseId)) errors.push(`${prefix} approves an unknown courseId`);
    for (const forbidden of ['commissionRate', 'contract', 'credentials', 'personalData']) if (Object.hasOwn(program, forbidden)) errors.push(`${prefix} must not contain internal field ${forbidden}`);
  }

  return errors;
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function money(value) {
  if (!value || typeof value.amount !== 'number') return 'Not verified';
  const amount = value.amount.toLocaleString('en-US');
  const prefix = value.currency === 'THB' ? '฿' : value.currency === 'USD' ? 'US$' : `${value.currency} `;
  return `${prefix}${amount}`;
}

function displayDate(value) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function paymentDisplay(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value?.variants)) return `${value.variants.map(item => `${money(item)}${item.condition ? ` (${item.condition})` : ''}`).join(' / ')}${value.due ? ` · ${value.due}` : ''}`;
  if (value && typeof value.amount === 'number') return `${money(value)}${value.due ? ` · ${value.due}` : ''}`;
  return 'Not confirmed';
}

function sourceLink(label, evidence) {
  if (!evidence?.sourceUrl) return '';
  return `<a href="${escapeHtml(evidence.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
}

function displayStatus(status) {
  return ({
    primary_verified: 'Published by provider',
    provider_claim: 'Provider statement',
    conflicting_official_sources: 'Official pages differ',
    unverified: 'Not confirmed',
    not_applicable: 'Not applicable'
  })[status] || 'Not verified';
}

function courseHours(course) {
  const items = [];
  if (course.advertisedHours.value !== null) items.push(`${course.advertisedHours.value} advertised hours`);
  if (course.guidedLearningHours.value !== null) items.push(`${course.guidedLearningHours.value} guided learning hours`);
  if (course.totalQualificationTime.value !== null) items.push(`${course.totalQualificationTime.value} total qualification time`);
  const hasConflict = [course.advertisedHours, course.guidedLearningHours, course.totalQualificationTime]
    .some(item => item.verificationStatus === 'conflicting_official_sources');
  const status = hasConflict
    ? '<span class="course-data-status">Official pages differ; ask for the hour breakdown.</span>'
    : '';
  return `${items.length ? items.map(escapeHtml).join('; ') : 'Hours not verified'}${status}`;
}

function coursePrice(course) {
  const tuition = course.tuition.value;
  const regular = tuition ? money(tuition) : 'Not verified';
  const priceType = tuition?.priceType ? `<span class="course-data-note">${escapeHtml(tuition.priceType)}</span>` : '';
  const promotional = course.promotionalPrice.value
    ? `<p><strong>Partner page:</strong> ${money(course.promotionalPrice.value)} <span class="course-data-note">${escapeHtml(course.promotionalPrice.value.conditions || 'Confirm eligibility and final checkout total.')}</span></p>`
    : '';
  const date = `Checked ${escapeHtml(course.tuition.lastCheckedDate)}`;
  return `<strong>${escapeHtml(regular)}</strong>${priceType}${promotional}<span class="course-data-status">${escapeHtml(displayStatus(course.tuition.verificationStatus))} · ${date}</span>`;
}

function publishedPriceVariants(course) {
  return (course.publishedPriceVariants || []).map((entry) => {
    const price = entry.value;
    return `<li><strong>${escapeHtml(money(price))}</strong> — ${escapeHtml(price.label)} <span class="course-data-status">${escapeHtml(displayStatus(entry.verificationStatus))} · checked ${escapeHtml(entry.lastCheckedDate)}</span>${sourceLink('Official listing', entry)}</li>`;
  });
}

function compactPublishedPrices(course) {
  return (course.publishedPriceVariants || []).map(entry => {
    const date = new Date(`${entry.lastCheckedDate}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
    return `<li><strong>${escapeHtml(money(entry.value))}</strong> — ${escapeHtml(entry.value.label)} <span class="course-data-status">${escapeHtml(displayStatus(entry.verificationStatus))} · checked ${escapeHtml(date)}</span></li>`;
  });
}

function courseSources(course) {
  const candidates = [
    ['Fee', course.tuition], ['Course details', course.deliveryFormat],
    ['Qualification / practice', course.teachingPractice], ['Terms', course.refundPolicy]
  ];
  const seen = new Set();
  return candidates.filter(([, evidence]) => {
    if (!evidence?.sourceUrl || seen.has(evidence.sourceUrl)) return false;
    seen.add(evidence.sourceUrl);
    return true;
  }).map(([label, evidence]) => sourceLink(label, evidence)).join(' · ');
}

function practiceDescription(course) {
  if (course.teachingPractice.value) {
    const prefix = course.teachingPractice.verificationStatus === 'provider_claim' ? 'Provider describes: ' : '';
    return `${prefix}${escapeHtml(course.teachingPractice.value)}`;
  } else if (course.teachingPractice.verificationStatus === 'unverified' && course.teachingPractice.verificationNotes) {
    return 'Not established in the reviewed pages.';
  }
  return 'Not verified';
}

function jobSupportDescription(course) {
  const guarantee = course.jobGuarantee.value;
  if (guarantee && course.jobGuarantee.verificationStatus !== 'not_applicable') {
    return `Provider says: ${escapeHtml(guarantee)}`;
  } else if (course.jobSupport.value) {
    const prefix = course.jobSupport.verificationStatus === 'provider_claim' ? 'Provider says: ' : '';
    return `${prefix}${escapeHtml(course.jobSupport.value)}`;
  } else if (course.jobSupport.verificationStatus === 'unverified' && course.jobSupport.verificationNotes) {
    return 'Not established in the reviewed pages.';
  }
  return 'Not verified';
}

function costsAndEvidence(course) {
  const entries = [];
  const mandatory = course.mandatoryAdditionalFees;
  const deposit = course.deposit;
  const accommodation = course.accommodation;
  const refund = course.refundPolicy;
  if (mandatory.value) entries.push(`<li>${escapeHtml(mandatory.value)}</li>`);
  if (deposit.value) entries.push(`<li>Deposit: ${escapeHtml(money(deposit.value))}</li>`);
  else if (deposit.verificationStatus === 'unverified') entries.push('<li>Deposit amount not confirmed; check the current payment schedule.</li>');
  if (course.balanceDue.value) entries.push(`<li>${course.balanceDue.value.calculation === 'tuition_minus_deposit' ? 'Calculated remainder' : 'Balance'}: ${escapeHtml(paymentDisplay(course.balanceDue.value))}</li>`);
  else if (course.balanceDue.verificationStatus === 'unverified') entries.push('<li>Balance amount or due date not confirmed; check the current payment schedule.</li>');
  if (accommodation.value && !entries.some(entry => entry.includes(escapeHtml(accommodation.value)))) entries.push(`<li>${escapeHtml(accommodation.value)}</li>`);
  if (refund.value) entries.push(`<li>${escapeHtml(refund.value)}</li>`);
  else if (refund.verificationStatus === 'unverified') entries.push('<li>Refund terms are not confirmed here; read the current provider terms before paying.</li>');
  if (course.promotionalPrice.value && course.promotionExpiry.verificationStatus === 'unverified') {
    entries.push('<li>No promotion end date was shown; confirm the offer is still available.</li>');
  }
  const sources = courseSources(course);
  return `<ul>${entries.join('')}</ul><p class="course-data-sources">${sources}</p>`;
}

export function renderCourseComparisonTable(database = courseDatabase) {
  const groups = database.providers.map(provider => {
    const providerCourses = database.courses.filter(course => course.providerId === provider.providerId);
    const courses = providerCourses.map(course => {
      const qualification = course.qualification.value || 'Qualification details not confirmed.';
      const status = displayStatus(course.qualification.verificationStatus);
      const location = course.location.value || 'Location not verified';
      const variants = publishedPriceVariants(course);
      const courseDetails = `<details class="course-data-details"><summary>Terms &amp; sources</summary>${variants.length ? `<ul>${variants.join('')}</ul>` : ''}${costsAndEvidence(course)}</details>`;
      return `<tr data-course-id="${escapeHtml(course.courseId)}"><th scope="row"><strong>${escapeHtml(provider.providerName)}</strong><small>${escapeHtml(course.courseName)}</small>${courseDetails}</th><td>${escapeHtml(location)}<br>${escapeHtml(course.deliveryFormat.value || 'Format not verified')}</td><td>${courseHours(course)}<p>${escapeHtml(qualification)}</p><span class="course-data-status">${escapeHtml(status)}</span></td><td>${coursePrice(course)}<p class="course-data-visible-sources">Source: ${sourceLink('Provider fee', course.tuition)}</p></td><td>${escapeHtml(practiceDescription(course))}</td><td>${escapeHtml(jobSupportDescription(course))}</td></tr>`;
    }).join('');
    return `<tbody data-provider-id="${escapeHtml(provider.providerId)}">${courses}</tbody>`;
  }).join('');
  return `<section class="course-data-comparison" data-testid="course-database-comparison" aria-label="TEFL provider comparison"><p class="course-data-caption">Provider-published snapshots in each provider’s stated currency. Source links and check dates are available with each course.</p><p class="table-swipe-hint" aria-hidden="true"><span>Swipe horizontally to compare all columns</span><span>More →</span></p><div class="table-scroll snapshot-table" tabindex="0" role="region" aria-label="Course comparison by format, qualification, fee, practice and support. Scroll horizontally to see all columns."><table class="price-table"><thead><tr><th scope="col">Provider / course</th><th scope="col">Format</th><th scope="col">Qualification / hours</th><th scope="col">Published fee</th><th scope="col">Practice</th><th scope="col">Support</th></tr></thead>${groups}</table></div></section>`;
}

function evidenceMeta(evidence) {
  const label = evidence.verificationStatus === 'primary_verified' ? 'Provider listing' : evidence.verificationStatus === 'provider_claim' ? 'Provider statement' : displayStatus(evidence.verificationStatus);
  const date = new Date(`${evidence.lastCheckedDate}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return `<span class="course-data-status">${escapeHtml(label)} · checked ${escapeHtml(date)}</span>`;
}

function reviewCourseSources(course) {
  const evidenceFields = Object.entries(course).filter(([, item]) => item && typeof item === 'object' && Object.hasOwn(item, 'verificationStatus'));
  const entries = evidenceFields.map(([field, item]) => [field.replace(/([A-Z])/g, ' $1'), item]);
  for (const variant of course.publishedPriceVariants || []) entries.push(['Other listed price', variant]);
  const seen = new Set();
  return entries.filter(([, item]) => item.sourceUrl && !seen.has(item.sourceUrl) && seen.add(item.sourceUrl))
    .map(([label, item]) => `<span>${escapeHtml(label)}: ${sourceLink('official source', item)} · ${escapeHtml(displayStatus(item.verificationStatus))}, checked ${escapeHtml(item.lastCheckedDate)}</span>`).join(' · ');
}

function renderReviewCourse(course) {
  const format = [course.deliveryFormat.value, course.courseDuration.value].filter(Boolean).filter((value, index, array) => array.indexOf(value) === index && !array.slice(0, index).some(prior => prior.includes(value))).join(' · ') || 'Format not confirmed';
  const hours = [
    course.advertisedHours.value !== null ? `${course.advertisedHours.value} advertised course hours` : null,
    course.guidedLearningHours.value !== null ? `${course.guidedLearningHours.value} guided learning hours` : null,
    course.totalQualificationTime.value !== null ? `${course.totalQualificationTime.value} total qualification time` : null
  ].filter(Boolean).join(' · ') || 'Course-hour figure not confirmed';
  const credential = course.qualification.value ? `${course.qualification.verificationStatus === 'provider_claim' ? 'Provider describes: ' : ''}${course.qualification.value}` : 'Qualification details not confirmed.';
  const tuition = course.tuition.value ? money(course.tuition.value) : 'Tuition not confirmed';
  const promotional = course.promotionalPrice.value ? `<p class="course-data-promo"><strong>Partner page:</strong> ${escapeHtml(money(course.promotionalPrice.value))} <span>${escapeHtml(course.promotionalPrice.value.conditions || 'Confirm eligibility and checkout total.')}</span></p>` : '';
  const lodging = course.accommodation.value ? `<p><strong>Accommodation:</strong> ${escapeHtml(course.accommodation.value)}</p>` : '';
  const deposit = course.deposit.value ? `<p><strong>Deposit:</strong> ${escapeHtml(money(course.deposit.value))}</p>` : '';
  const balance = course.balanceDue.value ? `<p><strong>${course.balanceDue.value.calculation === 'tuition_minus_deposit' ? 'Calculated remainder:' : 'Balance:'}</strong> ${escapeHtml(paymentDisplay(course.balanceDue.value))}</p>` : '';
  const visibleFacts = `<dl class="course-data-review-facts"><div><dt>Format &amp; tuition</dt><dd>${escapeHtml(format)}<br><strong>${escapeHtml(tuition)}</strong> <span>${escapeHtml(course.tuition.value?.priceType || '')}</span>${promotional}${evidenceMeta(course.tuition)}</dd></div><div><dt>Hours &amp; qualification</dt><dd>${escapeHtml(hours)}<br>${escapeHtml(credential)} ${evidenceMeta(course.advertisedHours.verificationStatus === 'conflicting_official_sources' ? course.advertisedHours : course.qualification)}</dd></div>${deposit || balance || lodging ? `<div><dt>Payment &amp; accommodation</dt><dd>${deposit}${balance}${lodging}</dd></div>` : ''}</dl>${course.jobGuarantee.value ? '<p class="course-data-review-note"><strong>Conditional guarantee:</strong> confirm eligibility, required steps, what counts as an offer and the remedy in writing.</p>' : ''}<p class="course-data-review-checked">Provider information checked ${escapeHtml(new Date(`${course.tuition.lastCheckedDate}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }))}.</p>`;
  const variantPrices = compactPublishedPrices(course);
  const variants = variantPrices.length ? `<div class="course-data-review-variants"><h4>Other official price displays</h4><ul>${variantPrices.join('')}</ul></div>` : '';
  const hoursDiffer = course.advertisedHours.value !== null && course.guidedLearningHours.value !== null && course.advertisedHours.value !== course.guidedLearningHours.value;
  const conflict = hoursDiffer || [course.advertisedHours, course.guidedLearningHours, course.totalQualificationTime].some(item => item.verificationStatus === 'conflicting_official_sources');
  const note = conflict ? '<p class="course-data-review-note"><strong>Check the hour definitions:</strong> provider course hours and qualification learning-hour figures describe different measures or currently unreconciled listings. Ask for the breakdown before enrolling.</p>' : '';
  const entries = [
    course.mandatoryAdditionalFees.value ? `<li>${escapeHtml(course.mandatoryAdditionalFees.value)}</li>` : null,
    course.teachingPractice.value ? `<li>Practice: ${escapeHtml(course.teachingPractice.value)}</li>` : course.teachingPractice.verificationStatus === 'unverified' ? '<li>Observed teaching practice was not established in the reviewed provider pages.</li>' : null,
    course.qualification.value ? `<li>Qualification: ${escapeHtml(course.qualification.value)}</li>` : null,
    course.jobSupport.value ? `<li>Job support: ${escapeHtml(course.jobSupport.value)}</li>` : null,
    course.jobGuarantee.value ? `<li>Job-guarantee claim: ${escapeHtml(course.jobGuarantee.value)}</li>` : null,
    course.deposit.value ? `<li>Deposit: ${escapeHtml(money(course.deposit.value))}</li>` : course.deposit.verificationStatus === 'unverified' ? '<li>Deposit amount not confirmed; check the payment schedule.</li>' : null,
    course.balanceDue.value ? `<li>${course.balanceDue.value.calculation === 'tuition_minus_deposit' ? 'Calculated remainder' : 'Balance'}: ${escapeHtml(paymentDisplay(course.balanceDue.value))}</li>` : course.balanceDue.verificationStatus === 'unverified' ? '<li>Balance amount or due date not confirmed; check the current payment schedule.</li>' : null,
    course.accommodation.value ? `<li>${escapeHtml(course.accommodation.value)}</li>` : null,
    course.refundPolicy.value ? `<li>${escapeHtml(course.refundPolicy.value)}</li>` : course.refundPolicy.verificationStatus === 'unverified' ? '<li>Product-specific refund terms were not confirmed; review the live terms before payment.</li>' : null,
    course.guaranteeConditions.value ? `<li>${escapeHtml(course.guaranteeConditions.value)}</li>` : null,
    course.promotionConditions.value ? `<li>${escapeHtml(course.promotionConditions.value)}</li>` : null,
    course.promotionalPrice.value && course.promotionExpiry.verificationStatus === 'unverified' ? '<li>No promotion end date was shown; confirm the offer is still available.</li>' : null
  ].filter(Boolean);
  return `<section class="course-data-review-course" data-course-id="${escapeHtml(course.courseId)}"><h3>${escapeHtml(course.courseName)}</h3>${visibleFacts}${note}${variants}<details class="course-data-details"><summary>Payment terms &amp; sources</summary><ul>${entries.join('')}</ul><p class="course-data-sources">${reviewCourseSources(course)}</p></details></section>`;
}

export function renderReviewCourseFacts(page, database = courseDatabase) {
  const match = page.content.match(/<!-- COURSE_DATABASE_REVIEW:([a-z0-9_-]+) -->/);
  if (!match) return page.content;
  const providerId = match[1];
  const provider = database.providers.find(item => item.providerId === providerId);
  if (!provider) return page.content.replace(match[0], '<!-- Course data unavailable -->');
  const courses = database.courses.filter(item => item.providerId === providerId);
  const facts = courses.map(renderReviewCourse).join('');
  const dates = courses.flatMap(course => Object.values(course).filter(value => value && typeof value === 'object' && Object.hasOwn(value, 'lastCheckedDate')).map(value => value.lastCheckedDate).filter(Boolean)).sort();
  const latestChecked = dates.at(-1) || database.lastCheckedDate;
  const latestCheckedLabel = new Date(`${latestChecked}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return page.content.replace(match[0], `<section class="course-data-review" data-testid="course-database-review-facts" aria-label="${escapeHtml(provider.providerName)} course facts"><p class="course-data-caption">Provider listings checked ${escapeHtml(latestCheckedLabel)}. Each course panel links to its source and full terms.</p>${facts}</section>`).replace(/\{\{COURSE_FACT:([a-z0-9_-]+):([a-zA-Z0-9_.]+)\}\}/g, (token, courseId, field) => {
    const course = database.courses.find(item => item.courseId === courseId);
    const value = field.startsWith('publishedPriceVariants.')
      ? course?.publishedPriceVariants?.[Number(field.split('.')[1])]?.value
      : course?.[field]?.value;
    if (value && typeof value === 'object' && typeof value.amount === 'number') return escapeHtml(money(value));
    return value == null ? 'price not confirmed' : escapeHtml(value);
  });
}

export function renderCourseDatabasePilot(page, database = courseDatabase) {
  const marker = '<!-- COURSE_DATABASE_COMPARISON_TABLE -->';
  if (page.path !== '/tefl-course-comparison-thailand/' || !page.content.includes(marker)) return page.content;
  return page.content.replace(marker, renderCourseComparisonTable(database));
}

export function renderCourseCalculatorData(page, database = courseDatabase) {
  if (page.path !== '/calculator/') return page.content;
  const options = { standard: 'essential_standard_120', level5: 'essential_tquk_level5', internship: 'essential_paid_internship', allin: 'essential_all_in_bundle' };
  const priceData = {};
  for (const [option, courseId] of Object.entries(options)) {
    const course = database.courses.find(item => item.courseId === courseId);
    if (!course?.tuition?.value || course.tuition.verificationStatus === 'unverified') throw new Error(`Calculator option ${option} needs confirmed tuition from the course database.`);
    priceData[option] = {
      courseId, courseName: course.courseName, amount: course.tuition.value.amount,
      currency: course.tuition.value.currency, priceType: course.tuition.value.priceType,
      sourceUrl: course.tuition.sourceUrl, lastCheckedDate: course.tuition.lastCheckedDate,
      tuitionStatus: course.tuition.verificationStatus, deposit: course.deposit.value,
      depositStatus: course.deposit.verificationStatus, depositSourceUrl: course.deposit.sourceUrl,
      balanceDue: course.balanceDue.value, balanceStatus: course.balanceDue.verificationStatus,
      mandatoryAdditionalFees: course.mandatoryAdditionalFees.value,
      mandatoryAdditionalFeesStatus: course.mandatoryAdditionalFees.verificationStatus,
      accommodation: course.accommodation.value
    };
  }
  let content = page.content.replace('<form id="budget-calculator" class="calc-form">', '<form id="budget-calculator" class="calc-form" data-course-prices="__COURSE_PRICES__">');
  content = content.replace('__COURSE_PRICES__', escapeHtml(JSON.stringify(priceData)));
  for (const [value, courseId] of Object.entries(options)) {
    const course = database.courses.find(item => item.courseId === courseId);
    const label = value === 'standard' ? 'In-person Standard 120-hour' : value === 'level5' ? 'In-person TQUK Level 5' : value === 'internship' ? 'Paid internship' : 'All-In bundle';
    content = content.replace(new RegExp(`<option value="${value}">[^<]*<\\/option>`), `<option value="${value}">${escapeHtml(label)} — ${escapeHtml(money(course.tuition.value))} listed fee</option>`);
  }
  content = content.replace('Current provider-listed amounts; confirm the exact intake and terms before booking.', 'Course fees are pulled from the shared provider-data records. Check the official source links below; exact intake terms may differ.');
  const sourceLinks = Object.values(priceData).map(item => `<li>${escapeHtml(item.courseName)}: ${sourceLink('Official fee listing', { sourceUrl: item.sourceUrl })} · checked ${escapeHtml(displayDate(item.lastCheckedDate))}</li>`).join('');
  content = content.replace('*The provider lists a ฿90,000 paid internship route. Check the exact eligibility, inclusions and payment terms with the provider. Enter 0 for costs you do not expect; replace starter values with your own quotes.', 'The paid internship option has eligibility and placement conditions; confirm the current terms with the provider. Course amounts are tuition snapshots and do not include unconfirmed required costs. Replace starter living-cost assumptions with your own quotes.');
  content = content.replace('</form><aside class="calc-result">', `<ul class="calculator-course-sources" aria-label="Official course price sources">${sourceLinks}</ul></form><aside class="calc-result">`);
  content = content.replace('<div id="calc-breakdown" class="breakdown"></div>', '<div id="calc-breakdown" class="breakdown"></div><p id="calc-course-payment" class="calc-course-payment" aria-live="polite"></p>');
  content = content.replace('Course fees are drawn from current provider listings. Living costs, travel, deposits and your first-pay date are personal inputs, not sourced averages. Ask your course provider, landlord, travel insurer and relevant authorities about your actual fees and requirements.', 'Course tuition comes from the shared database and each listed fee links to its official source. Deposit and balance are payment parts of tuition, not added again. An unconfirmed required fee is excluded from the numeric estimate, not treated as zero. Living costs, travel, housing and time until first pay are your own inputs, not sourced averages.');
  return content;
}
