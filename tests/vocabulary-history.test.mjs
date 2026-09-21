import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const code = fs.readFileSync(new URL('../exam-english-vocabulary-simple.js', import.meta.url), 'utf8');

const document = {
  addEventListener() {},
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement() { return { style:{}, classList:{ add(){}, remove(){}, toggle(){} }, appendChild(){}, addEventListener(){}, remove(){} }; },
  body: { appendChild() {} },
  readyState: 'complete'
};

const context = {
  window: { addEventListener() {} },
  document,
  console,
  localStorage: { getItem(){ return null; }, setItem(){} },
  MutationObserver: class { observe(){} },
  setTimeout() { return 0; },
  clearTimeout() {},
  fetch: async () => ({ ok:true, json:async()=>({}) }),
  alert() {}
};

vm.createContext(context);
vm.runInContext(code, context);

const vocab = context.window.ChrisExamVocabulary;

assert.equal(vocab.formatActiveHistory({ wrongCount: 0 }), null);
assert.equal(vocab.formatActiveHistory({ wrongCount: 3 }), '錯題 3 次');

assert.equal(
  vocab.answeredCount({ correctCount: 5, wrongCount: 3, reviewCount: 99, unansweredCount: 40 }),
  8
);

assert.deepEqual(
  JSON.parse(JSON.stringify(vocab.formatSubmittedHistory({
    correctCount: 5,
    wrongCount: 3,
    lastSelectedLabel: 'B',
    lastResult: 'correct'
  }))),
  ['作答 8 次｜錯題 3 次', '上次：選 B｜正確']
);

assert.deepEqual(
  JSON.parse(JSON.stringify(vocab.formatSubmittedHistory({
    correctCount: 4,
    wrongCount: 0,
    lastSelectedLabel: 'A',
    lastResult: 'correct'
  }))),
  ['作答 4 次', '上次：選 A｜正確']
);

const recordsCode = fs.readFileSync(new URL('../exam-records.js', import.meta.url), 'utf8');
const firestoreCode = fs.readFileSync(new URL('../firebase-firestore-sync.js', import.meta.url), 'utf8');

assert.match(recordsCode, /vocabularyItems/, 'GEPT attempts must persist vocabulary session snapshots');
assert.match(recordsCode, /vocabId/, 'GEPT session snapshots must preserve vocabId');
assert.match(firestoreCode, /loadVocabularyAttempts/, 'history store must expose vocabulary session history');
assert.match(code, /vocabRecallBtn/, 'GEPT submit flow must expose its own recall button');
assert.match(code, /vocabularyItems/, 'GEPT recall must render stored vocabulary session snapshots');
assert.match(code, /data-vocab-recall-controls/, 'GEPT recall must expose synchronized top/bottom navigation');
assert.match(code, /exam:attempt-recorded/, 'GEPT recall button must appear after authoritative attempt persistence');

console.log('vocabulary history semantics + session recall: PASS');
