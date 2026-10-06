import assert from 'node:assert/strict';
import fs from 'node:fs';

const s=fs.readFileSync(new URL('../exam-science-school-records.js',import.meta.url),'utf8');

assert.match(s,/學校考試紀錄/);
assert.match(s,/73 \/ 100/);
assert.match(s,/答錯/);
assert.match(s,/回顧這次考試/);
assert.match(s,/重新作答/);
assert.match(s,/science-7-1-u01-school-records/);
assert.doesNotMatch(s,/匯入我的學習歷程/);

console.log('science school records ui: PASS');
