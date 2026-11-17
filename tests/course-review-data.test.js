import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import pages from '../src/pages.json' with { type: 'json' };
import database from '../src/data/course-database.json' with { type: 'json' };
import { renderCourseComparisonTable, renderReviewCourseFacts } from '../src/lib/course-database.js';

const review = path => pages.find(page => page.path === path);
const reviewHtml = path => renderReviewCourseFacts(review(path));

test('all four review pages receive server-rendered facts from the shared database', () => {
  const cases = [
    ['/essential-tefl-review/', 'essential_tefl', 4],
    ['/see-tefl-chiang-mai-review/', 'see_tefl', 2],
    ['/world-tesol-academy-review/', 'world_tesol_academy', 2],
    ['/teflen-review/', 'teflen', 2]
  ];
  for (const [path, providerId, count] of cases) {
    const html = reviewHtml(path);
    assert.match(html, /data-testid="course-database-review-facts"/);
    assert.doesNotMatch(html, /COURSE_DATABASE_REVIEW:/);
    assert.equal((html.match(/class="course-data-review-course"/g) || []).length, count);
    assert.match(html, /checked 17 Nov 2026/);
    assert.match(html, /source/i);
    assert.ok(database.courses.filter(course => course.providerId === providerId).length >= count);
  }
});

test('Essential hour conflict, WTA price variants, and TEFLen partner prices stay explicit', () => {
  const essential = reviewHtml('/essential-tefl-review/');
  assert.match(essential, /hour definitions/i);
  assert.match(essential, /Official pages differ/);
  const wta = reviewHtml('/world-tesol-academy-review/');
  assert.match(wta, /GBP 29/);
  assert.match(wta, /GBP 149/);
  assert.match(wta, /GBP 159/);
  const teflen = reviewHtml('/teflen-review/');
  assert.match(teflen, /US\$254/);
  assert.match(teflen, /US\$339/);
});

test('the 120-hour versus 168 GLH distinction is dated and does not imply equivalence', () => {
  const page=review('/online-vs-in-person-tefl-thailand/');
  assert.equal(page.schema.datePublished,'2026-10-08');
  assert.equal(page.schema.dateModified,'2026-11-17');
  assert.match(page.content,/Standard course as 120 hours and the Level 5 qualification as 168 guided learning hours/);
  assert.match(page.content,/do not publish a breakdown reconciling the 120-hour course figure with the 168 GLH/);
  assert.match(page.content,/Checked 17 November 2026/);
});

test('SEE TEFL published balance and payment deadline remain visible with primary source attribution', () => {
  const seeCourse = database.courses.find(course => course.courseId === 'see_tefl_120_in_person');
  assert.deepEqual(seeCourse.balanceDue.value, {
    amount: 900,
    currency: 'USD',
    due: 'On or before the first training day'
  });
  assert.equal(seeCourse.balanceDue.verificationStatus, 'primary_verified');
  assert.equal(seeCourse.balanceDue.sourceUrl, 'https://seetefl.com/fees-dates/');
  const review = reviewHtml('/see-tefl-chiang-mai-review/');
  assert.match(review, /US\$900/);
  assert.match(review, /On or before the first training day/);
  assert.match(review, /https:\/\/seetefl\.com\/fees-dates\//);
  const comparison = renderCourseComparisonTable();
  assert.match(comparison, /US\$900/);
  assert.match(comparison, /On or before the first training day/);
});

test('a temporary data value propagates to comparison and matching review output', () => {
  const changed = structuredClone(database);
  const course = changed.courses.find(item => item.courseId === 'essential_standard_120');
  course.tuition.value = { amount: 23456, currency: 'THB', priceType: 'test fixture' };
  course.balanceDue.value = { amount: 3456, currency: 'THB', calculation: 'tuition_minus_deposit', due: 'test fixture' };
  const comparison = renderCourseComparisonTable(changed);
  const page = review('/essential-tefl-review/');
  const reviewOutput = renderReviewCourseFacts(page, changed);
  assert.match(comparison, /฿23,456/);
  assert.match(reviewOutput, /฿23,456/);
  const standardPanel=reviewOutput.split('<section class="course-data-review-course" data-course-id="essential_standard_120">')[1].split('<section class="course-data-review-course"')[0];
  assert.doesNotMatch(standardPanel, /฿45,000/);
});

test('review rendering leaves affiliate anchors and disclosure unchanged', () => {
  const before = review('/teflen-review/').content;
  const after = reviewHtml('/teflen-review/');
  for (const token of ['https://teflen.com/siamtefl/', 'data-placement="teflen-price-section"', 'rel="sponsored nofollow noopener"', 'affiliate']) {
    assert.ok(before.includes(token), `baseline missing ${token}`);
    assert.ok(after.includes(token), `rendered page missing ${token}`);
  }
  const layout = readFileSync(new URL('../src/layouts/SiteLayout.astro', import.meta.url), 'utf8');
  assert.ok(layout.includes('data-placement="teflen-sticky"'), 'TEFLen sticky CTA markup must remain in the shared page layout');
});
