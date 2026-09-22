import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const parse = path => JSON.parse(read(path));

const sections = ['1-1','1-2','1-3','1-4'];
const banks = sections.map(section =>
  parse(`chapter-bank/math/7-1/${section}/school-exams-zhongxing-112.json`)
);

const active = banks.flatMap(bank => bank.questions || []);
assert.equal(active.length, 29, 'Zhongxing should expose 29 independently indexed answer items');

const ids = active.map(question => question.questionId);
assert.equal(new Set(ids).size, ids.length, 'Zhongxing questionId values must be unique');
assert.ok(active.every(question => /^260922234200\d{3}$/.test(question.questionId)), 'questionId block must match allocated Zhongxing prefix');
assert.ok(active.every(question => Number(question.revision) === 1), 'new Zhongxing questions must start at revision 1');

const derived = active.filter(question => question.answerBasis === 'derived');
assert.deepEqual(
  derived.map(question => question.originalQuestionNumber).sort(),
  ['二-1(1)','二-1(2)'],
  'only the two blank official-answer cells may use derived answers'
);
assert.ok(derived.every(question => question.answerVerified === false));
assert.ok(active.filter(question => !derived.includes(question)).every(question => question.answerVerified === true));

const diagrams = active.filter(question => question.diagram);
assert.deepEqual(
  diagrams.map(question => question.originalQuestionNumber).sort(),
  ['一-03','一-21','一-22'],
  'the three source number-line questions must use native drawings'
);
assert.ok(diagrams.every(question => question.diagram.type === 'number-line'));

const catalog = read('exam-math-catalog.js');
for (const section of sections) {
  assert.ok(
    catalog.includes(`chapter-bank/math/7-1/${section}/school-exams-zhongxing-112.json`),
    `catalog must merge Zhongxing sidecar for ${section}`
  );
}
assert.equal((catalog.match(/schoolCount: 4/g) || []).length, 4, 'all four math sections must show 4 indexed schools');

console.log('Zhongxing 112 math school-bank contract: PASS');
