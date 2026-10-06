import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const catalog = read('exam-catalog.js');
const nav = read('exam-navigation-fix.js');
const records = read('exam-records.js');
const firestore = read('firebase-firestore-sync.js');
const ui = read('exam-science-school-records.js');

assert.match(catalog, /science-7-1-u01-school-records/);
assert.match(catalog, /type: 'school-records'/);
assert.match(catalog, /s\.type !== 'school-records'/);

assert.match(ui, /學校考試紀錄/);
assert.match(ui, /73 \/ 100/);
assert.match(ui, /查看考卷|回顧這次考試/);
assert.match(ui, /重新挑戰這份考卷/);
assert.match(ui, /startExam\(EXAM_KEY\)/);
assert.match(ui, /只讀回顧/);
assert.doesNotMatch(ui, /匯入我的學習歷程/);
assert.doesNotMatch(ui, /SchoolPaperImport/);
assert.doesNotMatch(ui, /chrisexam-auth-ready|chrisexam-auth-changed/);

assert.doesNotMatch(nav, /school-paper-import\.js/);
assert.doesNotMatch(nav, /loadSchoolPaperImportModule/);

assert.match(ui, /function ensureOriginalPaperRecorded/);
assert.match(ui, /examRecords\.v1/);
assert.match(ui, /localStorage\.setItem/);
assert.match(ui, /schoolExamId/);
assert.doesNotMatch(firestore, /importSchoolPaperAttempt/);

assert.match(records, /historyDomain/);
assert.match(records, /answers: historyAnswers/);

assert.ok(
  !fs.existsSync(new URL('../school-paper-import.js', import.meta.url)),
  'school-paper-import.js should be removed; school paper history is a built-in source, not a separate import workflow'
);

console.log('school-paper simplified runtime contract: PASS');
