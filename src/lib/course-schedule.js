import courseSchedules from '../data/course-schedules.json' with { type: 'json' };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const VERIFIED = new Set(['primary_verified', 'provider_claim']);
const CURRENCIES = /^[A-Z]{3}$/;
const CORE_SCHEDULE_PATH = '/tefl-course-dates-thailand/';

function validDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function validHttps(value) {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function displayDate(value, options = {}) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC', ...options }).format(new Date(`${value}T00:00:00Z`));
}

export function bangkokToday(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function validateCourseSchedules(scheduleData = courseSchedules, database) {
  const errors = [];
  if (!validDate(scheduleData.lastCheckedDate)) errors.push('scheduleData.lastCheckedDate must be a real YYYY-MM-DD date');
  if (!Array.isArray(scheduleData.additionalCourses) || !Array.isArray(scheduleData.schedules)) return ['scheduleData.additionalCourses and schedules must be arrays'];
  const coreIds = new Set(database.courses.map(course => course.courseId));
  const courseIds = new Set(coreIds);
  for (const [index, course] of scheduleData.additionalCourses.entries()) {
    const prefix = `additionalCourses[${index}]`;
    if (!course.courseId || courseIds.has(course.courseId)) errors.push(`${prefix}.courseId is missing or duplicated`);
    courseIds.add(course.courseId);
    if (!course.providerId || !course.providerName || !course.courseName || !course.location || !course.deliveryFormat) errors.push(`${prefix} is missing catalog identity fields`);
    for (const [field, record] of Object.entries(course).filter(([, value]) => value && typeof value === 'object' && Object.hasOwn(value, 'verificationStatus'))) {
      if (!database.verificationStatuses.includes(record.verificationStatus)) errors.push(`${prefix}.${field} has an invalid verification status`);
      if (!validDate(record.lastCheckedDate)) errors.push(`${prefix}.${field}.lastCheckedDate must be valid`);
      if (VERIFIED.has(record.verificationStatus) && (!validDate(record.lastVerifiedDate) || !validHttps(record.sourceUrl))) errors.push(`${prefix}.${field} needs a checked HTTPS source`);
      if (!VERIFIED.has(record.verificationStatus) && record.lastVerifiedDate !== null) errors.push(`${prefix}.${field}.lastVerifiedDate must be null until verified`);
      const value = record.value;
      const moneyItems = value && typeof value === 'object' ? [value, ...(value.variants || [])].filter(item => Object.hasOwn(item, 'amount')) : [];
      for (const item of moneyItems) if (typeof item.amount !== 'number' || item.amount < 0 || !CURRENCIES.test(item.currency || '')) errors.push(`${prefix}.${field}.value has an invalid amount or currency`);
      if (value === null && record.verificationStatus === 'unverified' && typeof record.verificationNotes !== 'string') errors.push(`${prefix}.${field} needs notes for an unverified value`);
    }
  }
  const ids = new Set();
  for (const [index, item] of scheduleData.schedules.entries()) {
    const prefix = `schedules[${index}]`;
    if (!item.scheduleId || ids.has(item.scheduleId)) errors.push(`${prefix}.scheduleId is missing or duplicated`);
    ids.add(item.scheduleId);
    if (!courseIds.has(item.courseId)) errors.push(`${prefix}.courseId references an unknown course`);
    if (item.availabilityStatus === 'not_announced') {
      if (item.startDate !== null || item.endDate !== null) errors.push(`${prefix} not-announced entries must not claim dates`);
    } else if (!validDate(item.startDate) || !validDate(item.endDate) || item.endDate < item.startDate) errors.push(`${prefix} has invalid start/end dates`);
    if (item.applicationDeadline !== null && !validDate(item.applicationDeadline)) errors.push(`${prefix}.applicationDeadline must be a valid date or null`);
    if (!item.location || !scheduleData.scheduleStatuses.includes(item.availabilityStatus)) errors.push(`${prefix} needs a location and valid schedule status`);
    if (typeof item.monthlyCalendar !== 'boolean') errors.push(`${prefix}.monthlyCalendar must identify primary-calendar vs separately listed dates`);
    if (item.currency !== null && !CURRENCIES.test(item.currency)) errors.push(`${prefix}.currency must be a 3-letter currency code or null`);
    if (!scheduleData.seatAvailabilityStatuses.includes(item.seatAvailability)) errors.push(`${prefix}.seatAvailability is invalid`);
    if (!validHttps(item.sourceUrl) || !validDate(item.lastVerifiedDate) || !VERIFIED.has(item.verificationStatus)) errors.push(`${prefix} needs a verified HTTPS source and date`);
    if (item.tuitionOverride !== null && (!item.tuitionOverride || typeof item.tuitionOverride.amount !== 'number' || item.tuitionOverride.amount < 0 || !CURRENCIES.test(item.tuitionOverride.currency || ''))) errors.push(`${prefix}.tuitionOverride is invalid`);
    if (item.deposit !== null && (!item.deposit || typeof item.deposit.amount !== 'number' || item.deposit.amount < 0 || !CURRENCIES.test(item.deposit.currency || ''))) errors.push(`${prefix}.deposit is invalid`);
    if (item.availabilityStatus === 'scheduled' && item.seatAvailability === 'confirmed' && item.verificationStatus !== 'primary_verified') errors.push(`${prefix} confirmed availability needs primary evidence`);
  }
  return errors;
}

function money(value) {
  if (!value || typeof value.amount !== 'number') return 'Price not confirmed';
  const amount = value.amount.toLocaleString('en-US');
  return value.currency === 'THB' ? `฿${amount}` : value.currency === 'USD' ? `US$${amount}` : `${value.currency} ${amount}`;
}

function coreCourseIndex(database) {
  return new Map(database.courses.map(course => [course.courseId, course]));
}

function scheduleCourse(courseId, database, scheduleData = courseSchedules) {
  const core = coreCourseIndex(database).get(courseId);
  if (core) {
    const provider = database.providers.find(item => item.providerId === core.providerId);
    return { core, provider, courseId, providerId: core.providerId, providerName: provider?.providerName || core.providerId, courseName: core.courseName, location: core.location.value, deliveryFormat: core.deliveryFormat.value, tuition: core.tuition, deposit: core.deposit, balanceDue: core.balanceDue, accommodation: core.accommodation, publishedPriceVariants: core.publishedPriceVariants || [] };
  }
  return scheduleData.additionalCourses.find(item => item.courseId === courseId);
}

function coursePrice(course) {
  const primary = course.tuition.value;
  const regular = primary ? money(primary) : 'Tuition not confirmed';
  const promotion = course.promotionalPrice?.value;
  if (promotion) return `${regular} regular listing; ${money(promotion)} promotional price shown (expiry and final checkout total not confirmed)`;
  const variants = course.publishedPriceVariants || [];
  return variants.length ? `${regular}; ${variants.map(item => `${money(item.value)} ${item.value.label}`).join('; ')}` : regular;
}

function scheduleRange(item) {
  const start = new Date(`${item.startDate}T00:00:00Z`);
  const end = new Date(`${item.endDate}T00:00:00Z`);
  const monthStart = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' }).format(start);
  const monthEnd = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' }).format(end);
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  return monthStart === monthEnd ? `${startDay}–${endDay} ${monthStart}` : `${startDay} ${monthStart}–${endDay} ${monthEnd}`;
}

function sourceLink(sourceUrl, label = 'Official course page') {
  return `<a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
}

function activeSchedules(scheduleData, asOfDate) {
  return scheduleData.schedules.filter(item => item.availabilityStatus === 'scheduled' && item.startDate >= asOfDate).sort((a,b) => a.startDate.localeCompare(b.startDate) || a.courseId.localeCompare(b.courseId));
}

function groupProviderDates(items, database, scheduleData) {
  const map = new Map();
  for (const item of items) {
    const course = scheduleCourse(item.courseId, database, scheduleData);
    const key = `${item.providerId || course.providerId}|${item.startDate}|${item.endDate}|${item.location}`;
    if (!map.has(key)) map.set(key, { item, course, courses: [] });
    map.get(key).courses.push(course);
  }
  return [...map.values()];
}

function renderCalendarRows(database, scheduleData, asOfDate) {
  const upcoming = activeSchedules(scheduleData, asOfDate).filter(item => item.monthlyCalendar && item.startDate.startsWith('2027-'));
  const groups = groupProviderDates(upcoming, database, scheduleData);
  if (!groups.length) return { navigation: '', rows: '<tr><td colspan="3" data-label="Schedule">No upcoming 2027 start dates are currently published in the checked sources.</td></tr>' };
  const months = new Map();
  for (const group of groups) {
    const month = group.item.startDate.slice(0, 7);
    if (!months.has(month)) months.set(month, { bangkok: [], chiangMai: [] });
    const city = /chiang mai/i.test(group.item.location) ? 'chiangMai' : 'bangkok';
    months.get(month)[city].push(group);
  }
  const providerOrder = new Map([['essential_tefl',0],['ittt',1],['education_house',2],['see_tefl',0],['cmu_tefl',1]]);
  const renderCell = entries => entries.sort((a,b) => (providerOrder.get(a.course.providerId) ?? 9) - (providerOrder.get(b.course.providerId) ?? 9)).map(({item,courses}) => {
    const distinctCourses=[...new Map(courses.map(course=>[course.courseId,course])).values()];
    const dates=scheduleRange(item);
    return `<div class="schedule-entry"><strong>${escapeHtml(distinctCourses[0].providerName)}</strong><br>${escapeHtml(dates)}<br>${distinctCourses.map(course=>escapeHtml(course.courseName)).join(' / ')}<br><span>${escapeHtml(distinctCourses.map(coursePrice).join(' · '))}</span><br>${sourceLink(item.sourceUrl)}</div>`;
  }).join('') || '<span class="schedule-none">No listed start in this month.</span>';
  const sortedMonths=[...months.entries()].sort(([a],[b])=>a.localeCompare(b));
  const labels=sortedMonths.map(([month])=>[month,new Intl.DateTimeFormat('en-GB',{month:'long',timeZone:'UTC'}).format(new Date(`${month}-01T00:00:00Z`))]);
  const navigation=`<nav class="schedule-month-jump" aria-label="Jump to month"><strong>Jump to month</strong><ul>${labels.map(([month,label])=>`<li><a href="#course-month-${month}">${label}</a></li>`).join('')}</ul></nav>`;
  const rows=sortedMonths.map(([month,cells])=>{
    const date=new Date(`${month}-01T00:00:00Z`);
    const label=new Intl.DateTimeFormat('en-GB',{month:'long',timeZone:'UTC'}).format(date);
    return `<tr><th id="course-month-${month}" scope="row" data-label="Month">${label}</th><td data-label="Bangkok">${renderCell(cells.bangkok)}</td><td data-label="Chiang Mai">${renderCell(cells.chiangMai)}</td></tr>`;
  }).join('');
  return { navigation, rows };
}

function paymentSummary(course, { compact = false } = {}) {
  const tuition=course.tuition?.value;
  const deposit=course.deposit?.value;
  const balance=course.balanceDue?.value;
  const parts=[];
  if(deposit&&typeof deposit.amount==='number') parts.push(`Published deposit ${money(deposit)}${deposit.due?` (${deposit.due})`:''}${deposit.refundability?` (${deposit.refundability})`:''}.`);
  else parts.push('A deposit amount or payment split was not confirmed in the checked source.');
  if(balance&&typeof balance.amount==='number') parts.push(`${balance.calculation==='tuition_minus_deposit'?'Calculated remainder after the provider-listed deposit':'Published balance'} ${money(balance)}${balance.due?` (${balance.due})`:''}.`);
  else if(Array.isArray(balance?.variants)) parts.push(`Published balance: ${balance.variants.map(item=>`${money(item)} for ${item.condition}`).join('; ')}${balance.due?`; ${balance.due}`:''}.`);
  else if(typeof balance==='string') parts.push(balance);
  else if(deposit&&tuition&&deposit.currency===tuition.currency&&typeof tuition.amount==='number') parts.push(`Arithmetic remainder after the deposit: ${money({amount:tuition.amount-deposit.amount,currency:tuition.currency})}; its due date was not established.`);
  else parts.push('The balance amount or its due date was not established.');
  if (!compact) parts.push(`The full listed tuition is ${tuition?money(tuition):'not confirmed'}; deposit and balance are payment parts of that tuition, not extra charges.`);
  else if (deposit && tuition) parts.push('The deposit and balance are parts of the listed tuition, not extra charges.');
  return parts.join(' ');
}

function renderAdditionalOptions(database, scheduleData, asOfDate) {
  const eligibleIds=new Set(['essential_paid_internship','ittt_bangkok_combined','see_tefl_paid_internship','education_house_tefl_bangkok']);
  const groups=groupProviderDates(activeSchedules(scheduleData,asOfDate).filter(item=>eligibleIds.has(item.courseId)),database,scheduleData);
  const byCourse=new Map();
  for(const group of groups){const course=group.courses[0];if(!byCourse.has(course.courseId))byCourse.set(course.courseId,{course,dates:[]});byCourse.get(course.courseId).dates.push(group.item)}
  return [...byCourse.values()].map(({course,dates})=>{
    const dateList=dates.map(item=>`${scheduleRange(item)} 2027`).join('; ');
    const price=coursePrice(course);
    const payment=paymentSummary(course,{compact:true});
    const source=sourceLink(dates[0].sourceUrl);
    return `<article class="schedule-option"><h3>${escapeHtml(course.providerName)}: ${escapeHtml(course.courseName)}</h3><p><strong>Published scheduled dates:</strong> ${escapeHtml(dateList)}. Seats are not confirmed by this calendar.</p><p><strong>Published fee:</strong> ${escapeHtml(price)}.</p><p><strong>Payment:</strong> ${escapeHtml(payment)}</p><p><strong>Format and place:</strong> ${escapeHtml(course.deliveryFormat)} · ${escapeHtml(course.location)}. ${source}</p>${course.optionalCosts?.value?`<p><strong>Optional costs:</strong> ${escapeHtml(course.optionalCosts.value)}</p>`:''}</article>`;
  }).join('') || '<p>No upcoming dates for these separately listed options were found in the checked sources.</p>';
}

export function renderCourseSchedulePage(page, database, scheduleData = courseSchedules, asOfDate = bangkokToday()) {
  if(page.path!==CORE_SCHEDULE_PATH)return page.content;
  let content=page.content;
  const sectionAt=content.indexOf('<h2>2027 dates by month</h2>');
  const tbodyStart=content.indexOf('<tbody>',sectionAt);
  const tbodyEnd=content.indexOf('</tbody>',tbodyStart);
  if(sectionAt<0||tbodyStart<0||tbodyEnd<0)throw new Error('Course calendar table structure was not found.');
  const calendar=renderCalendarRows(database,scheduleData,asOfDate);
  content=content.slice(0,tbodyStart+7)+calendar.rows+content.slice(tbodyEnd);
  if(calendar.navigation){
    const tableStart=content.indexOf('<div class="job-table-scroll"',sectionAt);
    if(tableStart<0)throw new Error('Course-date calendar container was not found.');
    content=content.slice(0,tableStart)+calendar.navigation+content.slice(tableStart);
  }
  const comparisonAt=content.indexOf('<h2>Quick comparison: fee, deposit and what’s included</h2>');
  const comparisonBody=content.indexOf('<tbody>',comparisonAt);
  const comparisonEnd=content.indexOf('</tbody>',comparisonBody);
  if(comparisonAt<0||comparisonBody<0||comparisonEnd<0)throw new Error('Course fee comparison table structure was not found.');
  // Preserve the article's accessible table shell; replace factual rows with shared catalog output.
  content=content.slice(0,comparisonBody+7)+renderCourseSummaryRows(database,scheduleData)+content.slice(comparisonEnd);
  const otherStart=content.indexOf('<section><h2>Other publicly listed 2027 options</h2>');
  const otherEnd=content.indexOf('<section><h2>Frequently asked questions</h2>',otherStart);
  if(otherStart<0||otherEnd<0)throw new Error('Course-date additional options section was not found.');
  content=content.slice(0,otherStart)+`<section><h2>Other publicly listed 2027 options</h2><p>These options use different delivery formats or do not have a complete like-for-like payment quote. Dates are published schedules, not confirmation of open seats.</p>${renderAdditionalOptions(database,scheduleData,asOfDate)}</section>`+content.slice(otherEnd);
  const checked=displayDate(scheduleData.lastCheckedDate);
  content=content.replaceAll('7 November 2026',checked).replaceAll('November 7, 2026',checked);
  content=content.replace('These are dates the providers publish as scheduled starts. They do not establish current seat availability or confirm that a specific cohort will run. SEE TEFL says dates on its registration page currently have availability, but its dates-and-fees page directs students to confirm a place there; we have not inferred that every scheduled intake has open seats. Contact the provider and get availability in writing.','These are dates published by providers as scheduled starts. A scheduled intake is not a guarantee that a specific cohort will run or that places remain. Confirm the course, open place and current terms directly with the provider before paying.');
  content=content.replace('No December 2027 intake was listed on the checked pages for these four providers. ITTT’s Bangkok combined 12-day onsite module also publishes dates; see the note below.','No start date in December 2027 was listed for the monthly calendar options. Some November intakes finish in December. The combined ITTT onsite dates and other separately listed options are shown below.');
  const essentialPaymentNotes=['essential_standard_120','essential_tquk_level5'].map(id=>{
    const course=scheduleCourse(id,database,scheduleData);
    return course?`${course.courseName}: ${paymentSummary(course,{compact:true})}`:'';
  }).filter(Boolean);
  content=content.replace('Essential TEFL’s checked dates-and-fees page did not state a deposit amount.',`Essential TEFL’s current terms state: ${escapeHtml(essentialPaymentNotes.join(' '))}`);
  content=content.replace('{{SCHEDULE_FACT:earliest-start}}',earliestStartFaq(database,scheduleData,asOfDate));
  content=content.replace('{{SCHEDULE_FACT:price-comparison}}',priceComparisonFaq(database,scheduleData));
  content=content.replace('{{SCHEDULE_FACT:deposit-summary}}',depositFaq(database,scheduleData));
  return content;
}

function renderCourseSummaryRows(database,scheduleData){
  const groups=[
    ['essential_standard_120','essential_tquk_level5'],
    ['see_tefl_120_in_person'],
    ['cmu_tefl_4_week'],
    ['ittt_bangkok_in_class']
  ];
  return groups.map(ids=>{
    const courses=ids.map(id=>scheduleCourse(id,database,scheduleData)).filter(Boolean);if(!courses.length)return '';
    const lead=courses[0];
    const prices=courses.map(course=>`${course.courseName}: ${coursePrice(course)}`).join('<br>');
    const payments=courses.map(course=>`${course.courseName}: ${paymentSummary(course,{compact:true})}`).join(' ');
    const accommodation=courses.map(course=>course.accommodation?.value||course.optionalCosts?.value).filter(Boolean).join(' ');
    const practice=courses.map(course=>course.core?.teachingPractice?.value).filter(Boolean).join(' ');
    const source=courses.find(course=>course.tuition?.sourceUrl)?.tuition.sourceUrl||courses[0].deposit?.sourceUrl;
    return `<tr><td data-label="Provider / city">${escapeHtml(lead.providerName)}<br>${escapeHtml(lead.location||'')}</td><td data-label="Course and fee">${prices}</td><td data-label="Deposit, lodging and practice"><p><strong>Payment:</strong> ${escapeHtml(payments)}</p><p><strong>Accommodation:</strong> ${escapeHtml(accommodation||'Confirm accommodation and any additional costs directly.')}</p><p><strong>Teaching practice:</strong> ${escapeHtml(practice||'See the provider source for course-specific teaching practice details.')}</p>${sourceLink(source)}</td></tr>`;
  }).join('');
}

function earliestStartFaq(database,scheduleData,asOfDate){
  const upcoming=activeSchedules(scheduleData,asOfDate).filter(item=>item.startDate.startsWith('2027-'));
  if(!upcoming.length)return 'No upcoming 2027 start date is currently listed in the checked sources.';
  const first=upcoming[0].startDate;const firstGroup=groupProviderDates(upcoming.filter(item=>item.startDate===first),database,scheduleData);
  const names=[...new Set(firstGroup.map(group=>group.course.providerName))];
  return `The earliest published 2027 start is ${escapeHtml(displayDate(first,{day:'numeric',month:'long'}))}, listed by ${escapeHtml(names.join(', '))}. This is a scheduled date, not confirmation of an available place.`;
}

function priceComparisonFaq(database,scheduleData){
  const ids=['cmu_tefl_4_week','essential_standard_120','essential_tquk_level5','see_tefl_120_in_person','ittt_bangkok_in_class'];
  const prices=ids.map(id=>{const course=scheduleCourse(id,database,scheduleData);return course?`${course.providerName} ${course.courseName}: ${coursePrice(course)}`:null}).filter(Boolean);
  return `${escapeHtml(prices.join('; '))}. Currencies, formats and inclusions differ, so these figures are not a like-for-like total-cost ranking.`;
}

function depositFaq(database,scheduleData){
  const ids=['essential_standard_120','essential_tquk_level5','see_tefl_120_in_person','cmu_tefl_4_week','ittt_bangkok_in_class'];
  const values=ids.map(id=>{const course=scheduleCourse(id,database,scheduleData);return course?`${course.providerName} ${course.courseName}: ${paymentSummary(course)}`:null}).filter(Boolean);
  return `${escapeHtml(values.join(' '))} Confirm the current intake, place, refund/change terms and complete payment schedule with the provider before paying.`;
}

export function validateCalculatorCourseData(database){
  const errors=[];
  for(const id of ['essential_standard_120','essential_tquk_level5','essential_paid_internship','essential_all_in_bundle']){
    const course=database.courses.find(item=>item.courseId===id);
    if(!course)errors.push(`Missing calculator course ${id}`);
    else if(!course.tuition.value||course.tuition.value.currency!=='THB'||course.tuition.verificationStatus==='unverified')errors.push(`${id} must have verified THB tuition for this calculator`);
  }
  for(const course of database.courses.filter(item=>item.providerId==='see_tefl')){
    const deposit=course.deposit?.value;const balance=course.balanceDue?.value;
    if(!deposit||typeof deposit.amount!=='number')continue;
    const publishedPrices=[course.tuition?.value,...(course.publishedPriceVariants||[]).map(item=>item.value)].filter(value=>value&&typeof value.amount==='number');
    if(balance&&typeof balance.amount==='number'&&!publishedPrices.some(price=>price.currency===deposit.currency&&price.currency===balance.currency&&price.amount===deposit.amount+balance.amount))errors.push(`${course.courseId} deposit plus balance must match a published price`);
    for(const variant of balance?.variants||[]){
      if(!publishedPrices.some(price=>price.currency===deposit.currency&&price.currency===variant.currency&&price.amount===deposit.amount+variant.amount))errors.push(`${course.courseId} payment variant must match a published location price`);
    }
  }
  return errors;
}
