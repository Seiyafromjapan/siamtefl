import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import database from '../src/data/course-database.json' with { type: 'json' };
import schedules from '../src/data/course-schedules.json' with { type: 'json' };
import { validateCalculatorCourseData, validateCourseSchedules } from '../src/lib/course-schedule.js';

const scheduleErrors = validateCourseSchedules(schedules, database);
if (scheduleErrors.length) throw new Error(`Course schedule validation failed:\n- ${scheduleErrors.join('\n- ')}`);
const calculatorErrors = validateCalculatorCourseData(database);
if (calculatorErrors.length) throw new Error(`Calculator course facts validation failed:\n- ${calculatorErrors.join('\n- ')}`);

const scheduleHtml = await readFile(new URL('../dist/tefl-course-dates-thailand/index.html', import.meta.url), 'utf8');
const calculatorHtml = await readFile(new URL('../dist/calculator/index.html', import.meta.url), 'utf8');
for (const marker of ['COURSE_SCHEDULE_CALENDAR_ROWS', 'COURSE_SCHEDULE_PRICE_ROWS', 'COURSE_SCHEDULE_OTHER_OPTIONS', 'SCHEDULE_FACT:']) {
  if (scheduleHtml.includes(marker)) throw new Error(`Unresolved schedule marker in the public HTML: ${marker}`);
}
assert.match(scheduleHtml, /19 April–18 May/);
assert.match(scheduleHtml, /6 September–1 October/);
assert.match(scheduleHtml, /Starts June 21, 2027 · End date to be confirmed/);
assert.match(scheduleHtml, /official page prints the end year as 20276/i);
assert.doesNotMatch(scheduleHtml, /21 June–16 July/);
assert.match(scheduleHtml, /US\$495/);
assert.match(scheduleHtml, /US\$900/);
assert.match(scheduleHtml, /Official sources checked 17 November 2026/);
assert.match(calculatorHtml, /data-course-prices=/);
assert.match(calculatorHtml, /Official course price sources/);
assert.match(calculatorHtml, /an unconfirmed required fee is excluded from the numeric estimate, not treated as zero/i);
for (const internalFile of ['data/course-schedules.json', 'data/course-database.json', 'data/affiliate-programs.json']) {
  try {
    await readFile(new URL(`../dist/${internalFile}`, import.meta.url));
    throw new Error(`Internal source data was copied into the public build: ${internalFile}`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
console.log(`Validated ${schedules.schedules.length} dated intakes, ${schedules.additionalCourses.length} schedule-only course records, and the calculator's ${Object.keys(database.courses.filter(course => course.providerId === 'essential_tefl')).length} Essential TEFL course options.`);
