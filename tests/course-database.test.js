import test from 'node:test';
import assert from 'node:assert/strict';
import courseDatabase from '../src/data/course-database.json' with { type: 'json' };
import affiliatePrograms from '../src/data/affiliate-programs.json' with { type: 'json' };
import { validateCourseDatabase } from '../src/lib/course-database.js';

const clone = value => structuredClone(value);

test('course database baseline is valid', () => {
  assert.deepEqual(validateCourseDatabase(courseDatabase, affiliatePrograms), []);
});

test('duplicate provider and course IDs are rejected', () => {
  const data = clone(courseDatabase);
  data.providers.push(clone(data.providers[0]));
  data.courses.push(clone(data.courses[0]));
  const errors = validateCourseDatabase(data, affiliatePrograms);
  assert.ok(errors.some(error => error.includes('providerId is missing or duplicated')));
  assert.ok(errors.some(error => error.includes('courseId is missing or duplicated')));
});

test('bad references, currency, negative prices, dates and URLs are rejected', () => {
  const data = clone(courseDatabase);
  data.courses[0].providerId = 'missing-provider';
  data.courses[0].tuition.value.amount = -1;
  data.courses[0].tuition.value.currency = 'baht';
  data.courses[0].tuition.lastCheckedDate = '17/11/2026';
  data.courses[0].tuition.sourceUrl = 'javascript:alert(1)';
  const errors = validateCourseDatabase(data, affiliatePrograms);
  assert.ok(errors.some(error => error.includes('unknown provider')));
  assert.ok(errors.some(error => error.includes('non-negative number')));
  assert.ok(errors.some(error => error.includes('3-letter code')));
  assert.ok(errors.some(error => error.includes('lastCheckedDate')));
  assert.ok(errors.some(error => error.includes('sourceUrl must be an HTTPS URL')));
});

test('confirmed values need evidence and affiliate status cannot reference unknown courses', () => {
  const data = clone(courseDatabase);
  data.courses[0].advertisedHours.sourceUrl = null;
  const affiliates = clone(affiliatePrograms);
  affiliates[0].approvedCourseIds.push('not-a-course');
  const errors = validateCourseDatabase(data, affiliates);
  assert.ok(errors.some(error => error.includes('needs an HTTPS source')));
  assert.ok(errors.some(error => error.includes('unknown courseId')));
});

test('unconfirmed values remain distinct from zero', () => {
  const data = clone(courseDatabase);
  const unverified = data.courses.find(course => course.courseId === 'teflen_advanced_120').refundPolicy;
  assert.equal(unverified.value, null);
  assert.equal(unverified.verificationStatus, 'unverified');
  assert.notEqual(unverified.value, 0);
  assert.deepEqual(validateCourseDatabase(data, affiliatePrograms), []);
});

test('published price variants require valid currency, evidence URL and verification dates', () => {
  const data = clone(courseDatabase);
  const variant = data.courses.find(course => course.courseId === 'wta_120_online').publishedPriceVariants[0];
  variant.value.currency = 'pounds';
  variant.sourceUrl = null;
  variant.lastVerifiedDate = null;
  const errors = validateCourseDatabase(data, affiliatePrograms);
  assert.ok(errors.some(error => error.includes('3-letter code')));
  assert.ok(errors.some(error => error.includes('HTTPS source URL and verified date')));
});
