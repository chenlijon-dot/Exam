import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const runtime = read('exam-runtime-flex.js');
const records = read('exam-records.js');

assert.match(
  runtime,
  /await\s+Promise\.all\([\s\S]*?document\.dispatchEvent\(new CustomEvent\(['"]exam:submitted['"]/,
  'exam:submitted must occur after awaited handwriting grading'
);

assert.match(
  records,
  /document\.addEventListener\(['"]exam:submitted['"]/,
  'exam-records must persist from exam:submitted'
);

const submissionHookStart = records.indexOf('function hookSubmission()');
assert.notEqual(submissionHookStart, -1, 'hookSubmission must exist');
const submissionHook = records.slice(submissionHookStart, submissionHookStart + 2200);

assert.doesNotMatch(
  submissionHook,
  /addEventListener\(['"]click['"][\s\S]*?#submitBtn/,
  'raw submit-button clicks must not create completed attempts'
);

assert.match(
  records,
  /schemaVersion:\s*3/,
  'new attempts must use schemaVersion 3'
);

assert.match(
  records,
  /historyDomain/,
  'new attempts must declare a historyDomain'
);

assert.match(
  runtime,
  /handwritingResults:\s*handwritingResults\.map/,
  'exam:submitted must carry compact handwriting results'
);

const blankHandwritingStart = runtime.indexOf('if (!hasAnswer)');
assert.notEqual(blankHandwritingStart, -1, 'blank handwriting branch must exist');
const blankHandwritingBlock = runtime.slice(blankHandwritingStart, blankHandwritingStart + 700);

assert.doesNotMatch(
  blankHandwritingBlock,
  /verdict:\s*['"]incorrect['"]/,
  'blank handwriting must not be classified as incorrect'
);

assert.match(
  blankHandwritingBlock,
  /verdict:\s*['"]unanswered['"]/,
  'blank handwriting must use an explicit unanswered state'
);

console.log('question-history lifecycle + schema-v3 contract: PASS');
