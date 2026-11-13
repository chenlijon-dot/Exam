import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = 'chapter-bank/science/7-1/unit-04/section-01';
const expected = { easy:20, medium:30, hard:50 };
const banks = Object.fromEntries(Object.keys(expected).map(level => [level, JSON.parse(readFileSync(root + '/' + level + '.json', 'utf8'))]));

test('unit 4-1 banks contain 20/30/50 active stable questions', () => {
  const all = [];
  for (const [level, count] of Object.entries(expected)) {
    const data = banks[level];
    assert.equal(data.questions.length, count);
    assert.equal(data.exam.difficulty, 'science-7-1-u04-s01-' + level);
    assert.equal(data.exam.lifecycle, 'active');
    assert.equal(data.exam.scoreMode, 'percent');
    assert.equal(data.exam.sourceType, 'practice-generated');
    for (const q of data.questions) {
      assert.match(q.questionId, /^\d{15}$/);
      assert.ok(Number.isInteger(q.revision) && q.revision > 0);
      assert.equal(q.lifecycle, 'active');
      assert.equal(q.answerVerified, true);
      assert.equal(q.o.length,4);
      assert.equal(new Set(q.o).size,4);
      assert.ok(Number.isInteger(q.a) && q.a>=0 && q.a<4);
      assert.ok(q.e.length>5);
      assert.deepEqual(q.optionCanonicalIndices,[0,1,2,3]);
      assert.doesNotMatch(q.q,/蒸散|氣孔|保衛細胞|芹菜|切花/);
      if(level==='medium') assert.match(q.q,/＿＿/);
      all.push(q.questionId);
    }
  }
  assert.equal(new Set(all).size,100);
});

test('catalog and navigation expose the unit 4-1 loader', () => {
  const catalog=readFileSync('exam-catalog.js','utf8');
  const navigation=readFileSync('exam-navigation-fix.js','utf8');
  const loader=readFileSync('exam-science-unit4.js','utf8');
  assert.match(catalog,/key: 'science-7-1-4-1'.+enabled: true/);
  assert.match(navigation,/loadScienceUnit4Module\(\);/);
  assert.match(loader,/startExam\(context.key\)/);
  assert.match(loader,/scoreMode:'percent'/);
  assert.match(loader,/q.lifecycle === 'active' && q.answerVerified === true/);
});
