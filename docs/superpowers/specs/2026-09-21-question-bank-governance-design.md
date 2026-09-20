# Question Bank Governance Design

> Date: 2026-09-21
>
> Scope: Exam repository question identity, append-only governance, Firebase traceability, and future answer-history recall.
>
> Status: design for review before implementation.

---

## 1. Purpose

The Exam project needs reliable long-term traceability for every formal question.

Future features such as:

- previous-attempt recall
- per-question attempt count
- per-question wrong count
- weakness navigation
- spaced review
- adaptive question selection

must all be able to answer one basic question:

> Is this the same question the learner answered before?

Therefore formal questions require a permanent identity that is independent from display order, runtime sorting, chapter placement, or future bank growth.

---

## 2. Core invariant: formal banks are append-only

Once a question becomes formal content, its identity is permanent.

Formal banks follow these rules:

1. New questions are appended.
2. Existing formal questions are not renumbered merely because new questions are added.
3. A formal question is not silently replaced by a different question.
4. Moving a question to another chapter, changing UI order, or reusing it in another exam set does not change its identity.
5. Historical Firebase attempts must continue to resolve to the same logical question.
6. Test or draft questions are excluded from this immutability guarantee until promoted to formal content.

The governing principle is:

> **Formal question content is append-only; identity is immutable.**

---

## 3. Permanent question identity

Every formal static question must have a globally unique:

```text
questionId
```

The ID is stored as a string.

Recommended format:

```text
YYMMDDHHmmssSSS
```

Meaning:

```text
YYMMDDHHmmss
+ SSS = sequence within the same second
```

Example:

```text
260921070301001
260921070301002
260921070301003
```

The timestamp portion records creation time. The final three digits allow up to 999 questions created in the same second.

The generator must check the repository authority before assigning IDs. If the same timestamp sequence already exists, increment the sequence. GitHub write conflicts remain the final protection against concurrent assignment.

### 3.1 Why this format

The project intentionally avoids long UUID-style identifiers when they provide no additional practical value.

The chosen ID is:

- compact
- sortable
- human-checkable
- searchable
- cheap to store repeatedly in Firebase
- deterministic enough for batch generation
- independent from subject or directory names

No subject, chapter, school, or exam title is encoded into the permanent ID because those classifications may change while the question identity must not.

---

## 4. `questionId` and display `number` are different

`questionId` is permanent identity.

`number` is presentation metadata.

Example:

```json
{
  "questionId": "260921070301001",
  "number": 12,
  "q": "...",
  "o": ["...", "...", "...", "..."],
  "a": 2
}
```

For a fixed canonical bank, existing display numbers should remain stable and new formal questions should normally be appended with new numbers.

However, some runtime-generated or merged views may display questions in another order. Such UI order must never be used as the historical identity.

This is especially important for merged school-exam collections where runtime code may currently reassign display numbers.

---

## 5. Question lifecycle

Recommended lifecycle:

```text
draft
↓
test
↓
active
↓
retired
```

### draft

Work in progress. No historical guarantee.

### test

Used for validation or temporary experiments. May still change freely.

### active

Formal question. Append-only and identity-immutable rules apply.

### retired

No longer selected for ordinary new exams, but remains in the repository or historical registry so old Firebase attempts remain resolvable.

A retired question must not be deleted merely because it is no longer used.

---

## 6. Corrections and revisions

A typo correction, explanation correction, metadata enrichment, or verified answer correction should preserve the same `questionId`.

Formal questions should support:

```text
revision
```

Example:

```json
{
  "questionId": "260921070301001",
  "revision": 2
}
```

Firebase attempts should eventually record both:

```text
questionId
questionRevision
```

This preserves what version the learner actually answered.

If a change creates a materially different question rather than correcting the same question, create a new `questionId` and retire the old question instead of rewriting its identity.

---

## 7. Stable exam-bank identity

Previous-attempt recall also requires a stable exam or bank identity.

Existing stable `examKey` / `difficulty` values should remain stable for fixed banks.

Appending new questions to a formal bank does not create a new bank identity. Older attempts may simply contain fewer question IDs than the current bank.

Therefore recall works by:

```text
stable examKey
+
stable questionId
```

The exam key answers:

> Which bank or exam was attempted?

The question ID answers:

> Which exact question was answered?

---

## 8. Firebase attempt requirements

Future attempt records should preserve per-question identity.

Target structure:

```text
attempt
├─ examKey
├─ submittedAt
├─ score / accuracy
└─ answers[]
   ├─ questionId
   ├─ questionRevision
   ├─ questionType
   ├─ selected...
   ├─ isCorrect
   └─ provenance needed for display/debugging
```

The permanent ID is the primary aggregation key for:

```text
attemptCount
correctCount
wrongCount
unansweredCount
lastAttemptAt
lastSelectedAnswer
lastResult
```

Legacy Firebase attempts that predate `questionId` may temporarily use a fallback identity derived from existing fields such as:

```text
examKey + number + question text
```

This fallback is compatibility-only and must not become the new formal identity rule.

---

## 9. Subject-specific identity rules

### 9.1 Chinese, science, social studies, textbook English, mathematics, past exams

Formal static questions receive permanent `questionId`.

School-exam provenance such as:

```text
school
year
exam
originalQuestionNumber
```

remains important evidence, but provenance is not a replacement for `questionId`.

### 9.2 Mathematics handwriting questions

Existing handwriting `questionId` values should be preserved where already formal.

Handwriting attempt history must eventually store the Gemini grading result under the same permanent question identity.

### 9.3 GEPT vocabulary memory

Vocabulary memory is a special dynamic system.

Its stable learning-item identity is already:

```text
vocabId
```

Therefore dynamically generated vocabulary exams do not need to manufacture a new permanent static `questionId` for every generated occurrence.

Per-word longitudinal statistics continue to aggregate by `vocabId`.

### 9.4 Dynamic generated practice

AI-generated or temporary generated questions remain `draft` or `test` unless explicitly promoted into the formal bank.

Promotion assigns a permanent `questionId`.

---

## 10. Existing bank migration

Migration must not rewrite question text or reorganize formal banks merely to add IDs.

The migration principle is:

```text
existing bank
→ preserve existing content and order
→ assign missing questionId
→ commit
→ future additions append only
```

Where a question already has a reliable formal `questionId`, it must not receive a replacement ID.

No bulk cleanup should silently change:

- question wording
- answer choices
- answer index
- source provenance
- original question number
- image association
- concept mapping

unless that is a separately reviewed correction.

---

## 11. Recall feature enabled by this governance

After stable IDs are in place, a fixed exam can add:

```text
交卷看成績
顯示詳解
重新作答
回溯
```

The recall action can query Firebase attempts for the same `examKey`, then aggregate each current question by `questionId`.

Each question can show:

```text
做過 4 次
錯誤 3 次
上次作答：C
上次結果：錯誤
上次時間：...
```

Newly appended questions naturally show no previous history until attempted.

The recall feature must not depend on current question position.

---

## 12. Documentation authority

This design should be implemented through two documentation layers:

### README.md

Keep only the constitution-level rule:

- formal banks are append-only
- every formal static question has permanent `questionId`
- identity does not change because of new questions, sorting, relocation, or UI changes
- formal corrections preserve identity through revision
- test/draft questions are exempt until promoted

README should link to the detailed authority.

### QUESTION_BANK_GOVERNANCE.md

This becomes the authority for:

- question identity
- ID format
- append-only rules
- lifecycle
- revision
- migration
- Firebase mapping
- subject-specific exceptions
- future recall compatibility

Other workflow documents should reference this authority rather than duplicating the full rules.

---

## 13. Non-goals for this step

This governance change does not yet:

- backfill IDs into every existing JSON
- modify Firebase schema
- add the recall button
- change exam rendering
- migrate historical Firebase data
- create question statistics collections

Those belong to the implementation plan after this design is approved.

---

## 14. Success criteria

The governance is successful when future developers and AI sessions can answer consistently:

1. Can a formal question be silently replaced? — No.
2. Can a formal question receive a new ID because its chapter changed? — No.
3. Can new questions be added to a bank? — Yes, by append.
4. Can historical attempts still identify old questions? — Yes.
5. Is display order the question identity? — No.
6. Can test questions change freely before promotion? — Yes.
7. Can the same formal question be reused in multiple review sets? — Yes, using the same `questionId`.
8. Does GEPT vocabulary continue to use `vocabId` as its stable learning identity? — Yes.
