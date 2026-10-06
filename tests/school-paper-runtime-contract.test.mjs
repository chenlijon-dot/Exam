import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = name => fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const catalog = read('exam-catalog.js');
const nav = read('exam-navigation-fix.js');
const records = read('exam-records.js');
const firestore = read('firebase-firestore-sync.js');
const ui = read('exam-science-school-records.js');
const importer = read('school-paper-import.js');

assert.match(catalog, /science-7-1-u01-school-records/);
assert.match(catalog, /type: 'school-records'/);
assert.match(catalog, /s\.type !== 'school-records'/);
assert.match(nav, /loadSchoolPaperImportModule/);
assert.match(nav, /loadScienceSchoolRecordsModule/);
assert.match(records, /recordOrigin: ctx\.recordOrigin \|\| 'web'/);
assert.match(records, /schoolExamId: ctx\.schoolExamId \|\| ''/);
assert.match(firestore, /async function importSchoolPaperAttempt/);
assert.match(firestore, /where\('schoolExamId', '==', schoolExamId\)/);
assert.match(firestore, /existingPaper/);
assert.match(firestore, /recordOrigin === 'school-paper'/);
assert.match(firestore, /already-imported/);
assert.match(firestore, /importSchoolPaperAttempt/);
assert.match(ui, /只讀回顧/);
assert.match(ui, /q\.optionImage/);
assert.match(ui, /recordOrigin:'web'/);
assert.match(ui, /schoolExamId:SCHOOL_EXAM_ID/);
assert.match(importer, /recordOrigin !== 'school-paper'/);
assert.match(importer, /historyDomain !== 'question'/);

console.log('school-paper runtime contract: PASS');
