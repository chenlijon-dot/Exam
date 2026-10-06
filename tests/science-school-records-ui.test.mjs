import assert from 'node:assert/strict';
import fs from 'node:fs';
const s=fs.readFileSync(new URL('../exam-science-school-records.js',import.meta.url),'utf8');
assert.match(s,/學校考試紀錄/);assert.match(s,/73 \/ 100/);assert.match(s,/答錯/);assert.match(s,/查看考卷/);assert.match(s,/science-7-1-u01-school-records/);
console.log('science school records ui: PASS');
