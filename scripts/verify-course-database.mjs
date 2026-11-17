import { readFile } from 'node:fs/promises';
import courseDatabase from '../src/data/course-database.json' with { type: 'json' };
import affiliatePrograms from '../src/data/affiliate-programs.json' with { type: 'json' };
import { validateCourseDatabase } from '../src/lib/course-database.js';

const errors = validateCourseDatabase(courseDatabase, affiliatePrograms);
if (errors.length) throw new Error(`Course database validation failed:\n- ${errors.join('\n- ')}`);

const dist = new URL('../dist/', import.meta.url);
for (const internalFile of ['data/affiliate-programs.json', 'data/course-database.json']) {
  try {
    await readFile(new URL(internalFile, dist));
    throw new Error(`Internal source data was copied into the public build: ${internalFile}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

const comparisonHtml = await readFile(new URL('tefl-course-comparison-thailand/index.html', dist), 'utf8');
const publicCoursePages = [comparisonHtml];
for (const route of ['essential-tefl-review', 'see-tefl-chiang-mai-review', 'world-tesol-academy-review', 'teflen-review']) {
  publicCoursePages.push(await readFile(new URL(`${route}/index.html`, dist), 'utf8'));
}
for (const html of publicCoursePages) {
  if (html.includes('COURSE_DATABASE_REVIEW:') || html.includes('{{COURSE_FACT:')) throw new Error('An unresolved course-data marker was emitted into a public page.');
  for (const internalValue of ['partnershipStatus', 'approvedCourseIds', 'commissionRate', 'Approval record confirmed', 'Partner account activation']) {
    if (html.includes(internalValue)) throw new Error(`Internal affiliate-management value leaked into a public course page: ${internalValue}`);
  }
}

console.log(`Validated ${courseDatabase.providers.length} providers, ${courseDatabase.courses.length} courses and ${affiliatePrograms.length} private affiliate records.`);
