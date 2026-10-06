import assert from 'node:assert/strict';
import fs from 'node:fs';
const s=fs.readFileSync(new URL('../exam-science-school-records.js',import.meta.url),'utf8');
assert.match(s,/history-wrong/);assert.match(s,/❌ 當時作答/);assert.match(s,/✅ 正確答案/);assert.match(s,/只讀回顧/);assert.doesNotMatch(s,/storeAttemptLocally/);assert.doesNotMatch(s,/dispatchEvent\(new CustomEvent\('exam:submitted'/);
console.log('school-paper review: PASS');
