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


assert.ok(records.includes("const questionId = source.questionId"), 'history records must read permanent questionId');
assert.ok(records.includes("const questionRevision = Number(source.revision || 1)"), 'history records must preserve revision');
assert.ok(records.includes("selectedIndex === null || correctIndex === null"), 'blank MCQ must be excluded from question history');
assert.ok(records.includes("verdict === 'correct' || verdict === 'incorrect'"), 'only clearly graded handwriting enters history');
assert.ok(records.includes("answers: historyAnswers"), 'schema-v3 answers must contain only valid history answers');
assert.ok(records.includes("wrongAnswers: historyAnswers.filter"), 'wrongAnswers must derive from valid history answers');

const index = read('index.html');
assert.ok(
  index.indexOf('exam-question-history-core.js') < index.indexOf('exam-records.js'),
  'question history core must load before exam-records'
);


const randomizer = read('exam-option-randomizer.js');
assert.match(randomizer, /optionCanonicalIndices/, 'option randomizer must preserve canonical option identity');
assert.match(records, /selectedCanonicalIndex/, 'attempt records must store canonical selected option');
assert.match(records, /correctCanonicalIndex/, 'attempt records must store canonical correct option');


const firestoreSync = read('firebase-firestore-sync.js');

assert.match(
  firestoreSync,
  /window\.ChrisExamHistoryStore/,
  'Firestore sync must expose a question history store'
);

assert.match(
  firestoreSync,
  /loadRecentQuestionAttempts/,
  'history store must expose recent fixed-question attempts'
);

assert.match(
  firestoreSync,
  /loadExamAttempts/,
  'history store must expose same-exam attempts'
);

assert.match(
  firestoreSync,
  /where\(['"]historyDomain['"],\s*['"]==['"],\s*['"]question['"]\)/,
  'fixed-question history queries must exclude vocabulary history'
);

assert.match(
  firestoreSync,
  /where\(['"]examKey['"],\s*['"]==['"]/,
  'same-exam history query must filter by examKey'
);

assert.match(
  firestoreSync,
  /Math\.min\([^\n]*50\)/,
  'history query limit must be capped at 50'
);


const historyUi = read('exam-question-history.js');

assert.match(historyUi, /錯題/, 'history UI must render wrong-count annotations');
assert.match(historyUi, /作答/, 'history UI must render answered-count annotations after submit');
assert.match(historyUi, /exam:started/, 'history UI must reset/load on exam start');
assert.match(historyUi, /exam:submitted/, 'history UI must expand after submit');
assert.match(historyUi, /resetForRetry/, 'history UI must expose retry reset');


assert.match(
  historyUi,
  /exam:submitted[\s\S]*?loadToken\s*\+=\s*1/,
  'submit must invalidate pending active history load before merging the current attempt'
);


assert.match(
  firestoreSync,
  /chrisexam-firestore-ready/,
  'Firestore sync must announce when history reads are ready'
);

assert.match(
  historyUi,
  /chrisexam-firestore-ready/,
  'history UI must retry loading when Firestore becomes ready'
);


assert.match(historyUi, /回溯/, 'same-exam recall must expose a recall control');
assert.match(historyUi, /前一次/, 'same-exam recall must expose older-attempt navigation');
assert.match(historyUi, /後一次/, 'same-exam recall must expose newer-attempt navigation');
assert.match(historyUi, /history-wrong/, 'same-exam recall must support red wrong-question highlighting');
assert.match(historyUi, /loadExamAttempts/, 'same-exam recall must load attempts for the current examKey');
assert.match(historyUi, /questionHistoryRecallControls/, 'recall navigation must have a removable controls container');
assert.match(historyUi, /data-history-answer/, 'historical selected answer/result must be rendered separately');

console.log('question-history lifecycle + schema-v3 contract: PASS');
