import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const parse = path => JSON.parse(read(path));

const sections = ['1-1','1-2','1-3','1-4'];
const banks = sections.map(section =>
  parse(`chapter-bank/math/7-1/${section}/school-exams-chiayi-113.json`)
);

const active = banks.flatMap(bank => bank.questions || []);
const pending = banks.flatMap(bank => bank.pendingQuestions || []);
const all = [...active, ...pending];

assert.equal(active.length, 31, 'Chiayi should expose 31 active auto-gradable items');
assert.equal(pending.length, 0, 'Chiayi should have no pending items after the verified answer-key correction');
assert.equal(all.length, 31, 'Chiayi source exam has 31 independently indexed answer items');

const ids = all.map(question => question.questionId);
assert.equal(new Set(ids).size, ids.length, 'Chiayi questionId values must be unique');
assert.ok(all.every(question => /^260922213000\d{3}$/.test(question.questionId)), 'questionId block must match allocated Chiayi prefix');
assert.ok(all.every(question => Number(question.revision) === 1), 'new Chiayi questions must start at revision 1');

assert.ok(active.every(question => question.answerVerified === true), 'every active Chiayi item must be verified for production use');

const corrected = active.find(question => question.originalQuestionNumber === '二-04');
assert.ok(corrected, '二-04 must be promoted to active');
assert.equal(corrected.answerVerified, true);
assert.equal(corrected.officialAnswer, '13');
assert.equal(corrected.verifiedAnswer, '18');
assert.equal(corrected.a, 3, '18 must be the correct option');
assert.match(corrected.answerNote, /官方答案卷.*13/);
assert.match(corrected.answerNote, /題幹.*18/);

const networkQuestion = active.find(question => question.originalQuestionNumber === '一-10');
assert.equal(networkQuestion?.diagram?.type, 'node-network', 'Q10 must use native node-network drawing');

const numberLineQuestions = active.filter(question => /^三-1\(/.test(question.originalQuestionNumber));
assert.equal(numberLineQuestions.length, 3);
assert.ok(numberLineQuestions.every(question => question.diagram?.type === 'number-line'));

const renderer = read('exam-diagram-renderer.js');
assert.match(renderer, /case 'node-network': return validateNodeNetwork\(spec\)/);
assert.match(renderer, /function renderNodeNetwork\(container, rawSpec\)/);
assert.match(renderer, /case 'node-network': return renderNodeNetwork\(container, checked\.value\)/);

const catalog = read('exam-math-catalog.js');
for (const section of sections) {
  assert.ok(
    catalog.includes(`chapter-bank/math/7-1/${section}/school-exams-chiayi-113.json`),
    `catalog must merge Chiayi sidecar for ${section}`
  );
}
assert.equal((catalog.match(/schoolCount: 3/g) || []).length, 4, 'all four math sections must show 3 indexed schools');

console.log('Chiayi 113 math school-bank contract: PASS');
