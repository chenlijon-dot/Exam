import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const handwriting = read('exam-handwriting.js');
const firebase = read('firebase-ai-direct.js');

assert.match(
  handwriting,
  /firebase-ai-direct\.js/,
  'handwriting grader must know how to load firebase-ai-direct.js itself'
);

assert.match(
  handwriting,
  /document\.createElement\(['"]script['"]\)/,
  'handwriting grader must dynamically create the Firebase AI script when it is missing'
);

assert.match(
  handwriting,
  /script\.onload|addEventListener\(['"]load['"]/,
  'self-loader must wait for the Firebase AI script load event'
);

assert.match(
  handwriting,
  /script\.onerror|addEventListener\(['"]error['"]/,
  'self-loader must report Firebase AI script load failures'
);

assert.doesNotMatch(
  firebase,
  /closest\?\.\('#submitPaperExamBtn'\)/,
  'firebase-ai-direct.js must not capture the paper submit button'
);

assert.doesNotMatch(
  firebase,
  /runMathDirect\(mathButton\)/,
  'legacy direct math click handler must not compete with ExamHandwriting.uploadAndGrade'
);

assert.match(
  firebase,
  /closest\?\.\('#gptWrongAnalysisBtn'\)/,
  'science wrong-answer AI analysis listener should remain available'
);

console.log('Firebase AI handwriting self-load contract: PASS');
