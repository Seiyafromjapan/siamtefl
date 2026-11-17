import test from 'node:test';
import assert from 'node:assert/strict';
import pages from '../src/pages.json' with { type: 'json' };
import database from '../src/data/course-database.json' with { type: 'json' };
import schedules from '../src/data/course-schedules.json' with { type: 'json' };
import { renderCourseCalculatorData, renderCourseDatabasePilot, renderCourseComparisonTable, renderReviewCourseFacts, validateCourseDatabase } from '../src/lib/course-database.js';
import { bangkokToday, renderCourseSchedulePage, validateCalculatorCourseData, validateCourseSchedules } from '../src/lib/course-schedule.js';

const datePage = pages.find(page => page.path === '/tefl-course-dates-thailand/');
const calculatorPage = pages.find(page => page.path === '/calculator/');

test('schedule and calculator source records are structurally valid and evidence-backed', () => {
  assert.deepEqual(validateCourseSchedules(schedules, database), []);
  assert.deepEqual(validateCalculatorCourseData(database), []);
  assert.deepEqual(validateCourseDatabase(database), []);
  assert.equal(schedules.schedules.length, 67);
  assert.equal(schedules.additionalCourses.length, 4);
  assert.ok(schedules.schedules.every(item => item.availabilityStatus === 'scheduled' && item.seatAvailability === 'unverified'));
  assert.ok(schedules.schedules.every(item => item.tuitionOverride === null));
  assert.ok(schedules.schedules.every(item => typeof item.monthlyCalendar === 'boolean'));
  const unresolvedEnd=schedules.schedules.find(item=>item.scheduleId==='see_tefl_120_in_person_2027-06-21');
  assert.equal(unresolvedEnd.startDate,'2027-06-21');
  assert.equal(unresolvedEnd.endDate,null);
  assert.equal(unresolvedEnd.endDateVerificationStatus,'unverified');
  assert.match(unresolvedEnd.endDateVerificationNotes,/20276/);
});

test('the date article renders corrected, sourced 2027 schedules and current payment data', () => {
  assert.equal(datePage.schema.datePublished, '2026-11-07');
  assert.equal(datePage.schema.dateModified, '2026-11-17');
  const html = renderCourseSchedulePage(datePage, database, schedules, '2026-11-17');
  assert.match(html, /17 November 2026/);
  assert.match(html, /6 September–1 October/); // Essential TEFL date missing from the previous matrix
  assert.match(html, /Starts June 21, 2027 · End date to be confirmed/);
  assert.match(html, /official page prints the end year as 20276/i);
  assert.doesNotMatch(html, /21 June–16 July/);
  assert.match(html, /19 April–18 May/); // CMU official end date, not the old May 19 value
  assert.doesNotMatch(html, /19 April–19 May/);
  assert.match(html, /US\$495/);
  assert.match(html, /US\$900/);
  assert.match(html, /US\$1,750 for Chiang Mai placement/);
  assert.match(html, /US\$1,550 for placement outside Chiang Mai/);
  assert.match(html, /Standard TEFL Course: Published deposit ฿20,000/);
  assert.match(html, /TQUK Level 5 TEFL: Published deposit ฿20,000/);
  assert.match(html, /Calculated remainder after the provider-listed deposit ฿30,000/);
  assert.match(html, /course-month-2027-01/);
  assert.match(html, /aria-label="Jump to month"/);
  assert.match(html, /US\$899 promotional price shown/);
  assert.match(html, /seats are not confirmed/i);
  const monthlyCalendar = html.split('<h2>Quick comparison:')[0];
  assert.doesNotMatch(monthlyCalendar, /Education House|combined TEFL course with Bangkok onsite module|Paid Internship/);
  assert.doesNotMatch(html, /SCHEDULE_FACT|COURSE_SCHEDULE_(?:CALENDAR|PRICE|OTHER)/);
});

test('expired schedules disappear and a not-announced record cannot invent dates', () => {
  const expired = structuredClone(schedules);
  expired.schedules = expired.schedules.map((item, index) => ({ ...item, scheduleId: `${item.scheduleId}_expired_${index}`, startDate: '2025-01-01', endDate: '2025-01-28' }));
  const html = renderCourseSchedulePage(datePage, database, expired, '2026-11-17');
  assert.match(html, /No upcoming 2027 start dates/);
  assert.doesNotMatch(html, /schedule-month-jump/);
  assert.doesNotMatch(html, /4 January|15 March|22 November/);

  const notAnnounced = structuredClone(schedules);
  notAnnounced.schedules.push({
    ...notAnnounced.schedules[0], scheduleId: 'test-no-dates', startDate: null, endDate: null,
    availabilityStatus: 'not_announced', notes: 'Test fixture only.'
  });
  assert.deepEqual(validateCourseSchedules(notAnnounced, database), []);
  assert.doesNotMatch(renderCourseSchedulePage(datePage, database, notAnnounced, '2026-11-17'), /test-no-dates/);

  const unknownEnd=structuredClone(schedules);
  const target=unknownEnd.schedules.find(item=>item.scheduleId==='see_tefl_120_in_person_2027-06-21');
  target.endDateVerificationStatus=null;
  assert.ok(validateCourseSchedules(unknownEnd,database).some(error=>error.includes('explicit unverified state')));
});

test('a course tuition fixture propagates to comparison, review, schedule and calculator only', () => {
  const changed = structuredClone(database);
  const standard=changed.courses.find(item => item.courseId === 'essential_standard_120');
  standard.tuition.value = { amount: 23456, currency: 'THB', priceType: 'test fixture' };
  standard.balanceDue.value = { amount: 3456, currency: 'THB', calculation: 'tuition_minus_deposit', due: 'test fixture' };
  const comparisonPage = pages.find(page => page.path === '/tefl-course-comparison-thailand/');
  const comparison = renderCourseDatabasePilot(comparisonPage, changed);
  const review = renderReviewCourseFacts(pages.find(page => page.path === '/essential-tefl-review/'), changed);
  const dateContent = renderCourseSchedulePage(datePage, changed, schedules, '2026-11-17');
  const calculatorContent = renderCourseCalculatorData(calculatorPage, changed);
  assert.match(comparison, /฿23,456/);
  assert.match(review, /฿23,456/);
  assert.match(dateContent, /฿23,456/);
  assert.match(calculatorContent, /23,456 listed fee/);
  assert.doesNotMatch(dateContent, /฿45,000 · ฿50,000/);
  assert.match(dateContent, /Level 5.*฿50,000/s);
  assert.equal(schedules.schedules.find(item => item.courseId === 'essential_standard_120').tuitionOverride, null);
  assert.match(calculatorContent, /data-course-prices=/);
});

test('calculator course amounts are DB-fed; custom and living-cost fields stay user controlled', () => {
  const html = renderCourseCalculatorData(calculatorPage, database);
  const serialized = html.match(/data-course-prices="([^"]+)"/)?.[1]?.replaceAll('&quot;', '"');
  assert.ok(serialized);
  const priceData = JSON.parse(serialized);
  for (const [amount, currency] of [[45000,'THB'],[50000,'THB'],[90000,'THB'],[130000,'THB']]) {
    assert.ok(Object.values(priceData).some(item => item.amount === amount && item.currency === currency));
  }
  assert.match(html, /value="custom">Other \/ enter no course fee/);
  assert.match(html, /id="customFee"/);
  assert.match(html, /id="accommodation"/);
  assert.match(html, /id="advanceRent"/);
  assert.match(html, /an unconfirmed required fee is excluded from the numeric estimate, not treated as zero/i);
  assert.equal(priceData.standard.deposit.amount, 20000);
  assert.equal(priceData.standard.balanceDue.amount, 25000);
  assert.equal(priceData.level5.deposit.amount, 20000);
  assert.equal(priceData.level5.balanceDue.amount, 30000);
  assert.match(priceData.level5.balanceDue.due, /first day/);
});

test('Essential payment remainder integrity and Bangkok date boundary are deterministic', () => {
  for (const id of ['essential_standard_120','essential_tquk_level5','essential_paid_internship']) {
    const course=database.courses.find(item=>item.courseId===id);
    assert.equal(course.tuition.value.amount-course.deposit.value.amount,course.balanceDue.value.amount);
    assert.equal(course.balanceDue.value.currency,course.tuition.value.currency);
    assert.equal(course.deposit.value.currency,course.tuition.value.currency);
  }
  assert.equal(bangkokToday(new Date('2026-11-16T17:00:00.000Z')),'2026-11-17');
  const dated=structuredClone(schedules);
  dated.schedules=dated.schedules.filter(item=>item.monthlyCalendar&&item.startDate==='2027-01-04');
  assert.match(renderCourseSchedulePage(datePage,database,dated,'2027-01-04'),/4–29 January/);
  assert.doesNotMatch(renderCourseSchedulePage(datePage,database,dated,'2027-01-05'),/4–29 January/);
});

test('SEE TEFL payment splits match their published total and location variants', () => {
  const standard=database.courses.find(item=>item.courseId==='see_tefl_120_in_person');
  assert.equal(standard.tuition.value.amount, standard.deposit.value.amount + standard.balanceDue.value.amount);
  const internship=database.courses.find(item=>item.courseId==='see_tefl_paid_internship');
  for(const balance of internship.balanceDue.value.variants){
    const total=internship.deposit.value.amount+balance.amount;
    assert.ok([internship.tuition.value,...internship.publishedPriceVariants.map(item=>item.value)].some(price=>price.amount===total&&price.currency===balance.currency));
  }
});
