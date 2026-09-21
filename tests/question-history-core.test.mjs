import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const code = fs.readFileSync(new URL('../exam-question-history-core.js', import.meta.url), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(code, context);

const core = context.window.ExamQuestionHistoryCore;

assert.equal(core.qualifiesHistoryAnswer({ result: 'correct', questionId: 'q1' }), true);
assert.equal(core.qualifiesHistoryAnswer({ result: 'incorrect', questionId: 'q1' }), true);
assert.equal(core.qualifiesHistoryAnswer({ result: 'unclear', questionId: 'q1' }), false);
assert.equal(core.qualifiesHistoryAnswer({ result: 'unanswered', questionId: 'q1' }), false);
assert.equal(core.qualifiesHistoryAnswer({ result: 'correct', questionId: '' }), false);

const aggregate = core.aggregateQuestionHistory([
  {
    historyDomain: 'question',
    submittedAt: '2026-09-21T12:00:00+08:00',
    answers: [
      { questionId: 'q1', result: 'incorrect', selectedDisplayLabel: 'B' },
      { questionId: 'q2', result: 'correct', selectedDisplayLabel: 'A' }
    ]
  },
  {
    historyDomain: 'question',
    submittedAt: '2026-09-21T13:00:00+08:00',
    answers: [
      { questionId: 'q1', result: 'correct', selectedDisplayLabel: 'C' }
    ]
  }
]);

assert.deepEqual(
  JSON.parse(JSON.stringify(aggregate.q1)),
  {
    answeredCount: 2,
    correctCount: 1,
    wrongCount: 1,
    lastAttemptAt: '2026-09-21T13:00:00+08:00',
    lastSelectedAnswer: 'C',
    lastResult: 'correct'
  }
);

assert.deepEqual(
  JSON.parse(JSON.stringify(aggregate.q2)),
  {
    answeredCount: 1,
    correctCount: 1,
    wrongCount: 0,
    lastAttemptAt: '2026-09-21T12:00:00+08:00',
    lastSelectedAnswer: 'A',
    lastResult: 'correct'
  }
);

console.log('question-history core: PASS');
