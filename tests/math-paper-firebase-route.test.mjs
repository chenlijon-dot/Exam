import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const catalog = read('exam-math-catalog.js');
const firebase = read('firebase-ai-direct.js');

assert.doesNotMatch(
  catalog,
  /math-handwriting-requests|math-handwriting-results|PAPER_RECORD_REPO|getPaperGithubToken/,
  'paper practice must not use the legacy GitHub request/polling pipeline'
);

assert.match(
  catalog,
  /3\(x - 2\) \+ 5 = 2x \+ 7，求 x/,
  'paper practice must keep the original fixed linear test question'
);

assert.match(
  catalog,
  /math-paper-linear-test-001/,
  'paper practice must use the stable linear test questionId'
);

assert.match(
  catalog,
  /expectedAnswer:\s*['"]x = 8['"]/,
  'fixed linear test question must carry x = 8 as expectedAnswer'
);

assert.match(
  firebase,
  /3\(x - 2\) \+ 5 = 2x \+ 7，求 x/,
  'Firebase fallback question must match the visible fixed linear test question'
);

assert.match(
  firebase,
  /expectedAnswer:\s*['"]x = 8['"]/,
  'Firebase fallback must use x = 8 for the fixed linear test question'
);

assert.doesNotMatch(
  catalog,
  /x² - 5x \+ 6 = 0/,
  'paper practice must not show the obsolete quadratic test question'
);

assert.doesNotMatch(
  firebase,
  /x\^2 - 5x \+ 6 = 0/,
  'Firebase fallback must not grade against the obsolete quadratic question'
);

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
  /Firebase AI Logic/,
  'paper practice UI should identify Firebase AI Logic as the grading path'
);

console.log('Math paper fixed linear-test Firebase route contract: PASS');
