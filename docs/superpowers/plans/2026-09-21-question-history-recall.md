# Question History Recall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reliable per-question learning history and same-exam recall to Exam while keeping `attempts` as the single fixed-question authority and GEPT Vocabulary on its separate `vocabId` progress path.

**Architecture:** First make `exam:submitted` the only completed-attempt boundary, then add schema-v3 identity fields and canonical option mapping. Expose read-only Firestore history queries, render lightweight question-history badges, then add a same-`examKey` recall mode with previous/next navigation and red wrong-question highlighting. Vocabulary remains isolated and is aligned only at the UI/statistics semantics level.

**Tech Stack:** Browser JavaScript (plain IIFE modules), Firebase Web SDK 12.19.0, Cloud Firestore, localStorage, GitHub Pages, dependency-free Node.js contract/unit tests.

**Spec:** `docs/superpowers/specs/2026-09-21-question-history-recall-design.md`

## Global Constraints

- General fixed-question history authority remains `users/{uid}/attempts/{attemptId}`.
- Do not add `questionProgress` or any second fixed-question history authority in release 1.
- Only actually answered and reliably graded responses enter per-question history.
- Blank responses, ungraded manual-study responses, and handwriting `unclear` responses do not enter per-question history.
- `answeredCount = correctCount + wrongCount`.
- Per-question aggregation reads at most the newest 50 fixed-question attempts.
- Same-exam recall reads at most 50 attempts for the current `examKey`.
- GEPT Vocabulary remains keyed by `vocabId` and `vocabularyProgress`; it must not consume the fixed-question 50-attempt windows.
- Active-attempt UI shows only `錯題 N 次` when `N > 0`; never render `錯題 0 次`.
- Post-submit UI shows `作答 N 次`, optional `錯題 M 次`, and latest valid answer/result.
- Same-exam recall highlights only wrong questions from the selected historical attempt in red.
- `重新做題` clears all historical-review state and returns to a clean active-attempt UI.
- Firebase/history failures must never block rendering, answering, grading, or submission.
- Do not perform unrelated refactors.

## Review Focus

- **Double submit / duplicate event:** one completed exam must create at most one local/Firebase attempt; pinned in Task 1 duplicate-boundary test.
- **Shuffled options across retries:** canonical answer identity must survive repeated shuffles and still display the historical letter actually seen; pinned in Task 3 unit test.
- **Partial exams:** answering 5 of 20 questions must update only those 5 histories; pinned in Task 2 schema-v3 test.
- **Handwriting ambiguity:** `unclear` and blank handwriting must not become wrong history; pinned in Task 2 grading filter test.
- **Recall reset leakage:** entering historical mode then pressing `重新做題` must remove red state, historical answers, and navigation; pinned in Task 6 DOM-contract test.

---

### Task 1: Make `exam:submitted` the Only Completed-Attempt Boundary

**Files:**
- Create: `tests/question-history-contract.test.mjs`
- Modify: `exam-records.js`
- Verify: `exam-runtime-flex.js`

**Interfaces:**
- Consumes: browser event `document.dispatchEvent(new CustomEvent('exam:submitted', { detail }))` emitted after grading in `exam-runtime-flex.js`.
- Produces: `exam-records.js` persists exactly one completed attempt in response to `exam:submitted`, never from the raw `#submitBtn` click.

- [ ] **Step 1: Write the failing lifecycle contract test**

Create `tests/question-history-contract.test.mjs`:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const runtime = read('exam-runtime-flex.js');
const records = read('exam-records.js');

assert.match(
  runtime,
  /await\s+Promise\.all\([\s\S]*?document\.dispatchEvent\(new CustomEvent\(['"]exam:submitted['"]/,
  'exam:submitted must occur after awaited handwriting grading'
);

assert.match(
  records,
  /document\.addEventListener\(['"]exam:submitted['"]/,
  'exam-records must persist from exam:submitted'
);

const submissionHookStart = records.indexOf('function hookSubmission()');
assert.notEqual(submissionHookStart, -1, 'hookSubmission must exist');
const submissionHook = records.slice(submissionHookStart, submissionHookStart + 2200);

assert.doesNotMatch(
  submissionHook,
  /addEventListener\(['"]click['"][\s\S]*?#submitBtn/,
  'raw submit-button clicks must not create completed attempts'
);

console.log('question-history lifecycle contract: PASS');
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
node tests/question-history-contract.test.mjs
```

Expected: FAIL because `exam-records.js` still hooks the raw click on `#submitBtn`.

- [ ] **Step 3: Replace the raw-click hook with the completed-event hook**

In `exam-records.js`, replace the current `hookSubmission()` click listener and `setTimeout(..., 0)` with:

```js
function hookSubmission() {
  document.addEventListener('exam:submitted', async event => {
    const detail = event.detail || {};
    const attempt = captureAttempt(detail);
    if (!attempt) return;

    const added = storeAttemptLocally(attempt);
    if (!added) return;

    if (!getToken()) {
      showSyncToast('作答紀錄與錯題已存到這台裝置。尚未設定 GitHub Token，所以這次未同步到雲端。', false);
      return;
    }

    showSyncToast('本機紀錄已保存，正在同步到 GitHub…');
    try {
      await syncAttempt(attempt);
      showSyncToast('✓ 作答紀錄與錯題已同步到私人 GitHub 資料庫。');
    } catch (err) {
      showSyncToast(`本機紀錄已保存，但 GitHub 同步失敗：${err.message}`, false);
    }
  });
}
```

Change the function signature now, even though Task 2 will use the detail more fully:

```js
function captureAttempt(submissionDetail = {}) {
```

Do not change schema fields yet.

- [ ] **Step 4: Run syntax and lifecycle tests**

Run:

```bash
node --check exam-records.js
node --check exam-runtime-flex.js
node tests/question-history-contract.test.mjs
```

Expected: all PASS.

Manual browser check:

1. Open a pure MCQ exam.
2. Answer one question and submit.
3. Confirm one local `examRecords.v1` entry is added.
4. Click submit again without restarting.
5. Confirm no duplicate local entry is added because the existing signature guard rejects the duplicate.
6. Open a handwriting exam, submit, and confirm the record appears only after handwriting grading finishes.

- [ ] **Step 5: Commit**

```bash
git add exam-records.js tests/question-history-contract.test.mjs
git commit -m "Fix attempt capture submission boundary"
```

---

### Task 2: Build Schema-v3 Valid-Answer Records

**Files:**
- Create: `exam-question-history-core.js`
- Create: `tests/question-history-core.test.mjs`
- Modify: `exam-runtime-flex.js`
- Modify: `exam-records.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: source question fields `questionId`, `revision`, question type, current DOM selection, and handwriting grading results from `exam:submitted.detail.handwritingResults`.
- Produces:
  - `window.ExamQuestionHistoryCore.qualifiesHistoryAnswer(answer): boolean`
  - `window.ExamQuestionHistoryCore.aggregateQuestionHistory(attempts): Map<string, stats>`
  - schema-v3 attempts with `historyDomain: 'question' | 'vocabulary' | 'none'`
  - `answers[]` containing only valid graded history responses for `historyDomain: 'question'`.

- [ ] **Step 1: Write failing core tests**

Create `tests/question-history-core.test.mjs`:

```js
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
```

- [ ] **Step 2: Run the core test and verify it fails**

Run:

```bash
node tests/question-history-core.test.mjs
```

Expected: FAIL because `exam-question-history-core.js` does not exist.

- [ ] **Step 3: Create the pure history core**

Create `exam-question-history-core.js`:

```js
(() => {
  'use strict';

  function qualifiesHistoryAnswer(answer) {
    return !!answer?.questionId &&
      (answer.result === 'correct' || answer.result === 'incorrect');
  }

  function aggregateQuestionHistory(attempts) {
    const ordered = [...(attempts || [])].sort((a, b) =>
      String(a.submittedAt || '').localeCompare(String(b.submittedAt || ''))
    );
    const result = {};

    for (const attempt of ordered) {
      if (attempt?.historyDomain !== 'question') continue;
      for (const answer of attempt.answers || []) {
        if (!qualifiesHistoryAnswer(answer)) continue;
        const id = String(answer.questionId);
        const current = result[id] || {
          answeredCount: 0,
          correctCount: 0,
          wrongCount: 0,
          lastAttemptAt: '',
          lastSelectedAnswer: '',
          lastResult: ''
        };
        current.answeredCount += 1;
        if (answer.result === 'correct') current.correctCount += 1;
        else current.wrongCount += 1;
        current.lastAttemptAt = String(attempt.submittedAt || '');
        current.lastSelectedAnswer = answer.selectedDisplayLabel || answer.selectedLetter || answer.selectedText || '';
        current.lastResult = answer.result;
        result[id] = current;
      }
    }

    return result;
  }

  window.ExamQuestionHistoryCore = {
    qualifiesHistoryAnswer,
    aggregateQuestionHistory
  };
})();
```

Load it in `index.html` before `exam-records.js`.

- [ ] **Step 4: Expose final handwriting outcomes in `exam:submitted`**

In `exam-runtime-flex.js`, include a compact serializable array in the event detail after the existing `Promise.all` finishes:

```js
handwritingResults: handwritingResults.map(({ index, result: grading }) => ({
  index,
  verdict: grading?.verdict || 'unclear',
  recognizedAnswer: grading?.recognizedAnswer || '',
  confidence: Number(grading?.confidence ?? 0)
}))
```

For blank handwriting, change the internal missing verdict from `incorrect` to an explicit non-history state such as `unanswered` so Task 2 cannot accidentally classify a blank canvas as learner error.

- [ ] **Step 5: Upgrade `captureAttempt()` to schema v3**

In `exam-records.js`:

1. Set:

```js
schemaVersion: 3,
historyDomain: ctx.examType === 'gept-vocabulary-memory' ? 'vocabulary' : 'question',
```

2. Keep exam-level `correct / incorrect / unanswered / total` summaries for current result/dashboard compatibility.
3. Build history `answers[]` only from:
   - MCQ with a selected option and permanent `questionId`
   - handwriting with permanent `questionId` and final verdict exactly `correct` or `incorrect`
4. Exclude:
   - blank MCQ
   - manual-study
   - blank handwriting
   - handwriting `unclear`
5. Store at least:

```js
{
  questionId: String(source.questionId),
  questionRevision: Number(source.revision || 1),
  questionType,
  selectedDisplayIndex,
  selectedDisplayLabel,
  selectedText,
  result
}
```

Canonical option fields are added in Task 3.

- [ ] **Step 6: Extend tests for partial and handwriting cases**

Append to `tests/question-history-contract.test.mjs` source-contract assertions that:

- `schemaVersion: 3` appears in `exam-records.js`
- `historyDomain` is written
- `handwritingResults` is emitted from `exam-runtime-flex.js`
- the runtime blank-handwriting branch no longer uses `verdict:'incorrect'`.

Run:

```bash
node --check exam-question-history-core.js
node --check exam-runtime-flex.js
node --check exam-records.js
node tests/question-history-core.test.mjs
node tests/question-history-contract.test.mjs
```

Expected: all PASS.

Manual browser check: open a 20-question MCQ exam, answer only 5, submit, inspect the newest local schema-v3 record, and verify `answers.length === 5`.

- [ ] **Step 7: Commit**

```bash
git add exam-question-history-core.js exam-runtime-flex.js exam-records.js index.html tests/question-history-core.test.mjs tests/question-history-contract.test.mjs
git commit -m "Add schema v3 question history records"
```

---

### Task 3: Preserve Canonical Option Identity Through Shuffling

**Files:**
- Modify: `exam-option-randomizer.js`
- Modify: `exam-records.js`
- Modify: `tests/question-history-core.test.mjs`
- Modify: `tests/question-history-contract.test.mjs`

**Interfaces:**
- Consumes: source question `o[]`, `a`, optional `fixedOptions`.
- Produces: source question parallel array `optionCanonicalIndices[]`, where current display index maps to immutable original canonical index; schema-v3 answers store `selectedCanonicalIndex` and `correctCanonicalIndex`.

- [ ] **Step 1: Write the failing canonical-option contract**

Add to `tests/question-history-contract.test.mjs`:

```js
const randomizer = read('exam-option-randomizer.js');

assert.match(
  randomizer,
  /optionCanonicalIndices/,
  'option randomizer must preserve canonical option identity'
);

assert.match(
  records,
  /selectedCanonicalIndex/,
  'attempt records must store canonical selected option'
);

assert.match(
  records,
  /correctCanonicalIndex/,
  'attempt records must store canonical correct option'
);
```

Run:

```bash
node tests/question-history-contract.test.mjs
```

Expected: FAIL.

- [ ] **Step 2: Add canonical indices to the randomizer**

In `shuffleQuestionOptions(question)`, initialize a stable canonical mapping before building shuffle items:

```js
const canonical = Array.isArray(question.optionCanonicalIndices) &&
  question.optionCanonicalIndices.length === question.o.length
  ? [...question.optionCanonicalIndices]
  : question.o.map((_, index) => index);
```

Include `canonicalIndex: canonical[index]` in each shuffle item and, after shuffling:

```js
question.optionCanonicalIndices = items.map(x => x.canonicalIndex);
```

For `fixedOptions` questions, ensure the recorder can fall back to display index when `optionCanonicalIndices` is absent.

- [ ] **Step 3: Record canonical selected/correct indices**

In `exam-records.js`, for MCQ:

```js
const canonicalIndices = Array.isArray(source.optionCanonicalIndices)
  ? source.optionCanonicalIndices
  : source.o?.map((_, optionIndex) => optionIndex) || [];

const selectedCanonicalIndex = selectedIndex === null
  ? null
  : Number(canonicalIndices[selectedIndex] ?? selectedIndex);

const correctCanonicalIndex = correctIndex === null
  ? null
  : Number(canonicalIndices[correctIndex] ?? correctIndex);
```

Store both fields in the answer.

- [ ] **Step 4: Run syntax and contract tests**

Run:

```bash
node --check exam-option-randomizer.js
node --check exam-records.js
node tests/question-history-contract.test.mjs
node tests/question-history-core.test.mjs
```

Expected: all PASS.

Manual browser check: restart the same shuffled practice several times, confirm the correct answer moves among A/B/C/D while the saved `correctCanonicalIndex` remains stable for the same source question.

- [ ] **Step 5: Commit**

```bash
git add exam-option-randomizer.js exam-records.js tests/question-history-contract.test.mjs tests/question-history-core.test.mjs
git commit -m "Preserve canonical option identity"
```

---

### Task 4: Add Read-Only Firestore History Queries

**Files:**
- Modify: `firebase-firestore-sync.js`
- Modify: `tests/question-history-contract.test.mjs`

**Interfaces:**
- Consumes: authenticated Firebase user and `users/{uid}/attempts`.
- Produces browser API:

```js
window.ChrisExamHistoryStore = {
  loadRecentQuestionAttempts(limit = 50): Promise<Array<Attempt>>,
  loadExamAttempts(examKey, limit = 50): Promise<Array<Attempt>>
}
```

- [ ] **Step 1: Write the failing Firestore API contract**

Append:

```js
const firestoreSync = read('firebase-firestore-sync.js');

assert.match(firestoreSync, /window\.ChrisExamHistoryStore/);
assert.match(firestoreSync, /loadRecentQuestionAttempts/);
assert.match(firestoreSync, /loadExamAttempts/);
assert.match(firestoreSync, /historyDomain/);
assert.match(firestoreSync, /limit\(/);
```

Run:

```bash
node tests/question-history-contract.test.mjs
```

Expected: FAIL.

- [ ] **Step 2: Implement `loadRecentQuestionAttempts(50)`**

Add a helper that waits for initialized `db/firestore/activeUser`, then performs a Firestore query equivalent to:

```js
query(
  collection(db, 'users', activeUser.uid, 'attempts'),
  where('historyDomain', '==', 'question'),
  orderBy('submittedAt', 'desc'),
  limit(Math.min(Number(limitCount) || 50, 50))
)
```

Return plain objects:

```js
snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
```

On error, log a warning and return `[]` so exam use is never blocked.

- [ ] **Step 3: Implement `loadExamAttempts(examKey, 50)`**

Query:

```js
where('historyDomain', '==', 'question')
where('examKey', '==', String(examKey))
orderBy('submittedAt', 'desc')
limit(50)
```

Return `[]` for blank `examKey`.

Expose both functions through `window.ChrisExamHistoryStore`.

If Firestore reports a missing composite index during manual validation, add the exact generated index requirement to `LEARNING_HISTORY_FIREBASE.md`; do not create unrelated indexes.

- [ ] **Step 4: Run syntax and contract tests**

Run:

```bash
node --check firebase-firestore-sync.js
node tests/question-history-contract.test.mjs
```

Expected: PASS.

Manual authenticated browser check: in DevTools run:

```js
await window.ChrisExamHistoryStore.loadRecentQuestionAttempts(50)
await window.ChrisExamHistoryStore.loadExamAttempts(window.examContextCurrent.key, 50)
```

Verify both return arrays and never exceed 50 rows.

- [ ] **Step 5: Commit**

```bash
git add firebase-firestore-sync.js tests/question-history-contract.test.mjs
git commit -m "Add Firebase question history readers"
```

---

### Task 5: Show Lightweight Active and Post-Submit Question History

**Files:**
- Create: `exam-question-history.js`
- Modify: `index.html`
- Modify: `exam-runtime-flex.js`
- Modify: `tests/question-history-contract.test.mjs`

**Interfaces:**
- Consumes:
  - `window.ExamQuestionHistoryCore.aggregateQuestionHistory(attempts)`
  - `window.ChrisExamHistoryStore.loadRecentQuestionAttempts(50)`
  - `exam:started`
  - `exam:submitted`
- Produces:
  - active-attempt annotation: only `錯題 N 次` when `N > 0`
  - post-submit annotation: `作答 N 次`, optional `錯題 M 次`, `上次：選 X｜正確/錯誤`
  - browser API `window.ExamQuestionHistoryUI.resetForRetry()`.

- [ ] **Step 1: Write failing UI contract assertions**

Append:

```js
const historyUi = read('exam-question-history.js');

assert.match(historyUi, /錯題/);
assert.match(historyUi, /作答/);
assert.match(historyUi, /exam:started/);
assert.match(historyUi, /exam:submitted/);
assert.match(historyUi, /resetForRetry/);
```

Run:

```bash
node tests/question-history-contract.test.mjs
```

Expected: FAIL because the file does not exist.

- [ ] **Step 2: Implement history loading on `exam:started`**

Create `exam-question-history.js` with module state:

```js
let aggregate = {};
let submitted = false;
let loadToken = 0;
```

On `exam:started`:

1. increment `loadToken`
2. clear prior annotations
3. set `submitted = false`
4. call `loadRecentQuestionAttempts(50)`
5. discard stale async results if the exam changed before load completed
6. aggregate with `ExamQuestionHistoryCore`
7. render active badges

Find each card by `data-q`, obtain the current source question from `questions[sourceIndex]`, then use `source.questionId`.

If `wrongCount > 0`, render a small non-interactive badge `錯題 N 次`; otherwise render no badge.

- [ ] **Step 3: Implement post-submit rendering**

On `exam:submitted`, reload the recent 50 attempts after the new attempt reaches local/Firebase history, or merge the just-submitted valid answers into the in-memory aggregate immediately and then refresh asynchronously.

Render:

```text
作答 3 次｜錯題 2 次
上次：選 C｜正確
```

or, when `wrongCount === 0`:

```text
作答 3 次
上次：選 C｜正確
```

Never render `錯題 0 次`.

- [ ] **Step 4: Wire retry reset**

At the start of the existing `#restartBtn` handler in `exam-runtime-flex.js`, call:

```js
window.ExamQuestionHistoryUI?.resetForRetry?.();
```

The function must remove post-submit history elements and restore active-attempt badge semantics after the exam rerenders.

- [ ] **Step 5: Load the new module**

In `index.html`, load in this dependency order:

```html
<script src="exam-question-history-core.js?v=__BUILD_SHA__"></script>
...
<script src="exam-records.js?v=__BUILD_SHA__"></script>
<script src="exam-question-history.js?v=__BUILD_SHA__"></script>
```

Ensure `exam-question-history.js` executes after the Firestore history store is available in the deployed app. If the Firebase sync module is dynamically injected by an existing loader rather than `index.html`, keep the history UI tolerant of the API becoming available later and retry only on relevant auth/history events.

- [ ] **Step 6: Run tests and manual UI regression**

Run:

```bash
node --check exam-question-history.js
node --check exam-runtime-flex.js
node tests/question-history-contract.test.mjs
node tests/question-history-core.test.mjs
```

Manual cases:

1. never-wrong question while active → no badge
2. previously wrong question while active → `錯題 N 次`
3. submit a correct answer → full statistics appear
4. question with zero lifetime wrongs → no `錯題 0 次`
5. leave a question blank → its counters do not change

- [ ] **Step 7: Commit**

```bash
git add exam-question-history.js exam-runtime-flex.js index.html tests/question-history-contract.test.mjs
git commit -m "Show per-question answer history"
```

---

### Task 6: Add Same-Exam Recall Navigation and Red Wrong-Question Highlighting

**Files:**
- Modify: `exam-question-history.js`
- Modify: `exam-runtime-flex.js`
- Modify: `tests/question-history-contract.test.mjs`

**Interfaces:**
- Consumes: `window.ChrisExamHistoryStore.loadExamAttempts(examKey, 50)`.
- Produces:
  - post-submit `回溯` button
  - historical review state for the current `examKey`
  - `前一次` / `後一次` controls
  - position/timestamp label
  - red `.history-wrong` card state
  - complete cleanup from `resetForRetry()`.

- [ ] **Step 1: Write failing recall-mode contract**

Append:

```js
assert.match(historyUi, /回溯/);
assert.match(historyUi, /前一次/);
assert.match(historyUi, /後一次/);
assert.match(historyUi, /history-wrong/);
assert.match(historyUi, /loadExamAttempts/);
```

Run:

```bash
node tests/question-history-contract.test.mjs
```

Expected: FAIL.

- [ ] **Step 2: Add the recall button in submitted state**

Do not enable it during active answering.

After `exam:submitted`, add/show a `回溯` control adjacent to existing result actions.

On click:

```js
const examKey = window.examContextCurrent?.key || '';
const attempts = await window.ChrisExamHistoryStore.loadExamAttempts(examKey, 50);
```

Exclude the current visible submission from "前一次" navigation if it is already represented by the normal submitted screen. The first historical position should therefore represent the immediately preceding saved attempt when one exists.

If there is no prior attempt, show a non-blocking `沒有更早的作答紀錄` message and do not enter historical mode.

- [ ] **Step 3: Implement historical attempt rendering**

Maintain:

```js
let recallAttempts = [];
let recallIndex = -1;
```

For the selected historical attempt:

1. clear all prior `.history-wrong` states
2. index its valid `answers[]` by `questionId`
3. for each current card with the same `questionId`:
   - `result === 'incorrect'` → add `.history-wrong`
   - `result === 'correct'` → no red state
   - no valid historical answer → neutral
4. show historical selected answer/result when available
5. show position and timestamp, e.g. `第 2 / 7 次｜2026/09/18 20:31`

Use CSS that makes the whole wrong card clearly red-tinted without making text unreadable:

```css
.card.history-wrong {
  border: 2px solid #dc2626;
  background: #fef2f2;
  box-shadow: 0 0 0 2px rgba(220,38,38,.08);
}
```

- [ ] **Step 4: Implement previous/next controls**

Use chronological navigation labels from the learner's perspective:

- `前一次` → move to an older attempt
- `後一次` → move toward a newer historical attempt

Disable a button when there is no attempt in that direction.

Do not cross into a different `examKey`.

- [ ] **Step 5: Make `重新做題` a full recall reset boundary**

Expand `resetForRetry()` to remove:

```js
document.querySelectorAll('.history-wrong').forEach(card => card.classList.remove('history-wrong'));
document.querySelectorAll('[data-history-answer]').forEach(el => el.remove());
document.querySelector('#questionHistoryRecallControls')?.remove();
```

Also reset:

```js
recallAttempts = [];
recallIndex = -1;
submitted = false;
```

After the exam rerenders, only normal active `錯題 N 次` badges may reappear.

- [ ] **Step 6: Run tests and manual recall regression**

Run:

```bash
node --check exam-question-history.js
node --check exam-runtime-flex.js
node tests/question-history-contract.test.mjs
```

Manual sequence:

1. complete the same exam three times with different wrong questions
2. on the third submission press `回溯`
3. press `前一次` and verify only that attempt's wrong cards are red
4. press `前一次` again and verify the red set changes to the older attempt
5. press `後一次` and verify navigation returns toward the newer history
6. verify a historically blank question is neutral
7. press `重新做題`
8. verify all red states, history answers, navigation, position, and timestamp disappear

- [ ] **Step 7: Commit**

```bash
git add exam-question-history.js exam-runtime-flex.js tests/question-history-contract.test.mjs
git commit -m "Add same-exam recall navigation"
```

---

### Task 7: Align GEPT Vocabulary With the New History Semantics

**Files:**
- Modify: `exam-english-vocabulary-simple.js`
- Modify: `tests/question-history-contract.test.mjs`

**Interfaces:**
- Consumes: existing `vocabId`, `vocabularyProgress`, generated session answers.
- Produces:
  - persistent progress increments only for actually selected answers
  - active vocabulary UI: only `錯題 N 次` when `wrongCount > 0`
  - post-submit vocabulary UI: `作答 N 次`, optional wrong count, latest answer/result
  - no fixed-question `questionId` or `attempts` aggregation dependency.

- [ ] **Step 1: Write failing vocabulary contract assertions**

Append:

```js
const vocab = read('exam-english-vocabulary-simple.js');

assert.doesNotMatch(
  vocab,
  /q:\s*`[^\n]*已複習\s*\$\{stats\.reviewCount\}/,
  'active vocabulary question text must not expose review count'
);

assert.match(
  vocab,
  /selected\s*===\s*null/,
  'vocabulary persistence must explicitly handle blank selection'
);
```

Add a stricter source assertion after implementation that the blank branch returns/skips before increments.

- [ ] **Step 2: Stop counting blank vocabulary items as persistent review history**

In `persistSessionProgress(activeSession)`, when a generated question has no selected answer, skip updates to:

```text
reviewCount
wrongCount
correctCount
lastReviewedAt
```

Do not delete legacy `unansweredCount`; simply stop incrementing it for new sessions.

Keep any session-local exposure mechanics needed by the Markov generator separate from persistent answered-history semantics.

- [ ] **Step 3: Remove active `已複習 N 次` from the question text**

Change `apiQuestion()` from a question string containing the review count to the original question text only.

Expose the existing `wrongCountBefore` to the generic history UI or render a vocabulary-specific `錯題 N 次` badge without showing `0`.

- [ ] **Step 4: Use answered count = correct + wrong**

For vocabulary display, derive:

```js
const answeredCount = Number(stats.correctCount || 0) + Number(stats.wrongCount || 0);
```

Do not use legacy `reviewCount` as authoritative answered count because older sessions may include unanswered increments.

- [ ] **Step 5: Run tests and manual vocabulary regression**

Run:

```bash
node --check exam-english-vocabulary-simple.js
node tests/question-history-contract.test.mjs
```

Manual cases:

1. word with zero prior wrongs → no active history badge
2. word with prior wrongs → `錯題 N 次`
3. leave a vocabulary item blank and submit → its `correctCount/wrongCount` remain unchanged
4. answer a word → its counts update exactly once
5. verify vocabulary activity does not change general fixed-question recall query results

- [ ] **Step 6: Commit**

```bash
git add exam-english-vocabulary-simple.js tests/question-history-contract.test.mjs
git commit -m "Align vocabulary answer history semantics"
```

---

### Task 8: Documentation, Compatibility, and Final Regression

**Files:**
- Modify: `LEARNING_HISTORY_FIREBASE.md`
- Modify: `PROJECT_BLUEPRINT.md`
- Modify: `docs/superpowers/specs/2026-09-21-question-history-recall-design.md` only if implementation revealed an approved design correction
- Modify: `tests/question-history-contract.test.mjs`

**Interfaces:**
- Consumes: completed Tasks 1-7.
- Produces: documented schema-v3 authority, query limits, legacy behavior, vocabulary separation, and reproducible final regression checklist.

- [ ] **Step 1: Add final contract checks**

Ensure `tests/question-history-contract.test.mjs` asserts all shipped files exist and contain the required public interfaces:

```js
assert.match(read('exam-question-history-core.js'), /ExamQuestionHistoryCore/);
assert.match(read('exam-question-history.js'), /ExamQuestionHistoryUI/);
assert.match(read('firebase-firestore-sync.js'), /ChrisExamHistoryStore/);
assert.match(read('exam-records.js'), /schemaVersion:\s*3/);
assert.match(read('exam-records.js'), /historyDomain/);
assert.match(read('exam-option-randomizer.js'), /optionCanonicalIndices/);
```

- [ ] **Step 2: Update Firebase learning-history documentation**

In `LEARNING_HISTORY_FIREBASE.md`, document:

```text
schemaVersion: 3
historyDomain: question | vocabulary | none
questionId
questionRevision
selectedCanonicalIndex
correctCanonicalIndex
selectedDisplayLabel
result
```

State explicitly:

- blank/manual-study/unclear do not enter per-question history
- static per-question aggregate window = 50 fixed-question attempts
- same-exam recall window = 50 matching `examKey` attempts
- vocabulary remains `vocabId / vocabularyProgress`
- `correctCount + wrongCount` is the reliable vocabulary answered count for mixed legacy/new data
- any Firestore composite indexes actually required by Task 4

- [ ] **Step 3: Update project blueprint**

Mark the recall foundation complete only after browser validation:

```text
[x] exam:submitted as completed-attempt boundary
[x] schema-v3 permanent question identity
[x] canonical option identity
[x] per-question history badges
[x] same-exam recall up to 50 attempts
[x] retry resets recall state
[x] GEPT Vocabulary remains isolated
```

Do not mark weakness/adaptive learning complete.

- [ ] **Step 4: Run the full dependency-free test suite**

Run:

```bash
node --check exam-runtime-flex.js
node --check exam-records.js
node --check exam-option-randomizer.js
node --check exam-question-history-core.js
node --check exam-question-history.js
node --check firebase-firestore-sync.js
node --check exam-english-vocabulary-simple.js
node tests/question-history-core.test.mjs
node tests/question-history-contract.test.mjs
```

Expected: all PASS.

- [ ] **Step 5: Perform final browser matrix**

Validate at least:

```text
Science MCQ
Math MCQ
Math handwriting
Chinese with manual-study item
Past exam
Shuffled practice
GEPT Reading fixed question
GEPT Vocabulary
```

For each relevant fixed-question exam verify:

- active wrong badge semantics
- one completed attempt per submit
- post-submit full history
- same-exam recall previous/next
- red historical wrong cards
- blank questions neutral
- retry full reset
- Firebase unavailable does not block exam use

- [ ] **Step 6: Commit documentation and final tests**

```bash
git add LEARNING_HISTORY_FIREBASE.md PROJECT_BLUEPRINT.md tests/question-history-contract.test.mjs
git commit -m "Document question history recall"
```
