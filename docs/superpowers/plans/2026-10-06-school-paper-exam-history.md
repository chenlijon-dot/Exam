# School Paper Exam History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import a real school paper exam into the existing question-history system so the paper exam contributes to permanent per-question answer/wrong counts, is stored in Google Sheets and Firebase attempts, and is reviewable from Unit 1 without creating duplicate attempts.

**Architecture:** Keep the existing `questionId`-based history authority unchanged. Add a unit-level school-paper bank and a normalized paper-attempt artifact, use Google Sheets only as the human-readable import ledger and QA surface, then add a Unit 1 record browser/review flow that reads the normalized artifacts and reuses the existing history aggregation. Paper review is read-only; only an explicit retry starts the existing exam runtime and creates a new web attempt.

**Tech Stack:** JavaScript (browser runtime), JSON chapter-bank data, Node.js contract tests, Firebase Firestore, Google Sheets, existing Exam runtime and question-history modules.

**Spec:** `docs/superpowers/specs/2026-10-06-school-paper-exam-history-design.md`

## Global Constraints

- Paper records must use `historyDomain: "question"`; do not create a second wrong-answer authority.
- Permanent `questionId` + `revision` is the only per-question identity used by history aggregation.
- Google Sheets is an import/QA ledger, not a runtime authority.
- Paper review must not create a new attempt.
- Explicit retry may create a new web attempt linked by `schoolExamId`.
- The first paper has exactly 30 graded items, 22 correct, 8 incorrect, 0 unanswered, score 73/100.
- Confirmed wrong items are: 一-7, 一-11, 一-12, 一-16, 一-20, 二-5, 三-2, 三-4.
- QA must block formal import when score or identity checks fail.
- Unknown school/class/exam-date metadata stays blank; do not infer it.
- Do not create `questionProgress` or any other second counter collection.
- Do not move the paper runtime to Google Sheets reads.

## Review Focus

- A paper row missing `questionId` must fail QA and must not appear in the generated formal attempt.
- Duplicate `questionId` values inside one paper must fail QA rather than silently merge two items.
- A reviewed paper must not be mistaken for a new submission and must not append to `examRecords.v1` or Firebase.
- A web retry linked to the paper must still aggregate with the same permanent `questionId` values.
- Existing non-paper practice/school-bank/history flows must remain unchanged when no school-paper record is involved.

---

### Task 1: Create the Google Sheets paper-exam ledger

**Files / artifacts:**
- Create Google Sheet in the user-specified Drive area for school exam records.
- Tabs: `Exams`, `Questions`, `QA`
- No product-code changes in this task.

**Interfaces:**
- Consumes: spec field definitions and first paper metadata.
- Produces: one native Google Sheet whose rows are the canonical import ledger for Tasks 2-4.

- [ ] **Step 1: Create the native Google Sheet with the three tabs and exact headers from the spec**

`Exams` columns:
`examId, subject, semester, unitGroup, examTitle, schoolName, className, examDate, recordedAt, fullScore, earnedScore, accuracyPercent, questionCount, correctCount, wrongCount, unansweredCount, sourceFile1, sourceFile2, cropFolder, attemptId, historyDomain, recordOrigin, firebaseStatus, githubBankPath, note`

`Questions` columns:
`examId, itemIndex, groupCode, originalNumber, originalLabel, questionId, revision, mappedSection, mappedSectionLabel, conceptIds, questionType, question, optionA, optionB, optionC, optionD, correctCanonicalIndex, correctAnswer, studentCanonicalIndex, studentAnswer, result, points, earnedPoints, sourcePage, sourceFile, cropImage, imageRole, answerVerified, gradingVerified, historyEligible, importStatus, note`

`QA` rows:
`totalItems, questionIdCount, historyEligibleCount, correctCount, incorrectCount, unansweredCount, fullScore, computedScore, sourceScore, scoreMatch, basicPoints, advancedPoints, literacyPoints, totalPoints, duplicateQuestionIdCount, missingQuestionIdCount, missingResultCount, missingCorrectAnswerCount, invalidMappedSectionCount, overallStatus`

- [ ] **Step 2: Populate the single `Exams` row for `science-7-1-u01-school-paper-20261006-01`**

Required values:
- `subject=science`
- `semester=7-1`
- `unitGroup=unit-01`
- `examTitle=七年級第一學期第一單元`
- `fullScore=100`
- `earnedScore=73`
- `questionCount=30`
- `correctCount=22`
- `wrongCount=8`
- `unansweredCount=0`
- `historyDomain=question`
- `recordOrigin=school-paper`
- `sourceFile1=七年級第一學期第一單元_1.jpg`
- `sourceFile2=七年級第一學期第一單元_2.jpg`

Leave `schoolName`, `className`, `examDate` blank.

- [ ] **Step 3: Seed 30 `Questions` rows with stable original labels and points**

Rows:
- 一-1 through 一-20, each `points=3`
- 二-1 through 二-5, each `points=4`
- 三-1 through 三-5, each `points=4`

Set result skeleton from the confirmed paper:
- `incorrect`: 一-7, 一-11, 一-12, 一-16, 一-20, 二-5, 三-2, 三-4
- all other items: `correct`

Set `earnedPoints=0` for incorrect rows and full points for correct rows.

- [ ] **Step 4: Add QA formulas or equivalent sheet logic**

Assertions:
- 30 items
- 22 correct
- 8 incorrect
- 0 unanswered
- full score 100
- computed score 73
- source score 73
- duplicate questionId count 0 after IDs are assigned
- missing questionId count 0 before formal import
- missing result count 0
- missing correct answer count 0 before formal import
- mappedSection must be one of `section-01|section-02|section-03`
- `overallStatus=PASS` only when all hard gates pass

- [ ] **Step 5: Verify the sheet visually and numerically**

Expected:
- Native Google Sheet
- 3 tabs
- 1 exam row
- 30 question rows
- QA score math returns 73/100
- overallStatus remains non-PASS until IDs/answers/mapping are complete

---

### Task 2: Build the normalized paper-exam bank and schema contract

**Files:**
- Create: `chapter-bank/science/7-1/unit-01/school-exam-records/2026-unit-01-school-exam-01.json`
- Create: `chapter-bank/science/7-1/unit-01/school-exam-records/assets/`
- Create: `tests/school-paper-bank.test.mjs`

**Interfaces:**
- Consumes: 30 `Questions` rows from Task 1 plus original/cropped Drive images.
- Produces: a 30-question bank with permanent `questionId`, `revision`, `mappedSection`, source provenance, answer data, and only necessary visual assets.

- [ ] **Step 1: Write the failing bank contract test**

Test assertions:
- file exists
- `exam.questionCount === 30`
- `questions.length === 30`
- every question has non-empty `questionId`
- every question has numeric `revision >= 1`
- every question has `mappedSection` in `section-01|section-02|section-03`
- every question preserves `originalLabel`
- no duplicate `questionId`
- exactly 8 source rows are tagged as original paper incorrect in metadata
- any `image` path resolves under the new `assets/` folder

- [ ] **Step 2: Run the test and verify it fails**

Run:
`node tests/school-paper-bank.test.mjs`

Expected: FAIL because the bank does not yet exist.

- [ ] **Step 3: Transcribe all 30 questions from the two paper images and cropped references**

For each item:
- preserve original question wording
- preserve original option order
- record formal correct answer
- record student's original selected answer
- record original paper result
- assign `mappedSection`
- add `conceptIds` where useful
- preserve `sourcePage`, `sourceFile`, `cropImage`
- set `answerVerified=true`
- set `gradingVerified=true`

Unknown text must be rechecked against the original image rather than guessed.

- [ ] **Step 4: Assign permanent question identities**

Use the repository's existing permanent numeric questionId convention.

Requirements:
- all 30 IDs unique repo-wide
- `revision=1`
- IDs copied back to the corresponding Sheet `Questions.questionId` cells

- [ ] **Step 5: Normalize only required visual assets**

Copy/convert only visual material needed to answer the question:
- diagrams
- microscope views
- tables/charts
- experimental setups

Do not publish full photographed paper pages as normal runtime question images.

- [ ] **Step 6: Run the bank test and existing relevant science-bank tests**

Run:
- `node tests/school-paper-bank.test.mjs`
- any existing science chapter-bank contract tests that cover question schema

Expected: PASS.

- [ ] **Step 7: Commit**

Commit message:
`Add Unit 1 school paper exam bank`

---

### Task 3: Generate and validate the formal school-paper attempt

**Files:**
- Create: `chapter-bank/science/7-1/unit-01/school-exam-records/2026-unit-01-school-exam-01-attempt.json`
- Create: `tests/school-paper-attempt.test.mjs`

**Interfaces:**
- Consumes: Task 2 bank and the Task 1 ledger's student/correct answer snapshot.
- Produces: one schema-v3 `historyDomain:"question"` attempt suitable for import into the existing history pipeline.

- [ ] **Step 1: Write the failing attempt contract test**

Assertions:
- `schemaVersion === 3`
- `historyDomain === "question"`
- `recordOrigin === "school-paper"`
- `recordType === "school-exam"`
- `schoolExamId === "science-7-1-u01-school-paper-20261006-01"`
- `sourceScore === 73`
- `sourceFullScore === 100`
- `answers.length === 30`
- results contain 22 correct and 8 incorrect
- every answer has `questionId`, `questionRevision`, `selectedCanonicalIndex`, `correctCanonicalIndex`, `selectedDisplayLabel`, `selectedText`, `correctText`
- wrong original labels match the eight confirmed wrong items
- all attempt questionIds exist in the Task 2 bank

- [ ] **Step 2: Run and verify failure**

Run:
`node tests/school-paper-attempt.test.mjs`

Expected: FAIL because the attempt artifact does not yet exist.

- [ ] **Step 3: Create the attempt artifact**

Use:
- `examKey: "science-7-1-u01-school-exam-01"`
- `subject: "science"`
- `subjectLabel: "自然"`
- `semester: "7-1"`
- `unitGroup: "unit-01"`
- `unit: "單元 1 生命現象與科學探究"`
- `metricType: "accuracy"`
- `correct: 22`
- `incorrect: 8`
- `unanswered: 0`
- `total: 30`
- `accuracyPercent: 73`
- `importedFromSheet: true`

`submittedAt` must represent the paper-exam event when known; if only import date is known, preserve a separate `recordedAt` and do not falsely invent the exam date.

- [ ] **Step 4: Add a QA cross-check between bank and attempt**

Test:
- one-to-one 30 ID match
- attempt result snapshot does not alter bank answer authority
- sum of earned paper points = 73
- no unanswered rows

- [ ] **Step 5: Run tests**

Run:
- `node tests/school-paper-bank.test.mjs`
- `node tests/school-paper-attempt.test.mjs`
- `node tests/question-history-core.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message:
`Add normalized school paper attempt`

---

### Task 4: Add a safe one-time Firebase import path

**Files:**
- Create: `school-paper-import.js`
- Create: `tests/school-paper-import.test.mjs`
- Modify only if necessary: `firebase-firestore-sync.js`

**Interfaces:**
- Consumes: Task 3 attempt artifact and the authenticated current user's Firebase context.
- Produces: one idempotent import into `users/{uid}/attempts`, with no duplicate write on repeated import attempts.

- [ ] **Step 1: Write the failing import contract test**

Required API:
`window.SchoolPaperImport.importAttempt(attempt) -> Promise<{status,id?}>`

Contract:
- rejects non-`school-paper` attempts
- rejects attempts not using `historyDomain:"question"`
- uses `schoolExamId` as the idempotency key
- repeated import reports already-imported rather than writing a duplicate
- does not modify existing history aggregation code

- [ ] **Step 2: Run and verify failure**

Run:
`node tests/school-paper-import.test.mjs`

Expected: FAIL because import module does not exist.

- [ ] **Step 3: Implement the smallest import module compatible with existing Firebase initialization**

Preferred behavior:
- reuse existing initialized Firestore/auth if exposed
- otherwise expose one narrowly-scoped helper from `firebase-firestore-sync.js`
- query the current user's attempts for matching `schoolExamId`
- if found, return `{status:"already-imported"}`
- otherwise add the cleaned attempt and server timestamp

Do not add a new collection or counter document.

- [ ] **Step 4: Verify history aggregation sees the imported paper attempt**

Add test data to `tests/question-history-core.test.mjs`:
- one paper attempt with an incorrect answer
- one later web attempt with the same questionId and a correct answer

Expected aggregate:
- `answeredCount=2`
- `correctCount=1`
- `wrongCount=1`
- `lastResult="correct"`

- [ ] **Step 5: Run tests**

Run:
- `node tests/school-paper-import.test.mjs`
- `node tests/question-history-core.test.mjs`
- `node --check school-paper-import.js`
- `node --check firebase-firestore-sync.js`

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message:
`Add idempotent school paper history import`

---

### Task 5: Add the Unit 1 “學校考試紀錄” entry and record list

**Files:**
- Create: `exam-science-school-records.js`
- Modify: `index.html`
- Modify: `exam-catalog.js`
- Create: `tests/science-school-records-ui.test.mjs`

**Interfaces:**
- Consumes: Task 2 bank metadata and Task 3 attempt artifact.
- Produces: Unit 1 catalog card and a record-list screen that does not start an exam.

- [ ] **Step 1: Write the failing UI source contract**

Assert source contains:
- `學校考試紀錄`
- `1 次考試`
- `73`
- `8 題錯誤`
- a route/card inserted after 1-3 and before 核心素養
- no call to `startExam()` when opening the record list

- [ ] **Step 2: Run and verify failure**

Run:
`node tests/science-school-records-ui.test.mjs`

Expected: FAIL.

- [ ] **Step 3: Add the Unit 1 catalog item**

The card must render between 1-3 and 核心素養.

Summary:
- title: `🏫 學校考試紀錄`
- description: `1 次考試｜最新 73 分｜8 題錯誤`

Do not mark it as a normal curriculum section.

- [ ] **Step 4: Implement the record-list screen**

First record card:
- `七年級第一學期第一單元`
- `73 / 100`
- `30 題`
- `答對 22`
- `答錯 8`
- button: `查看考卷`

- [ ] **Step 5: Load the module from `index.html` in the correct order**

It must load after the catalog/runtime dependencies it uses.

- [ ] **Step 6: Run tests and syntax checks**

Run:
- `node tests/science-school-records-ui.test.mjs`
- `node --check exam-science-school-records.js`
- existing catalog/navigation tests

Expected: PASS.

- [ ] **Step 7: Commit**

Commit message:
`Add Unit 1 school exam records browser`

---

### Task 6: Implement read-only paper review mode

**Files:**
- Modify: `exam-science-school-records.js`
- Create: `tests/school-paper-review.test.mjs`

**Interfaces:**
- Consumes: Task 2 bank + Task 3 attempt + existing question-history aggregation API.
- Produces: a review screen showing the original 30 questions, original selected answers, correct answers, red wrong-card state, and aggregate history annotations without creating an attempt.

- [ ] **Step 1: Write failing review-mode contract tests**

Assert:
- review rendering never calls `storeAttemptLocally`
- review rendering never dispatches `exam:submitted`
- 8 original wrong items get `.history-wrong`
- correct items show original correct selection state
- each reviewed item can display current aggregate `answeredCount/wrongCount/lastResult`
- navigation back to the record list works

- [ ] **Step 2: Run and verify failure**

Run:
`node tests/school-paper-review.test.mjs`

Expected: FAIL.

- [ ] **Step 3: Implement review rendering**

Use the existing bank question shapes where possible.

For each answer:
- show original paper selection
- show correct answer
- show `❌ 當時作答` for incorrect
- show `✅ 當時作答` for correct
- add `.history-wrong` to incorrect cards

Load current aggregate history via `ChrisExamHistoryStore.loadRecentQuestionAttempts(50)` + `ExamQuestionHistoryCore.aggregateQuestionHistory()`.

- [ ] **Step 4: Add explicit guards against accidental submission**

Review mode must not:
- show normal submit button
- write localStorage exam records
- dispatch completed-attempt events

- [ ] **Step 5: Run tests**

Run:
- `node tests/school-paper-review.test.mjs`
- `node tests/question-history-ui.test.mjs`
- `node tests/question-history-core.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message:
`Add read-only school paper review mode`

---

### Task 7: Add “重新挑戰這份考卷” using the existing exam runtime

**Files:**
- Modify: `exam-science-school-records.js`
- Modify if needed: `exam-records.js`
- Create: `tests/school-paper-retry.test.mjs`

**Interfaces:**
- Consumes: Task 2 bank.
- Produces: a normal web attempt linked to the paper with `recordOrigin:"web"` and `schoolExamId` preserved.

- [ ] **Step 1: Write failing retry contract test**

Assert:
- review screen has `重新挑戰這份考卷`
- retry calls existing `startExam(bankKey)`
- retry context carries `schoolExamId`
- newly captured attempt uses `recordOrigin:"web"`
- new attempt remains `historyDomain:"question"`
- the retry does not reuse the original paper's `submittedAt`

- [ ] **Step 2: Run and verify failure**

Run:
`node tests/school-paper-retry.test.mjs`

Expected: FAIL.

- [ ] **Step 3: Add retry context**

Context must include:
- `key: "science-7-1-u01-school-exam-01"`
- `schoolExamId: "science-7-1-u01-school-paper-20261006-01"`
- `recordOrigin: "web"`
- `examType: true`
- `scoreMode: "percent"`
- `preserveOptionOrder: true`

- [ ] **Step 4: Ensure `exam-records.js` persists context record origin and schoolExamId**

Only add fields if not already captured generically:
- `recordOrigin`
- `schoolExamId`

Default existing exams to `recordOrigin:"web"` only if this does not break existing schema consumers; otherwise leave absent for legacy exams and set explicitly for paper retries.

- [ ] **Step 5: Run tests**

Run:
- `node tests/school-paper-retry.test.mjs`
- `node tests/question-history-contract.test.mjs`
- `node tests/question-history-core.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message:
`Add school paper retry flow`

---

### Task 8: Final QA, Google Sheet completion, Firebase import, and documentation

**Files:**
- Modify: Google Sheet from Task 1
- Modify: `LEARNING_HISTORY_FIREBASE.md`
- Modify: `EXAM_WORKFLOW.md`
- Test: full relevant Node test suite

**Interfaces:**
- Consumes: all prior tasks.
- Produces: one fully imported real paper attempt, PASS QA sheet, documented workflow, and verified UI/history behavior.

- [ ] **Step 1: Complete the Sheet with the final 30 questionIds, answers, mappings, assets, and import status**

Expected:
- `questionIdCount=30`
- `historyEligibleCount=30`
- `duplicateQuestionIdCount=0`
- `missingQuestionIdCount=0`
- `missingResultCount=0`
- `missingCorrectAnswerCount=0`
- `invalidMappedSectionCount=0`
- `computedScore=73`
- `scoreMatch=PASS`
- `overallStatus=PASS`

- [ ] **Step 2: Perform the one-time Firebase import**

Import the Task 3 artifact for the intended authenticated user.

Verify:
- exactly one matching `schoolExamId` attempt exists
- repeated import reports already-imported
- no duplicate paper attempt appears

- [ ] **Step 3: Verify existing question-history aggregation with real imported data**

Manual checks:
- an originally wrong paper question shows at least `錯題 1 次`
- an originally correct question contributes to `作答 1 次`
- retrying one question and answering correctly updates aggregate counts as expected
- review mode itself does not change counts

- [ ] **Step 4: Run the full relevant test set**

Run at minimum:
- `node tests/school-paper-bank.test.mjs`
- `node tests/school-paper-attempt.test.mjs`
- `node tests/school-paper-import.test.mjs`
- `node tests/science-school-records-ui.test.mjs`
- `node tests/school-paper-review.test.mjs`
- `node tests/school-paper-retry.test.mjs`
- `node tests/question-history-core.test.mjs`
- `node tests/question-history-contract.test.mjs`
- `node tests/question-history-ui.test.mjs`

Expected: all PASS.

- [ ] **Step 5: Update documentation**

`LEARNING_HISTORY_FIREBASE.md`:
- document `recordOrigin:"school-paper"`
- document `schoolExamId`
- document idempotent import semantics
- reiterate attempts remain the authority

`EXAM_WORKFLOW.md`:
- document paper-exam ingestion flow
- Google Sheet QA gates
- bank/attempt generation
- review vs retry distinction

- [ ] **Step 6: Commit**

Commit message:
`Complete school paper exam history integration`
