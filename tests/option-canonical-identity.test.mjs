import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code = fs.readFileSync(new URL('../exam-option-randomizer.js', import.meta.url), 'utf8');
const originalOptions = ['alpha', 'beta', 'gamma', 'delta'];
const question = { o: [...originalOptions], a: 2 };
const banks = { demo: [question] };

const context = {
  window: {
    crypto: null,
    examContexts: { demo: {} },
    startExam() {}
  },
  banks
};

vm.createContext(context);
vm.runInContext('Math.random = () => 0;', context);
vm.runInContext(code, context);

context.window.startExam('demo');

assert.ok(
  Array.isArray(question.optionCanonicalIndices),
  'shuffle must create optionCanonicalIndices'
);
assert.deepEqual(
  [...question.optionCanonicalIndices].sort((a, b) => a - b),
  [0, 1, 2, 3],
  'canonical indices must remain a permutation of the original option identities'
);
assert.equal(
  question.optionCanonicalIndices[question.a],
  2,
  'the shuffled correct display option must still point to original canonical answer 2'
);
assert.deepEqual(
  question.o.map(text => originalOptions.indexOf(text)),
  [...question.optionCanonicalIndices],
  'each shuffled display option must retain its original canonical identity'
);

context.window.startExam('demo');

assert.equal(
  question.optionCanonicalIndices[question.a],
  2,
  'a second shuffle must not reset canonical identity to the first shuffled order'
);
assert.deepEqual(
  question.o.map(text => originalOptions.indexOf(text)),
  [...question.optionCanonicalIndices],
  'canonical identity must remain attached to option content after repeated shuffles'
);

console.log('option canonical identity: PASS');
