import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const catalog = read('exam-math-catalog.js');

assert.doesNotMatch(
  catalog,
  /math-handwriting-requests|math-handwriting-results|PAPER_RECORD_REPO|getPaperGithubToken/,
  'paper practice must not use the legacy GitHub request/polling pipeline'
);

assert.doesNotMatch(
  catalog,
  /x² - 5x \+ 6 = 0|math-paper-quadratic-test-001/,
  'paper practice must not hard-code the old quadratic test question'
);

assert.match(
  catalog,
  /ExamHandwriting\?\.openCanvas|ExamHandwriting\.openCanvas/,
  'paper practice must reuse the shared handwriting canvas'
);

assert.match(
  catalog,
  /ExamHandwriting\?\.uploadAndGrade|ExamHandwriting\.uploadAndGrade/,
  'paper practice must grade through the shared Firebase handwriting grader'
);

for (const section of ['1-1','1-2','1-3','1-4']) {
  assert.ok(
    catalog.includes(`chapter-bank/math/7-1/${section}/hard.json`),
    `paper practice must source current handwriting questions from ${section} hard bank`
  );
}

assert.match(
  catalog,
  /Firebase AI Logic/,
  'paper practice UI should identify Firebase AI Logic as the grading path'
);

console.log('Math paper Firebase route contract: PASS');
