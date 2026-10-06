import assert from 'node:assert/strict';
import fs from 'node:fs';
const s=fs.readFileSync(new URL('../school-paper-import.js',import.meta.url),'utf8');
assert.match(s,/recordOrigin !== 'school-paper'/);assert.match(s,/historyDomain !== 'question'/);assert.match(s,/schoolExamId/);assert.match(s,/importSchoolPaperAttempt/);assert.match(s,/window\.SchoolPaperImport/);
console.log('school-paper import contract: PASS');
