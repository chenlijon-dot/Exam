import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../firebase-ai-direct.js', import.meta.url), 'utf8');

assert.doesNotThrow(
  () => new Function(source),
  'firebase-ai-direct.js must parse as valid JavaScript'
);

const context = {
  window:{},
  document:{ addEventListener(){} },
  localStorage:{ getItem(){ return null; } },
  console,
  setTimeout,
  clearTimeout,
  performance:{ now:() => 0 }
};
vm.createContext(context);
vm.runInContext(source, context);

assert.equal(
  typeof context.window.ChrisExamAI?.gradeMathHandwriting,
  'function',
  'firebase-ai-direct.js must synchronously initialize the math grader'
);

assert.equal(
  typeof context.window.ChrisExamAI?.gradeEnglishHandwriting,
  'function',
  'firebase-ai-direct.js must synchronously initialize the English grader'
);

console.log('Firebase AI direct syntax/init contract: PASS');
