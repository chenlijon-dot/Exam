import assert from 'node:assert/strict';
import fs from 'node:fs';
const s=fs.readFileSync(new URL('../exam-science-school-records.js',import.meta.url),'utf8');
assert.match(s,/重新挑戰這份考卷/);assert.match(s,/startExam\(EXAM_KEY\)/);assert.match(s,/recordOrigin:'web'/);assert.match(s,/schoolExamId:SCHOOL_EXAM_ID/);
console.log('school-paper retry: PASS');
