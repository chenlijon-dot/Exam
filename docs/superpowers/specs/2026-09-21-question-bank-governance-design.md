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

The timestamp portion records the **identity issuance time**, not the original date when the question was written, published, scanned, or first appeared in a school exam. This distinction matters when existing historical banks receive IDs later during migration.

Source dates continue to live in provenance fields such as:

```text
year
schoolYear
examYear
sourceFile
sourcePage
```

The final three digits allow up to 999 questions to receive IDs in the same second.

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

### 3.2 Type rule

`questionId` is always stored and transported as a **string**, even though its current format is numeric-looking.

Correct:

```json
{ "questionId": "260921070301001" }
```

Do not store it as a JavaScript or Firestore number.

This prevents future integer-precision problems, preserves formatting, and keeps the identity type stable across JSON, Firebase, JavaScript, and tooling.

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

## 4.1 Option identity must survive shuffling

A/B/C/D position is presentation state, not answer identity.

Because practice banks may shuffle options, Firebase history must not rely only on:

```text
selectedIndex
correctIndex
```

The runtime should preserve a canonical option identity derived from the source question before shuffling.

A minimal compatible model is:

```text
selectedCanonicalIndex
correctCanonicalIndex
```

Example:

```text
canonical option 0 = Taipei
canonical option 1 = Kaohsiung
canonical option 2 = Taichung
canonical option 3 = Tainan

runtime display:
A = Tainan
B = Kaohsiung
C = Taipei
D = Taichung
```

If the learner chooses display B, the historical record stores canonical option 1.

Existing `selectedText` / `correctText` may remain useful for display and legacy compatibility, but option text must not become the primary permanent identity because wording may later receive typo corrections.

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

A historical attempt must preserve which questions were **actually present in that attempt**. A question added later must not be interpreted as "unanswered" in an older attempt where it did not yet exist.

Therefore each attempt must retain the set/order of question IDs actually presented at that time.

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
├─ presentedQuestionIds[]
└─ answers[]
   ├─ questionId
   ├─ questionRevision
   ├─ questionType
   ├─ selectedCanonicalIndex
   ├─ correctCanonicalIndex
   ├─ result
   └─ minimal provenance/snapshot needed for display/debugging
```

The permanent ID is the primary aggregation key for:

```text
shownCount
answeredCount
correctCount
wrongCount
unansweredCount
unclearCount
lastAttemptAt
lastSelectedAnswer
lastResult
```

Legacy Firebase attempts that predate `questionId` may temporarily use a fallback identity derived from existing fields such as:

```text
examKey + number + question text
```

This fallback is compatibility-only and must not become the new formal identity rule.

### 8.1 "Shown" is not the same as "answered"

For long-term analytics:

```text
shownCount
→ the question appeared in a submitted attempt

answeredCount
→ the learner actually supplied an answer

correctCount
→ answered and correct

wrongCount
→ answered and wrong

unansweredCount
→ shown but no answer

unclearCount
→ grading was attempted but could not be reliably classified
```

The UI may simplify this to:

```text
作答 4 次｜錯 3 次
```

but the underlying counters remain separate.

### 8.2 Historical snapshot and Firestore size

The permanent lookup authority is:

```text
questionId + questionRevision
```

Firebase should avoid repeatedly storing large duplicated payloads when a stable question lookup is sufficient.

Especially avoid using attempt documents as another full question bank containing repeated:

```text
long question text
all option text
full explanation
long passage
image binary data
```

However, do not blindly remove every snapshot field. Historical display may need enough compact data to explain what the learner saw if a question is later revised.

The implementation plan should define the smallest useful historical snapshot. Image content itself is never embedded in Firebase; only path/reference metadata may be stored.

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

Handwriting grading states are not binary. Preserve at least:

```text
correct
incorrect
unclear
unanswered
```

`unclear` must **not** increment `wrongCount`. An AI/vision confidence failure is not evidence that the learner's mathematics was wrong.

### 9.3 Manual-study questions

A `manual-study` question may be tracked as presented, but must not contribute to correct/wrong statistics unless a later explicit grading mechanism exists.

For current ungraded manual-study items:

```text
shownCount
→ allowed

answeredCount / correctCount / wrongCount
→ not inferred automatically
```

### 9.4 GEPT vocabulary memory

Vocabulary memory is a special dynamic system.

Its stable learning-item identity is already:

```text
vocabId
```

Therefore dynamically generated vocabulary exams do not need to manufacture a new permanent static `questionId` for every generated occurrence.

Per-word longitudinal statistics continue to aggregate by `vocabId`.

### 9.5 Dynamic generated practice

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

## 10.1 Formal asset immutability

Question meaning may depend on an image, diagram, map, table, or other asset.

A formal question must not keep the same revision while its referenced asset is silently replaced with semantically different content.

Non-semantic maintenance such as file compression or equivalent-quality restoration may keep the same revision if the learner-visible meaning is unchanged.

If labels, values, geometry, map content, table data, or other meaning-bearing visual content changes, increment the question revision or create a new question identity when the result is materially a different question.

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

They must be shown as having no history, **not** as unanswered in earlier attempts where they were not present.

The recall feature must not depend on current question position.

For the current bank, aggregation should conceptually be:

```text
current questionId
↓
find historical attempts whose presentedQuestionIds included it
↓
aggregate shown / answered / correct / wrong / unanswered / unclear
↓
show latest applicable answer/result
```

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
- canonical option identity
- asset/revision rules
- historical presented-question semantics
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
- optimize or compact existing Firebase attempt documents

Those belong to the implementation plan after this design is approved.

---

## 14. Validator requirements

The governance must eventually be enforced automatically, not only documented.

Repository validation should progressively check:

```text
all active formal questions have questionId
questionId is a string
questionId format is valid
questionId is globally unique
existing formal IDs are not silently removed or replaced
revision is valid
required answers remain valid
referenced assets exist
formal bank additions preserve append-only expectations
```

Where feasible, diff-aware validation should warn or fail when an existing active question ID suddenly maps to materially different content without an explicit revision.

The first validator version may distinguish:

```text
ERROR
→ identity collision, missing formal ID, invalid answer, broken required asset

WARNING
→ legacy question awaiting migration, suspicious content mutation, incomplete revision metadata
```

---

---

## 15. Success criteria

The governance is successful when future developers and AI sessions can answer consistently:

1. Can a formal question be silently replaced? — No.
2. Can a formal question receive a new ID because its chapter changed? — No.
3. Can new questions be added to a bank? — Yes, by append.
4. Can historical attempts still identify old questions? — Yes.
5. Is display order the question identity? — No.
6. Can test questions change freely before promotion? — Yes.
7. Can the same formal question be reused in multiple review sets? — Yes, using the same `questionId`.
8. Does GEPT vocabulary continue to use `vocabId` as its stable learning identity? — Yes.
9. Is `questionId` always represented as a string? — Yes.
10. Does option shuffling preserve canonical answer identity? — Yes.
11. Can the system distinguish a question not present in an old exam from a question that was present but unanswered? — Yes.
12. Does handwriting `unclear` avoid being counted as a learner error? — Yes.
13. Can a semantic asset change occur without revision? — No.
14. Is governance enforceable by repository validation rather than documentation alone? — Yes.
