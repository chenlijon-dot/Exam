# Question History Recall Design

> Date: 2026-09-21
>
> Scope: permanent-question answer history, Firebase attempt semantics, per-question recall UI, option identity, handwriting handling, and GEPT Vocabulary separation.
>
> Status: design for user review before implementation.
>
> Authority: this document is the later, more specific authority for recall/history behavior where it differs from the earlier question-bank governance design.

---

## 1. Purpose

The Exam project now has permanent `questionId` and `revision` for formal static questions.

The next step is to use those identities to answer, reliably and cheaply:

- How many times has this learner actually answered this question?
- How many of those answers were wrong?
- What did the learner choose on the latest valid attempt?
- Was that latest valid answer correct or incorrect?
- Can the same question keep its history when reused in another exam, review set, or future adaptive practice?

The first release is intentionally narrow:

> **Use existing Firebase attempts as the single authority, aggregate by permanent question identity, and show useful history without building a second statistics database.**

---

## 2. Core architecture decision

### 2.1 Single authority: `attempts`

General fixed-question history continues to use:

```text
users/{uid}/attempts/{attemptId}
```

The first release does **not** create:

```text
users/{uid}/questionProgress/{questionId}
```

and does not dual-write per-question counters.

Per-question statistics are derived on demand from recent valid attempts.

This avoids:

- duplicate authority
- transaction complexity
- counter drift
- retry inconsistencies
- backfill requirements

If usage later grows enough to justify a materialized `questionProgress` cache, that cache must remain derived from attempts rather than becoming a second source of truth.

---

## 3. History domains

The system has two different longitudinal identity models.

### 3.1 Formal static questions

Use:

```text
questionId
```

Examples:

- Chinese chapter questions
- mathematics chapter questions
- BCT / past-exam questions
- textbook English fixed questions
- GEPT Reading
- science
- social studies
- formal mathematics handwriting questions

These use the general `attempts` history path.

### 3.2 GEPT Vocabulary

GEPT Vocabulary is dynamic and keeps its existing stable identity:

```text
vocabId
```

Its authority remains:

```text
users/{uid}/vocabularyProgress/{source:vocabId}
users/{uid}/vocabularyState/...
```

Vocabulary does not manufacture a permanent `questionId` for each generated occurrence.

Vocabulary attempts must not consume the 50-attempt window used for fixed-question recall.

---

## 4. Valid-history rule

Only a response that was **actually answered and reliably graded** becomes part of per-question history.

### 4.1 Multiple choice

A question enters history only when:

```text
selected answer exists
+
result is deterministically correct or incorrect
```

### 4.2 Unanswered question

If the learner leaves a question blank:

```text
do not add a question-history record
do not increase answeredCount
do not increase wrongCount
do not treat it as a learner error
```

This supports the real usage pattern where a learner may open a 20-question exam but intentionally answer only a few questions.

### 4.3 Manual-study / ungraded written questions

If the current runtime has no explicit grading mechanism:

```text
do not add to question history
```

In particular, current Chinese written/manual-study items are not worth building a handwriting pipeline for merely to make history complete.

### 4.4 Mathematics handwriting

A mathematics handwriting response enters history only when the grading result is:

```text
correct
or
incorrect
```

If grading returns:

```text
unclear
```

the response is excluded from history.

An AI vision failure is not evidence of learner error.

---

## 5. History counters

For static questions the first release needs only:

```text
answeredCount
correctCount
wrongCount
lastAttemptAt
lastSelectedAnswer
lastResult
```

Invariant:

```text
answeredCount = correctCount + wrongCount
```

The first release intentionally does not maintain:

```text
shownCount
unansweredCount
unclearCount
```

for per-question recall.

Questions that were shown but not validly answered are ignored by this history model.

---

## 6. Attempt schema v3

A new completed attempt should remain an exam-level record while carrying stable per-question identity.

Target shape:

```text
attempt
├─ schemaVersion: 3
├─ historyDomain: "question" | "vocabulary" | "none"
├─ examKey
├─ submittedAt
├─ exam-level score / accuracy summary
└─ answers[]
   ├─ questionId
   ├─ questionRevision
   ├─ questionType
   ├─ selectedCanonicalIndex
   ├─ correctCanonicalIndex
   ├─ selectedDisplayIndex
   ├─ selectedDisplayLabel
   ├─ selectedText
   ├─ result: "correct" | "incorrect"
   └─ minimal display/debug provenance
```

For `historyDomain: "question"`, `answers[]` contains only valid graded responses that qualify under Section 4.

Exam-level summary fields may still preserve totals needed by the current score screen, including the number of questions presented or left blank. Those summary fields do not turn blank questions into per-question history.

### 6.1 Why keep display and canonical answer identity

Long-term correctness uses:

```text
selectedCanonicalIndex
correctCanonicalIndex
```

because options may shuffle.

Historical UI may display:

```text
上次：選 C
```

Therefore the attempt also preserves what the learner saw at that time:

```text
selectedDisplayIndex
selectedDisplayLabel
```

The historical display letter is presentation evidence. The canonical index is semantic identity.

---

## 7. Submission lifecycle

Formal history must be written only after the exam is truly complete.

The lifecycle becomes:

```text
learner presses submit
↓
MCQ grading completes
↓
all applicable handwriting grading completes
↓
exam:submitted
↓
build schema-v3 attempt
↓
local record
↓
Firestore sync
```

`exam:submitted` is the authoritative completed-attempt boundary.

The old pattern of capturing immediately after a submit-button click must not remain the formal write trigger because asynchronous handwriting grading may still be in progress.

### 7.1 Duplicate protection

One completed submission must produce at most one formal attempt.

Repeated clicks, UI rerenders, or duplicate event handling must not create duplicate history documents.

---

## 8. Recall query windows

Release 1 has two related but distinct history reads.

### 8.1 Per-question aggregate window

For the lightweight per-question counters shown on an active or submitted exam, read at most:

```text
50 fixed-question attempts
```

whose history domain is general permanent-question history.

These attempts may come from different exam keys because the same permanent `questionId` can be reused across original exams, review sets, and future adaptive practice.

GEPT Vocabulary must not consume these 50 slots.

### 8.2 Same-exam recall window

When the learner presses `回溯` on a submitted exam, load at most:

```text
50 attempts with the same examKey
```

ordered newest to oldest.

This is the history browser for that specific exam only.

It answers:

```text
前一次這份考卷錯哪些？
再前一次又錯哪些？
```

It must not mix attempts from another exam key.

Recommended new-attempt discriminator:

```text
historyDomain: "question"
```

If Firestore requires indexes for these queries, the implementation should add only the minimal required indexes.

---

## 9. Cross-exam aggregation

Per-question history is global by permanent identity.

If the same `questionId` appears in:

```text
original exam
wrong-answer review
adaptive review
future mixed practice
```

all valid answers contribute to the same counters.

Example:

```text
original exam      incorrect
review             incorrect
adaptive practice  correct
```

The question displays:

```text
作答 3 次｜錯題 2 次
```

The exam-level identity still uses `examKey` for exam-specific history, but per-question learning history is keyed by `questionId`.

---

## 10. UI behavior during an active attempt

During answering, history must not reveal prior selected answers or correctness.

### 10.1 Never wrong before

If:

```text
wrongCount = 0
```

show nothing.

Do not display:

```text
錯題 0 次
作答 N 次
上次選什麼
上次結果
```

### 10.2 Has prior wrong answers

If:

```text
wrongCount > 0
```

show only:

```text
錯題 2 次
```

This is a warning signal, not an answer hint.

### 10.3 Recall button while answering

The full `回溯` action remains disabled until submission.

---

## 11. UI behavior after submission

Once `exam:submitted` completes, the current valid answer is incorporated immediately into the aggregate.

Full history is then shown automatically for questions that have history.

### 11.1 Has wrong-answer history

Example:

```text
作答 3 次｜錯題 2 次
上次：選 C｜正確
```

### 11.2 Never wrong

Do not display `錯題 0 次`.

Show:

```text
作答 3 次
上次：選 C｜正確
```

### 11.3 Current question left blank

The current submission does not change this question's counters.

If older valid history exists, that older valid history may still be displayed after submission.

If no valid history exists, display no history block.

### 11.4 Recall button after submission

The `回溯` button becomes enabled after submission.

Pressing it enters a **same-exam historical review mode** for the current `examKey`.

The review mode loads up to the previous 50 attempts for that same exam and exposes navigation controls such as:

```text
前一次
後一次
```

The learner can move backward and forward through the historical attempts without leaving the current exam page.

For each selected historical attempt:

- questions answered incorrectly in that attempt are highlighted with a clearly visible red question-card state
- correctly answered questions remain in the normal submitted style
- questions that were not validly answered in that historical attempt remain neutral and are not treated as wrong
- the historical selected answer and result may be shown for the questions that were validly answered
- the UI should identify which historical attempt is currently being viewed, for example `第 2 / 7 次` plus its submission time

The most recent submitted state and the per-question aggregate annotations remain distinct concepts:

```text
作答 3 次｜錯題 2 次
上次：選 C｜正確
```

is the cumulative `questionId` view, while the red-card historical review answers:

```text
這一次當時錯了哪些題？
```

### 11.5 Reset on `重新做題`

Pressing `重新做題` exits historical review mode completely.

It must clear:

- red historical wrong-question highlights
- historical selected-answer overlays
- `前一次 / 後一次` navigation controls
- current historical-attempt position / timestamp
- any historical-only explanation state

The exam then returns to a clean active-attempt state.

The normal active-attempt rule still applies:

- if a question has prior `wrongCount > 0`, show only `錯題 N 次`
- if `wrongCount = 0`, show no history badge
- do not reveal prior answer choices or correctness before the new submission

---

## 12. Vocabulary history behavior

GEPT Vocabulary remains separate from fixed-question attempts.

### 12.1 Identity and counters

Use:

```text
vocabId
vocabularyProgress
```

For user-facing answered count, use:

```text
correctCount + wrongCount
```

rather than trusting legacy `reviewCount`, because older data may have incremented review count for unanswered items.

### 12.2 Blank vocabulary item

If the learner does not select an answer:

```text
do not increment correctCount
do not increment wrongCount
do not increment answered/review semantics
do not treat as a learning-history event
```

The implementation must also avoid marking an unanswered generated vocabulary item as learned merely because it appeared on screen.

Session-local mechanics that prevent duplicate presentation may remain internal, but persistent learner progress must represent actual answered items.

### 12.3 Vocabulary active-attempt UI

If the word has never been wrong:

```text
show no history badge
```

If it has prior errors:

```text
錯題 3 次
```

Do not append `已複習 N 次` directly into the question text during answering.

### 12.4 Vocabulary post-submit UI

Use the same clean presentation style:

```text
作答 8 次｜錯題 3 次
上次：選 B｜正確
```

If `wrongCount = 0`:

```text
作答 8 次
上次：選 B｜正確
```

---

## 13. Legacy data

Existing schema-v2 attempts remain readable by the current learning-history dashboard.

They are not deleted or bulk-migrated merely to support recall.

Authoritative per-question counters begin with records that have stable permanent identity.

A legacy record may be used for best-effort display only when it can be mapped without ambiguity, but it must not silently create authoritative `questionId` history from position alone.

The implementation should prefer correctness over inflating counts with uncertain legacy matches.

---

## 14. Failure behavior

Recall/history is helpful metadata, not a prerequisite for taking an exam.

If Firebase history loading fails:

```text
exam still works
no history badge is shown
submission and grading still work
a non-blocking status may report history unavailable
```

If history save fails:

- retain the local completed attempt if the existing local flow supports it
- do not create duplicate retries
- do not alter the learner's visible grading result
- allow the existing sync path to retry according to its normal behavior

History failure must never block the primary exam experience.

---

## 15. Files and components expected to change

The implementation is expected to touch, at minimum:

```text
exam-runtime-flex.js
exam-records.js
exam-option-randomizer.js
firebase-firestore-sync.js
firebase-learning-dashboard.js
exam-english-vocabulary-simple.js
LEARNING_HISTORY_FIREBASE.md
PROJECT_BLUEPRINT.md
```

Other subject-specific files should change only when required by an actual runtime incompatibility.

The implementation must not perform unrelated refactors.

---

## 16. Testing requirements

### 16.1 General MCQ

Three valid answers to one `questionId`:

```text
wrong
wrong
correct
```

must produce:

```text
answeredCount = 3
wrongCount = 2
correctCount = 1
```

### 16.2 Blank answers

Opening 20 questions and answering only 5 must update history for only those 5 valid responses.

The other 15 must not change any per-question counters.

### 16.3 Option shuffle

The same canonical option shown under different letters across attempts must still aggregate to the same semantic answer identity.

Historical UI may show the letter seen in that historical attempt.

### 16.4 Handwriting

```text
correct   → count
incorrect → count
unclear   → ignore
blank     → ignore
```

### 16.5 Manual study

Ungraded manual-study items do not enter correct/wrong history.

### 16.6 Cross-exam reuse

The same `questionId` answered in different `examKey` values must aggregate together.

### 16.7 Vocabulary

Vocabulary history uses `vocabId`, not generated exam keys or manufactured question IDs.

Blank vocabulary items must not increase answered or wrong counts.

### 16.8 Query windows

Per-question aggregation reads no more than the newest 50 fixed-question history attempts.

Same-exam `回溯` reads no more than 50 attempts whose `examKey` matches the current exam.

Vocabulary documents or vocabulary exam attempts must not consume either fixed-question window.

### 16.9 Same-exam historical navigation

Given multiple attempts of one `examKey`:

```text
attempt 1 → wrong Q2, Q7
attempt 2 → wrong Q1, Q2, Q9
attempt 3 → wrong Q4
```

the recall mode must let the learner move backward and forward through those attempts and highlight exactly the wrong questions belonging to the selected attempt.

A question left blank in that attempt must remain neutral, not red.

### 16.10 Retry reset

After entering recall mode, pressing `重新做題` must remove all historical red highlights and history-navigation state and return to the clean active-attempt UI.

### 16.11 Duplicate submit

One completed exam produces one attempt even if submit is clicked repeatedly or the UI rerenders.

### 16.12 Firebase unavailable

Exam rendering, answering, grading, and submission remain functional with no history badges.

---

## 17. Non-goals for release 1

This release does not build:

- a permanent `questionProgress` collection
- lifetime materialized per-question counters
- concept mastery
- weakness scoring
- adaptive question selection
- spaced repetition for general static questions
- a cross-exam or all-subject historical answer browser outside the current exam
- Firebase bulk migration of schema-v2 attempts
- handwriting support for currently ungraded Chinese written questions

Those belong to later phases after recall is stable.

---

## 18. Success criteria

Release 1 is complete when:

1. Formal fixed-question attempts are written only after `exam:submitted`.
2. Valid answered questions carry permanent `questionId` and `questionRevision`.
3. Option shuffling preserves canonical option identity.
4. Blank, manual-study, and unclear handwriting responses do not pollute question history.
5. Per-question history aggregates globally by `questionId`.
6. Per-question aggregation uses at most 50 relevant fixed-question attempts.
7. Same-exam `回溯` can browse up to 50 attempts for the current `examKey`.
8. Historical review provides forward/backward navigation and clearly highlights the wrong questions of the selected attempt in red.
9. Blank or otherwise invalid answers in a historical attempt are not highlighted as wrong.
10. Pressing `重新做題` clears historical-review state and restores the clean active-attempt UI.
11. GEPT Vocabulary remains isolated on `vocabId` / `vocabularyProgress`.
12. Active-attempt UI shows only `錯題 N 次` when N > 0.
13. Post-submit UI shows `作答 N 次`, optional `錯題 M 次`, and latest valid answer/result.
14. `錯題 0 次` is never rendered.
15. Firebase history failure never prevents exam use.
16. No second history authority is introduced.

---

## 19. Follow-up after release 1

Once this history layer is stable, the next project can derive:

```text
question history
↓
chapter / lesson weakness
↓
concept weakness
↓
review priority
↓
adaptive practice
```

That later project may decide whether a materialized `questionProgress` cache is warranted by real usage.

Until then, `attempts` remains the single general fixed-question history authority.
