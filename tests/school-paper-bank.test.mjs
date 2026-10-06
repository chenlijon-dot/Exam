import assert from 'node:assert/strict';
import fs from 'node:fs';
const p=new URL('../chapter-bank/science/7-1/unit-01/school-exam-records/2026-unit-01-school-exam-01.json',import.meta.url);
const d=JSON.parse(fs.readFileSync(p,'utf8'));
assert.equal(d.exam.questionCount,30); assert.equal(d.questions.length,30);
const ids=d.questions.map(q=>String(q.questionId||'')); assert.ok(ids.every(Boolean)); assert.equal(new Set(ids).size,30);
assert.ok(d.questions.every(q=>Number(q.revision)>=1));
assert.ok(d.questions.every(q=>['section-01','section-02','section-03'].includes(q.mappedSection)));
assert.deepEqual(d.questions.filter(q=>q.originalPaperResult==='incorrect').map(q=>q.originalLabel),['一-7','一-11','一-12','一-16','一-20','二-5','三-2','三-4']);
for(const q of d.questions.filter(q=>q.image)) {
  assert.match(q.image,/^chapter-bank\/science\/7-1\/unit-01\/school-exam-records\/assets\//);
  assert.ok(fs.existsSync(new URL('../' + q.image, import.meta.url)), `missing asset: ${q.image}`);
}
console.log('school-paper bank: PASS');
