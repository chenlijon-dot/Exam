import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code = fs.readFileSync(new URL('../exam-question-history.js', import.meta.url), 'utf8');

const document = {
  addEventListener() {},
  querySelectorAll() { return []; },
  querySelector() { return null; },
  getElementById() { return null; },
  head: { appendChild() {} },
  createElement() { return { style:{}, classList:{ add(){}, remove(){} } }; }
};

const context = {
  window: {},
  document,
  console,
  CustomEvent: class CustomEvent {}
};

vm.createContext(context);
vm.runInContext(code, context);

const ui = context.window.ExamQuestionHistoryUI;

assert.equal(ui.formatActiveHistory({ wrongCount: 0 }), null);
assert.equal(ui.formatActiveHistory({ wrongCount: 2 }), '錯題 2 次');

assert.deepEqual(
  JSON.parse(JSON.stringify(ui.formatSubmittedHistory({
    answeredCount: 3,
    wrongCount: 2,
    lastSelectedAnswer: 'C',
    lastResult: 'correct'
  }))),
  ['作答 3 次｜錯題 2 次', '上次：選 C｜正確']
);

const neverWrong = ui.formatSubmittedHistory({
  answeredCount: 3,
  wrongCount: 0,
  lastSelectedAnswer: 'B',
  lastResult: 'correct'
});

assert.deepEqual(
  JSON.parse(JSON.stringify(neverWrong)),
  ['作答 3 次', '上次：選 B｜正確']
);
assert.ok(!neverWrong.join(' ').includes('錯題 0 次'));


const recallView = ui.buildRecallAttemptView({
  answers: [
    { questionId: 'q1', result: 'incorrect', selectedDisplayLabel: 'C' },
    { questionId: 'q2', result: 'correct', selectedDisplayLabel: 'A' },
    { questionId: 'q3', result: 'unclear', selectedDisplayLabel: 'B' },
    { questionId: '', result: 'incorrect', selectedDisplayLabel: 'D' }
  ]
});

assert.deepEqual(
  JSON.parse(JSON.stringify(recallView)),
  {
    q1: { wrong: true, label: '當時：選 C｜錯誤' },
    q2: { wrong: false, label: '當時：選 A｜正確' }
  }
);

console.log('question-history UI formatting: PASS');
