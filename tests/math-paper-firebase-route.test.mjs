import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const catalog = read('exam-math-catalog.js');

assert.doesNotMatch(
  catalog,
  /math-handwriting-requests|math-handwriting-results|PAPER_RECORD_REPO|getPaperGithubToken/,
  'paper practice must not use the legacy GitHub request/polling pipeline'
);

assert.match(
  catalog,
  /x² - 5x \+ 6 = 0/,
  'paper practice must keep the original fixed quadratic test question'
);

assert.match(
  catalog,
  /math-paper-quadratic-test-001/,
  'paper practice must keep a stable test questionId'
);

for (const section of ['1-1','1-2','1-3','1-4']) {
  assert.ok(
    !catalog.includes(`PAPER_HANDWRITING_SOURCES`) ||
    !catalog.includes(`chapter-bank/math/7-1/${section}/hard.json`),
    'paper practice must not expose a selector backed by live chapter handwriting banks'
  );
}

assert.doesNotMatch(
  catalog,
  /paperQuestionSelect|選擇目前題目|目前題庫手寫題，共/,
  'paper practice must remain a single fixed test page without a question selector'
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

assert.match(
  catalog,
  /expectedAnswer[^\n]*x = 2 或 x = 3|expectedAnswer:\s*['"]x = 2 或 x = 3['"]/,
  'fixed test question must carry its expected answer into Firebase grading'
);

assert.match(
  catalog,
  /Firebase AI Logic/,
  'paper practice UI should identify Firebase AI Logic as the grading path'
);

console.log('Math paper fixed-test Firebase route contract: PASS');
