# Exam Project Blueprint

> 專案目前進度、架構治理與下一階段工作藍圖。
>
> 建立日期：2026-09-20
>
> 本文件不是即時題數、章節 ready 狀態或教材內容的最高 authority。  
> 即時現況仍以 `README.md`、各專門 authority 文件、`curriculum-catalog/`、`chapter-bank/` 與實際程式資料為準。
>
> 本文件回答的是：
>
> **「目前做到哪裡？整體架構怎麼理解？接下來最值得往哪裡做？」**

---

# 1. 文件定位

`README.md` 負責：

```text
現在是什麼
大原則是什麼
整體架構是什麼
各 authority 在哪裡
```

`PROJECT_BLUEPRINT.md` 負責：

```text
目前已完成哪些重要地基
整體系統正在往哪個方向發展
哪些能力正在形成
接下來的優先工作
仍有哪些技術債需要收斂
```

因此：

```text
README = 現況與總憲法
BLUEPRINT = 工作進度 + 架構方向 + 下一步建議
各專門 MD / design spec = 個別領域規格 authority
實際 JSON / JS / catalog / Drive = 真正資料來源
成果報告 = 某一批任務的完成證據 / snapshot
```

## 1.1 目前重大里程碑

截至 2026-09-21，已完成一個重要資料治理地基：

> **正式固定題庫永久 question identity 已完成全科 migration。**

目前已納入永久 identity 治理的正式固定題目共：

```text
2,159 題
```

範圍包含：

```text
國文章節題庫
國文已匯入歷屆基測
數學七上章節題庫
數學已匯入歷屆基測
英文七上固定章節題庫
GEPT Reading
自然七上
社會：地理 / 歷史 / 公民
```

目前治理結果：

```text
正式靜態題 → 永久 questionId
既有正式題 → revision: 1
既有 handwriting legacy questionId → 保留，不重新編號
GEPT Vocabulary → 繼續使用 vocabId，不硬套 questionId
number / originalQuestionNumber → 不再作為永久 identity
正式題庫 → append-only，新增題目不重編既有 identity
```

完整執行成果另保存在 Google Drive：

```text
國中教材參考資料/
└─ 題庫永久questionId全科修整成果報告_2026-09-21.md
```

這代表未來 Firebase 作答紀錄、錯題統計、回溯、Question Registry 與智慧選題，已經有穩定的題目 identity 可以依附。

目前**尚未因此自動完成**：

```text
Firebase attempt schema migration
presentedQuestionIds
canonical option history
手寫 grading history 正式保存
回溯按鈕
每題累積作答 / 錯誤統計
deployment validator
manifest
```

因此下一階段應把「題目 identity 已穩定」正式轉化成「學生歷程可回溯」。

---

# 2. 核心治理原則

未來所有 Exam 開發與教材整理，優先遵守以下原則。

## 2.1 先找 authority，再修改 authority

不要看到 UI 不對就立刻加 patch。

標準順序：

```text
問題出現
→ 找真正 authority
→ 確認資料是否正確
→ 修正式資料來源
→ UI 自然跟著正確
```

只有確定正式資料來源無法合理修改時，才使用 runtime compatibility layer。

---

## 2.2 能改正式資料來源，就不要新增 runtime patch

目前專案已累積：

```text
static catalog
runtime dynamic loader
DOM patch
deployment-time injection
legacy compatibility module
```

短期有效，但長期會讓：

```text
「哪個檔案才是真的？」
```

越來越難回答。

未來方向：

```text
正式資料
→ 單一 manifest / catalog
→ runtime 讀取
→ UI
```

而不是：

```text
static catalog
→ module A 改一次
→ module B 再 patch
→ workflow deploy 再 inject
```

---

## 2.3 規則與進度分離

母 SOP 不應大量保存容易變動的數字與進度。

例如：

```text
TEXTBOOK_COLLECTION_WORKFLOW.md
```

應保存：

```text
怎麼收教材
怎麼建立 canonical
怎麼處理 evidence
怎麼轉題庫
```

不應長期保存：

```text
目前做到第幾回
目前有幾題
某一 Lesson 今天是否 ready
```

動態狀態應放在：

```text
專科 authority
catalog
manifest
實際資料檔
```

---

# 3. 文件治理藍圖

目前主要文件角色應固定如下：

| 文件 | 角色 |
|---|---|
| `README.md` | 全專案大原則、大架構、authority map |
| `PROJECT_BLUEPRINT.md` | 技術債、架構收斂、未來工作目標 |
| `EXAM_WORKFLOW.md` | 各校段考／公開題庫母 SOP |
| `TEXTBOOK_COLLECTION_WORKFLOW.md` | 教材收集與 canonical 母 SOP |
| `ENGLISH_Database.MD` | 英文 GEPT 閱讀與字彙 authority |
| `LEARNING_HISTORY_FIREBASE.md` | Firebase 學習歷程 authority |
| `docs/superpowers/specs/2026-09-21-question-bank-governance-design.md` | 正式題庫永久 identity / append-only / revision 設計規格 |
| Google Drive `題庫永久questionId全科修整成果報告_2026-09-21.md` | 2,159 題 migration 完成成果 snapshot |
| `Android學生機設計.MD` | Student Exam Android / SM-T220 runbook |
| `curriculum-catalog/*.md` | 各科實體教材課程樹 authority |
| 有日期的 collection MD | 歷史 snapshot |

未來可逐步在重要 MD 頂部加入：

```text
Document role:
Authority scope:
Last reviewed:
Supersedes:
Superseded by:
```

讓新對話或未來維護者不必猜文件角色。

---

# 4. 專案真正目標：題庫 AI 化

本專案的終極目標不是建立「很多題目的網站」，而是建立一套能理解教材、理解題目、理解學生錯誤，並在正確時間挑出最值得練習題目的智慧學習系統。

核心句：

> **不是讓學生做更多題，而是讓學生在正確的時間，做最值得做的題。**

學生不應漫無目的地瀏覽大量題庫，而應形成：

```text
學習教材
↓
少量作答
↓
留下正確／錯誤紀錄
↓
判斷弱點
↓
凸顯需要複習的章節／concept
↓
從大題庫海撈最合適的題
↓
再次作答
↓
重新評估掌握程度
↓
安排下一輪複習
```

因此：

```text
題庫數量 ≠ 學習品質

題庫 + 結構化知識 + 學習歷程 + 智慧選題
= Adaptive Learning
```

AI 的角色不是取代教材 authority，也不是隨意生成大量題目，而是協助：

```text
理解題目在考什麼
理解學生錯在哪裡
判斷下一題應該做什麼
```

---

# 5. 六大主流與系統角色

目前專案大致沿著六條主流發展。

## 5.1 課本

課本是主要 curriculum backbone。

目前國文、英文、數學、自然、社會逐步建立：

```text
實體課本
→ 原始照片 evidence
→ 教材辨識
→ canonical 教材知識庫
→ concept / 考點 / 迷思 / 題型
→ 題庫
```

Google Drive 保留原始 evidence 與 canonical，讓人可以重新核對。

## 5.2 講義

目前主要出現在自然／生物。

講義不能直接取代課本，但可補充：

```text
老師強調內容
考試常見重點
額外例題
常見迷思
補充圖表
```

目前自然 canonical 已經開始保留：

```text
資料來源
核心概念
常見迷思
題型
concept ID 候選
來源影像
```

未來應保留「課本來源」與「講義來源」的 provenance，不混成無法追溯的一份文字。

## 5.3 英文特殊主線

英文不完全以課本 Lesson 作為唯一主軸。

目前重要 backbone 是：

```text
GEPT 初級 vocabulary universe
+ GEPT 初級閱讀
+ 國中課本 Lesson
```

Google Drive 已有 structured vocabulary master，可逐步建立：

```text
word
→ normalized word
→ part of speech
→ meaning / sense
→ level
→ sentence / grammar
→ reading context
→ GEPT question
→ textbook lesson mapping
```

英文可作為「reference-aware 智慧複習」最早的 prototype。

## 5.4 各校段考題

各校段考是真實考試題型的重要來源，但也是最複雜的資料線。

困難包括：

```text
不同學校
不同年度
不同題號格式
不同章節範圍
圖題
表格
題組
共用圖片
答案卷分離
```

目前自然、國文已經有逐題 chapter / lesson index Google Sheet，這是未來 Question Registry 的早期雛形。

長期每一題應能回答：

```text
哪一校？
哪一年？
哪一次段考？
原題號？
答案來源？
屬於哪個章節？
考哪些 concept？
有沒有圖片？
```

圖題不應視為特殊例外，而應成為 Question Model 的正式一級資料。

## 5.5 數學手寫板

數學手寫板不是教材來源，而是「作答與評量引擎」。

### 目前已落地

截至 2026-09-21，數學七上單元 1 的 1-1～1-4 已把 `type: "handwriting"` 納入正式計分題型；每節困難題各有 2 題手寫題，共 8 題。

目前正式流程：

```text
題目
↓
exam-runtime-flex.js
↓
exam-handwriting.js
↓
完整 Web Canvas 作答工具
↓
Firebase App Check
↓
Firebase AI Logic / Gemini
↓
辨識答案與計算過程
↓
correct / incorrect / unclear
↓
納入正式測驗成績
```

正式手寫畫布目前可使用：

```text
自由手寫
原子筆
橡皮擦
直線／三角形／圓形／矩形
文字標示
指標模式
拖移／縮放
```

`verdict = correct` 才計分；錯誤時可回傳錯誤位置、原因、修正方向與下一步提示。正式題庫手寫判題已不再依賴 GitHub Token／Exam-Record／GitHub Actions relay。

### 長期角色

下一階段不是只判斷答案對錯，而是把過程診斷進一步結構化：

```text
題目
↓
學生手寫
↓
答案／步驟辨識
↓
判斷哪一步開始錯
↓
錯誤類型
↓
concept / misconception
↓
再選補強題
```

希望逐步區分：

```text
計算錯
符號錯
公式選錯
概念錯
步驟錯
```

因此數學手寫板後續應直接接入 Learner State、弱點導航與智慧選題。

### 手寫答案保存：目前建議

截至 2026-09-21，正式手寫題已經有穩定的 `questionId` identity，但學生「手寫答案本體」的長期保存格式仍應與一般選擇題分開設計。

目前建議採 **PNG + JSON metadata** 兩層保存，而不是把整張手寫圖塞進 JSON：

```text
Canvas 作答
↓
PNG / WebP
→ 保存學生實際筆跡，作為原始作答 evidence

JSON / Firebase attempt metadata
→ questionId
→ questionRevision
→ answerType: handwriting
→ handwritingImagePath / storage reference
→ submittedAt
→ AI grading result
→ 後續 misconception / concept diagnosis
```

建議的 attempt 資料形狀：

```json
{
  "questionId": "math-7-1-1-1-hard-handwriting-01",
  "questionRevision": 1,
  "answerType": "handwriting",
  "handwritingImagePath": "math-handwriting-images/<attempt-id>.png",
  "submittedAt": "2026-09-21T09:40:00+08:00",
  "grading": {
    "verdict": "incorrect",
    "errorStep": "第二行移項符號錯誤",
    "whyWrong": "將負項移至等號另一側時未改號",
    "correction": "移項後應改變符號",
    "nextHint": "重新檢查第二行的移項"
  }
}
```

原則：

- PNG / WebP 是學生當次手寫答案的**原始 evidence**；JSON 只保存索引、狀態與結構化判題結果。
- 不建議把 base64 圖片長期直接塞入 attempt JSON / Firestore document，避免文件膨脹與同步成本增加。
- `questionId` 指向題目 identity；`questionRevision` 指向學生作答當時看到的題目版本，兩者都應保存。
- 一般選擇題可保存 canonical option index；手寫題則使用 `answerType: handwriting` + image reference，不應硬套 selected option schema。
- AI 判題結果是衍生資料；原始手寫影像應保留，未來模型或 rubric 更新時才有重新判讀的可能。

第二階段可選擇再保存 **stroke data**：

```json
{
  "strokes": [
    {
      "points": [
        {"x": 120, "y": 80, "t": 0},
        {"x": 123, "y": 82, "t": 16},
        {"x": 129, "y": 86, "t": 32}
      ]
    }
  ]
}
```

stroke data 的用途是重新渲染、筆畫時序分析、局部修改與未來更細的步驟辨識；它不是第一階段必要條件。第一階段先以 **影像 evidence + JSON metadata + grading result** 為主，避免過早增加資料量與 schema 複雜度。

後續真正實作保存層時，還需要再決定影像實際 storage authority、retention、權限與 Firebase attempt schema；在這些規格確認前，本節是目前工作進度與建議，不代表已經完成 persistence migration。

## 5.6 正式歷屆考題

基測／會考維持獨立正式資料區塊。

原則：

```text
原卷 authority
→ 原始題序
→ 原始選項
→ 官方答案
→ 原圖 asset
→ 結構化 JSON
→ concept mapping
```

正式歷屆題是高價值的真實評量資料，不應與 AI 自編題混淆來源。

---

# 6. 四層智慧學習資料架構

未來整個 Exam 可以理解成四層。

## 6.1 Evidence Layer

Google Drive 保存：

```text
課本照片
講義照片
教材 PDF
各校原卷
答案卷
基測／會考原卷
英文來源資料
```

這一層的功能是「證據保存與重新核對」，不是即時 query engine。

## 6.2 Knowledge Layer

由 evidence 建立：

```text
canonical
chapter
section
concept
definition
rule
formula
vocabulary
misconception
skill
question type
prerequisite
```

這一層回答：**這個章節到底在教什麼？**

## 6.3 Question Layer

所有不同來源的題目逐步轉成共同 metadata：

```text
questionId
sourceType
subject
grade
semester
chapter
section
conceptIds
difficulty
questionType
cognitiveSkill
misconceptionTags
hasVisual
images
groupId
provenance
```

題目本體仍可分散保存，但索引要能統一查詢。

## 6.4 Learner State Layer

Firebase 保存學生實際學習狀態：

```text
attempts
wrong answers
recent score
answer history
vocabulary progress
last practiced
repeated errors
mastery state
```

這一層回答：**這個學生現在會什麼？還不會什麼？**

---

# 7. Unified Knowledge / Question Database

未來「大資料庫」不應等於把所有檔案搬到同一個資料夾。

應採：

> **資料分開保存，索引統一。**

建議建立三個核心 registry。

## 7.1 Concept Registry

例如：`concept-registry.json`

```json
{
  "id": "science.variable-control",
  "subject": "science",
  "grade": 7,
  "semester": 1,
  "chapter": "1",
  "section": "1-2",
  "title": "變因控制",
  "prerequisites": [],
  "misconceptions": [
    "confuse-independent-controlled-variable"
  ]
}
```

## 7.2 Question Registry

例如：`question-index.json`

它不必複製所有題目內容，主要保存可搜尋 metadata。

```json
{
  "questionId": "260921103000001",
  "revision": 1,
  "sourceType": "school-exam",
  "subject": "science",
  "section": "1-2",
  "conceptIds": ["science.variable-control"],
  "difficulty": "medium",
  "questionType": "experiment-scenario",
  "cognitiveSkill": "application",
  "hasVisual": false
}
```

Question Registry 不自行重編題目 identity；它引用正式題庫已存在的永久 `questionId`。學校、年度、原題號等資訊屬 provenance，不再編進 questionId 本身。

## 7.3 Asset Registry

特別處理：

```text
題目圖片
選項圖片
共用題組圖
表格
幾何圖
地圖
圖表
```

Question Model 應正式支援：

```text
text
options
answer
stimulus
images[]
optionImages[]
sharedGroupId
asset provenance
```

不要再假設「題目 = 純文字」。

### 7.3.1 圖片傳輸與儲存硬規則

教材圖、考題圖、圖表、地圖、幾何圖、照片等正式內容，**一律保存為真正的圖片檔案**。

標準資料流：

```text
Google Drive 原始 PDF / 圖片
        ↓
必要時裁切題目區域
        ↓
PNG / JPG / WebP
        ↓
GitHub assets/
        ↓
JSON 只記錄相對路徑
        ↓
網頁以 <img src="..."> 顯示
```

正式題庫不得把圖片本體寫成：

```text
Base64
data:image/...;base64,...
巨大內嵌 binary string
```

原因：

```text
資料量膨脹
JSON / HTML / JS 難以閱讀與 diff
connector / ChatGPT / API 傳輸容易 timeout
同圖無法有效共用與快取
維護與除錯困難
```

題庫資料應只保存：

```json
{
  "image": "assets/questions/science/114-dawan/q04.png",
  "imageAlt": "第4題實驗裝置圖"
}
```

或依既有 runtime 支援使用 `images[]`、`optionImage`、`optionImages[]` 等欄位；**欄位內容永遠是檔案路徑，不是圖片文字碼**。

例外僅限非常小、純 UI 用的 icon／SVG；教材 evidence、正式試題圖與作答必要視覺資訊不得用 Base64 內嵌。

Google Drive 保存完整原始 evidence；GitHub `assets/` 只保存網站實際需要顯示的裁切圖或衍生 asset。

## 7.4 Drive 不直接當即時搜尋引擎

Google Drive 的角色：

```text
evidence authority
canonical authority
human-readable database
```

網站真正海撈時，應查 derived machine-readable database。

未來可能是：

```text
concept-registry.json
question-index.json
asset-index.json
```

資料量再大後，可以進一步產生 `exam-knowledge.db`，例如 SQLite。

---

# 8. 錯誤紀錄導航（Learning Weakness Navigator）

目前 Firebase 已經累積：

```text
作答次數
分數
錯題數
最近作答
科目概況
```

下一步不是單純增加更多歷程列表，而是建立「錯誤導航」。

學生下次進入學習歷程時，系統應直接指出：

```text
哪些科目需要注意
哪些章節需要複習
哪些 concept 仍然反覆出錯
哪些錯誤已經改善
哪些內容太久沒有再次驗證
```

第一版可以先做到 chapter / lesson level，不必等待所有 concept 完成。

例如：

```text
🔴 自然｜1-2 科學方法
最近 2 次：55 → 75
最近仍錯 5 題
狀態：需要加強

🟠 社會｜第1章 認識位置與地圖
近期正確率約 70%
狀態：尚未穩定

🟢 國文｜第二課 生之歌選
近期連續高分
狀態：已掌握
```

## 8.1 錯誤必須有生命週期

不能因為一題曾經答錯，就永久標成弱點。

建議狀態：

```text
NEW_ERROR
↓
NEEDS_REVIEW
↓
RELEARNING
↓
RETEST_PENDING
↓
MASTERED
```

UI 可簡化成：

```text
🔴 需要加強
🟠 尚未穩定
🟢 已掌握
```

掌握狀態必須能隨新資料重新變動。

## 8.2 複習優先度

第一代不需要 AI 就能計算。

概念上：

```text
Review Priority
=
recent error severity
+ repeated errors
+ low recent score
+ time since last review
+ instability
```

因此：

```text
以前 40 分，但後來連續 100、100
→ 優先度下降

70、70、75，而且最近還錯
→ 優先度提高
```

不要只使用 lifetime average。

---

# 9. 智慧選題（Adaptive Question Selection）

錯誤導航之後，下一步才是「挑下一題」。

系統不應只做：

```text
1-2 科學方法
→ 隨機抽 10 題
```

而應考慮：

```text
目前 mastery
最近錯誤
重複錯誤
距離上次複習時間
題目難度
question type
cognitive skill
是否做過
是否含圖片
來源類型
```

例如：

```text
今日建議 12 題

4 題：最近弱點
3 題：剛學的新內容
2 題：一週前需要 spaced review
2 題：真實段考／歷屆應用
1 題：挑戰題
```

大量題庫是系統的武器庫，不是學生的壓力來源。

## 9.1 類比題

真正的智慧選題不只是找同一章，而是做到：

```text
同 concept
+ 不同情境
```

例如「操縱變因」可以跨：

```text
光照對植物生長
水溫對溶解速度
肥料對植物高度
不同材質對保溫效果
```

表面情境不同，但測量同一個 reasoning skill。

## 9.2 已驗證題庫優先

AI 不應以無限制生成題目為主要來源。

```text
已驗證題庫
→ 優先選題

既有題目不足
→ AI 生成補強題

AI 生成題
→ sourceType = practice-generated
→ 不冒充正式段考／歷屆題
```

---

# 10. 智慧複習的三個精度階段

系統可以循序發展，不需要一次做到最細。

## Level 1：Chapter / Lesson Level

現在就能開始。

```text
自然 1-2 弱
社會第1章弱
英文 Lesson 1 弱
```

主要利用目前 Firebase attempts。

## Level 2：Concept Level

canonical 與 concept mapping 成熟後：

```text
自然 1-2
├─ 操縱變因：弱
├─ 應變變因：尚可
└─ 控制變因：熟
```

這一層開始需要 Concept Registry + Question Registry。

## Level 3：Misconception / Error Pattern Level

最終目標不是只知道「正負數不會」，而是知道「負負轉換時反覆符號錯誤」。

也不是只知道「科學方法不熟」，而是知道「常把操縱變因與控制變因混淆」。

數學手寫板特別適合發展到這一層。

---

# 11. 英文先行、其他科逐步接入

目前英文已有較成熟 reference layer：

```text
GEPT vocabulary master
GEPT reading
textbook lesson
Firebase vocabulary progress
```

因此英文可以率先測試：

```text
錯字／弱字
↓
GEPT vocabulary reference
↓
間隔複習
↓
再次出現
↓
熟練度更新
```

其他科目前多仍以題庫／章節層為主，但 Google Drive 已經逐步保存：

```text
原始資料
教材辨識
canonical
concept ID 候選
```

所以不需要現在就重建資料。

未來只要逐科補上：

```text
canonical
→ Concept Registry
→ Question Registry
→ Learner State
```

就能逐步接進智慧複習。

## 11.1 各科採差異化學習主引擎

Exam 不應把五科硬套進同一套選題模型。

共同的是：

```text
Question Registry
Learner State
錯誤紀錄導航
智慧複習
```

但每一科產生「弱點訊號」與「下一題推薦」的方式，可以不同。

目前建議定位：

### 英文：字彙曝光與記憶狀態驅動

```text
GEPT vocabulary master
↓
Unique Sweep
↓
exposure / target / review
↓
correct / wrong
↓
weakness review
↓
spaced repetition
```

英文的核心問題是：

> 哪些字看過、考過、答錯、久未複習，下一次應該何時再出現？

---

### 國文：真實各校段考反推考點

```text
原始段考卷
↓
逐題課次索引
↓
各課真實出題分布
↓
concept / questionType / cognitiveSkill
↓
高頻考點與不同變形
↓
類比題 / 弱點複習
```

國文不只問：

> 這一課教了什麼？

還要透過多校真實段考回答：

> 這一課實際怎麼被考？哪些考點反覆出現？同一考點如何變形？

---

### 自然：教材 concept、實驗與 misconception 驅動

```text
canonical
↓
核心 concept
↓
科學方法 / 實驗設計 / 圖表判讀
↓
常見迷思
↓
concept-based reinforcement
```

自然特別重視概念理解、實驗推理、變因判讀與錯誤迷思。

---

### 數學：解題步驟與錯誤型態驅動

```text
concept
↓
題目
↓
手寫解題過程
↓
步驟辨識
↓
error pattern / misconception
↓
同型題 / 變式題補強
```

數學的長期價值不只在「答案錯」，而在辨識：

```text
計算錯
符號錯
公式錯
概念錯
步驟錯
```

---

### 社會：章節知識、圖表地圖與關係推理驅動

```text
章節 canonical
↓
人物 / 地點 / 時序 / 制度 / 因果
↓
地圖 / 圖表 / 統計資料
↓
concept relation
↓
情境化與跨概念題
```

社會應逐步把單點記憶提升到位置、時序、因果與制度關係的理解。

---

因此整體原則是：

> **各科有自己的學習模型，但最後匯入共同的 Learner State，再由智慧複習系統決定下一步。**

不要為了統一 schema，而把各科真正重要的學習訊號磨平。

## 11.2 各校段考「逐題課次／章節索引」的正式角色

目前 Google Drive 已經存在：

```text
國文科_各校段考題課次索引
自然科_各校段考題章節索引
```

這些 Sheet 不應視為臨時整理表，而應正式定義為：

> **Question Registry 的前置辨識層（classification / seed layer）。**

目前它們先回答：

```text
年分
國中
段考
題號
→ 出自哪一課 / 哪一章
```

例如：

```text
國文
一-5 → 第一課〈夏夜〉

自然
Q3 → 1-2 科學方法
Q4 → 1-3 認識實驗室
```

無法可靠判斷時保留：

```text
unknown
```

而不是強行分類。

長期演進：

```text
原始段考卷
↓
逐題辨識
↓
課次 / 章節索引
↓
conceptIds
↓
questionType
↓
cognitiveSkill
↓
misconception / error pattern
↓
Question Registry
```

也就是：

```text
第一階段：這題出自哪裡？
第二階段：這題在考什麼？
第三階段：這題需要什麼能力？
第四階段：哪一類學生錯誤適合用這題補強？
```

這樣各校段考資料就不只是「題目來源」，而會逐步成為：

```text
真實考試分布
+
考點頻率
+
題型變化
+
類比題來源
+
智慧選題素材
```

特別是國文，應保留「以多校段考反推真實考點」的主線，不必強迫改成與英文相同的資料庫驅動模式。

---
# 12. P0：Repository Health Check

這是目前最值得優先建立的工程基礎。

目標：

> 在 GitHub Pages deployment 前，自動抓出會讓網站壞掉的資料錯誤。

建議新增：

```text
scripts/
└─ validate_exam_repo.py
```

或類似 validator。

## 12.1 第一版至少檢查

### JSON

```text
JSON 是否能 parse
questions 是否為正確陣列
一般選擇題 q 是否存在
options 是否至少 2 個
答案 index 是否超出選項範圍
```

### 檔案引用

```text
JS / JSON 引用的 chapter-bank path 是否存在
image path 是否存在
past-exam asset 是否存在
reference path 是否存在
```

### Identity / 重複

```text
正式靜態題是否都有 questionId
questionId 是否為 string
questionId 是否全 repo 唯一
revision 是否為正整數
既有 grandfathered legacy questionId 是否仍被保留
同一 bank 是否有重複 stable identity
school + year + originalQuestionNumber 是否重複
```

### metadata

```text
school-exam provenance 是否完整
sourceType 是否合理
preserveOptionOrder 是否符合來源類型
```

## 12.2 Error / Warning 分級

不要第一版就因 legacy schema 把整個 deploy 卡死。

建議：

### ERROR

會讓正式網站壞掉：

```text
JSON 無法 parse
答案 index 超界
必要題目欄位不存在
引用檔案不存在
明確重複 stable identity
questionId collision
正式題缺 questionId
```

### WARNING

需要整理，但暫不阻擋：

```text
缺 schemaVersion
舊 root shape
部分 provenance metadata 不完整
legacy module
未收斂的 runtime patch
```

---

# 13. P0：建立單一 Curriculum / Bank Manifest

目前 curriculum readiness 可能同時存在於：

```text
exam-catalog.js
subject module
DOM runtime patch
chapter-bank 實際檔案
deployment injection
```

長期應收斂成單一 machine-readable manifest。

例如：

```text
catalog/
└─ exam-manifest.json
```

概念結構：

```json
{
  "subject": "science",
  "grade": 7,
  "semester": 1,
  "units": [
    {
      "key": "unit-01",
      "sections": [
        {
          "key": "section-03",
          "title": "認識實驗室",
          "reference": true,
          "practice": {
            "easy": true,
            "medium": true,
            "hard": true
          },
          "schoolExam": true
        }
      ]
    }
  ]
}
```

未來 UI 應：

```text
manifest
→ catalog UI
→ bank loader
```

而不是由多個 JS 互相 patch readiness。

---

# 14. P1：題庫 Schema 收斂

目前 chapter-bank 已經存在多個世代的資料格式。

這不是錯，但新資料應逐步統一。

## 14.1 建議正式欄位

所有新 bank 至少考慮：

```text
schemaVersion
bankId
subject
grade
semester
sourceType
chapterKey / lessonKey / sectionKey
questions
```

school-exam 額外：

```text
school
schoolYear
semester
examName
sourceFile
answerFile
answerVerified
```

每題：

```text
questionId
revision
q
o
a
explanation
conceptIds
sourceType
originalQuestionNumber
preserveOptionOrder
```

其中 `questionId` 是既有永久 identity，不因 schema migration 重新產生；`revision` 用來追蹤同一題的非實質修訂。

特殊題型則明確用：

```text
manual-study
groupId
images
officialDisposition
pendingQuestions
```

## 14.2 不一次硬轉全部舊資料

策略應是：

```text
舊資料保持相容
新資料全部走新 schema
validator 先 warning
逐批 migration
最後才提高要求
```

---

# 15. P1：Module Inventory

目前 root 已有不少歷史模組與不同版本。

例如同一功能可能出現：

```text
module.js
module-v2.js
module-v3.js
module-simple.js
legacy module
```

建議新增一份 machine-readable 或 MD inventory。

例如：

```text
MODULE_INVENTORY.md
```

至少記錄：

| Module | Status | Loaded by | Replacement |
|---|---|---|---|
| xxx.js | ACTIVE | exam-navigation-fix.js | — |
| xxx-v2.js | LEGACY | none | xxx-simple.js |
| old-lab.js | DEPRECATED | none | exam-science-lab.js |

正式狀態：

```text
ACTIVE
LEGACY
DEPRECATED
EXPERIMENTAL
```

這可以大幅降低之後誤改舊檔的風險。

---

# 16. P1：Deployment Workflow 收斂

目前 Pages workflow 除了 deploy，還會：

```text
注入 script
修改 index
加入 build timestamp
避開 legacy module
```

這些操作目前有效，但部署流程不宜長期承擔太多產品邏輯。

未來方向：

```text
source repo
→ validate
→ build
→ deploy
```

而不是：

```text
source repo
→ deployment 時臨時改網站結構
→ deploy
```

## 16.1 應保留

```text
build SHA
deployment timestamp
artifact upload
Pages deploy
validation
```

## 16.2 應逐步搬回 source

```text
功能性 script 注入
ready 狀態
legacy module workaround
產品邏輯 patch
```

---

# 17. P1：清理 One-shot / Legacy Workflow

目前 repository 曾出現只為單次修補而建立的 workflow。

這種 workflow 完成任務後應：

```text
確認已執行
→ 移除
或
→ 明確 archive / disabled
```

避免未來誤觸或讓維護者以為仍是正式流程。

原則：

> GitHub Actions 應代表持續有效的自動化，不應長期保存已完成的一次性 patch。

---

# 18. P1：Firebase / Exam-Record 邊界固定

目前主線已經是：

```text
Firebase Authentication
+
Firestore
+
Firebase AI Logic
```

Private Exam-Record 應逐步固定用途。

建議最後明確只保留：

```text
machine-readable curriculum
private derived data
必要的 legacy compatibility
特殊 GitHub Actions workflow
```

不要再新增：

```text
新的學生主要學習歷程
新的 Firebase 已能處理的資料
新的必須靠 GitHub PAT 才能使用的 AI 功能
```

---

# 19. P1：Catalog 與實際 Bank 自動比對

目前已發生：

```text
catalog 寫待建
但 chapter-bank 已存在
```

例如：

```text
自然 1-3
英文 Lesson 1 / Lesson 2
社會地理第1章 / 第2章
```

未來 validator 應能檢查：

```text
catalog ready=true
→ bank 必須存在

bank 已存在
→ catalog 不應仍標示未建
```

如果採 manifest 後，此問題可以自然消失。

---

# 20. P2：README 動態資訊減量

README 應繼續保存：

```text
大架構
authority
工作原則
重大完成里程碑
```

應逐步避免：

```text
某一章精確題數
某一回現在 ready 幾回
短期工作清單
容易一兩天就過期的進度
```

動態資訊應轉到：

```text
manifest
subject database MD
catalog
實際 JSON
```

如此 README 才能長期保持可信。

---

# 21. P2：Android 文件拆分

目前 `Android學生機設計.MD` 同時包含：

```text
Student Exam App
WebView
Kiosk
GitHub Token
早期學習歷程規劃
SM-T220
Kernel
Wacom
Magisk
LSPosed
Device Owner
Debloat
CPU/GPU tuning
```

長期建議拆成：

```text
Android學生機設計.MD
→ App / Kiosk / WebView / Student Exam 操作

Android_SM-T220_SYSTEM_RUNBOOK.md
→ bootloader / kernel / Wacom / Magisk / LSPosed
→ Device Owner / debloat / performance
```

並在舊的 GitHub Record 學習歷程章節註明：

```text
Superseded by LEARNING_HISTORY_FIREBASE.md
```

---

# 22. P2：英文資料庫整理

英文目前資料量大，已經需要獨立治理。

持續目標：

```text
Drive 第十一、十二回歸位
清理重複第十回
整理 vocabulary PDF / XLSX / SQL
第六～十二回逐步轉為 GitHub JSON
registry 與實際 coverage 同步
```

原則：

```text
Drive 校正版 = 閱讀文字 authority
structured vocabulary source = 字彙 authority
GitHub JSON = 可作答衍生資料
```

---

# 23. P2：教材 Canonical → Machine-readable Curriculum

目前 canonical 多為人類可讀文件。

長期 AI 與自動出題要更穩定，應逐步建立：

```text
canonical Google Doc
        ↓
machine-readable curriculum
        ↓
concept IDs
learning objectives
misconceptions
question types
AI context
```

不要直接讓 AI 每次從長篇自由文字重新推論章節結構。

Machine-readable curriculum 應由 canonical 衍生，不可反向取代 canonical。

---

# 24. P2：題庫可追溯性

未來每一道正式來源題目，都應先能穩定回答：

```text
這是哪一道永久題目？ → questionId
學生當時看到哪一版？ → revision
這題從哪裡來？
哪一份考卷？
原題號？
答案來源？
是否核對？
屬於哪個章節？
為什麼歸到這個章節？
```

尤其 school-exam：

```text
school
year
exam
originalQuestionNumber
sourceFile
answerFile
answerVerified
chapterTags
conceptIds
```

應逐步成為最低標準。

---

# 25. P2：自動化 Smoke Test

除了 validator，未來可加入簡單 runtime smoke test。

至少驗證：

```text
首頁可建立
五科入口存在
歷屆入口存在
社會 → 地理／歷史／公民可進入
ready bank 可以 load
返回鍵可逐層返回
同一入口可以反覆進出
```

特別防止：

```text
MutationObserver loop
duplicate click handler
stale disabled state
history navigation 卡死
```

---

# 26. 安全與隱私目標

## GitHub

```text
Token 不入 repo
fine-grained PAT 最小權限
legacy PAT path 逐步減少
```

## Firebase

```text
真正 authorization 由 Rules 控制
前端 UI 隱藏不是安全機制
App Check 繼續保留
管理員預設只讀
```

## Public repository

定期掃描：

```text
PAT
Gemini server key
private URL
不必要 email
private Drive identifier
不必要 Apps Script endpoint
```

公開 Firebase Web config 本身不等於 server secret，但 backend rules 必須正確。

---

# 27. 專案目錄未來建議

目前不急著搬檔。

先完成：

```text
validator
manifest
schema
module inventory
```

之後才考慮較大的 directory refactor。

可能的長期結構：

```text
Exam/
├─ docs/
│  ├─ workflows/
│  ├─ architecture/
│  └─ runbooks/
├─ catalog/
├─ chapter-bank/
├─ past-exams/
├─ assets/
├─ scripts/
├─ src/
└─ .github/
```

但在沒有 automated validation 前，不做大搬家。

---

# 28. 建議實施順序

## Phase 0：永久 Question Identity 地基 ✅

```text
[x] 正式固定題庫全科盤點
[x] 2,159 題建立永久 question identity
[x] 既有 handwriting legacy ID 保留
[x] 正式題建立 revision: 1
[x] GEPT Vocabulary 維持 vocabId domain identity
[x] 題庫治理採 append-only
```

這一階段已完成。後續任何 schema、registry、Firebase history 或 UI 工作，都不得重新編排既有 `questionId`。

## Phase 1：先讓 repository 不容易壞

```text
[ ] Repo Health Check v1
[ ] deployment 前執行 validator
[ ] JSON / answer / path / asset 基本檢查
[ ] 明確 error / warning
```

## Phase 2：建立單一狀態 authority

```text
[ ] 設計 curriculum / bank manifest
[ ] catalog readiness 由 manifest 控制
[ ] 移除新產生的 runtime readiness patch
[ ] catalog 與 chapter-bank 自動比對
```

## Phase 3：Schema 收斂

```text
[ ] 定義新 schemaVersion
[ ] 新題庫全面使用
[ ] 舊資料保持 compatibility
[ ] 分批 migration
```

## Phase 4：模組與 workflow 清理

```text
[ ] MODULE_INVENTORY
[ ] 標示 ACTIVE / LEGACY / DEPRECATED
[ ] 清理 one-shot workflow
[ ] deployment workflow 減少產品邏輯
```

## Phase 5：文件治理

```text
[ ] 更新各科 catalog 漂移
[ ] textbook workflow 移除易過期 live status
[ ] Android 舊學習歷程標 superseded
[ ] collection MD 明確標 history snapshot
```

## Phase 6：內容持續建置

```text
[ ] 各科 canonical
[ ] 自編三級題庫
[ ] 各校段考
[ ] 正式歷屆
[ ] 英文 GEPT 第六～十二回
[ ] machine-readable curriculum
```

## Phase 7：作答歷程回溯與錯誤紀錄導航

第一步先把已完成的永久 question identity 接進 Firebase attempt。

```text
[ ] 正式以 exam:submitted 完成後建立 attempt
[ ] answers[] 保存 questionId / questionRevision
[ ] attempt 保存 presentedQuestionIds[]
[ ] 選擇題保存 canonical option identity
[ ] handwriting 保存 correct / incorrect / unclear / unanswered
[ ] unclear 不計入 learner wrongCount
[ ] 考卷加入「回溯」功能
[ ] 每題顯示累積作答次數 / 錯誤次數 / 上次結果
[ ] chapter / lesson weakness aggregation
[ ] 最近分數／錯題／作答時間
[ ] NEEDS_REVIEW / MASTERED 狀態
[ ] 我的學習歷程加入「建議複習」
[ ] lifetime average 與 recent trend 分離
```

回溯不是獨立附加功能，而是 Learner State 從「整份考卷成績」進化到「永久題目層歷史」的第一步。

## Phase 8：Knowledge / Question Registry

```text
[ ] Concept Registry
[ ] Question Registry
[ ] Asset Registry
[ ] 各來源題目 concept mapping
[ ] 圖題／題組一級資料模型
```

## Phase 9：智慧選題

```text
[ ] Review Priority
[ ] spaced review
[ ] 類比題推薦
[ ] 真實段考／歷屆題混合
[ ] concept-level mastery
[ ] misconception-level reinforcement
```

---

# 29. Definition of Done

未來可以把「Exam 架構穩定第一階段」定義為：

```text
0. 正式題目已有永久 questionId / revision                    ✅ 已完成
1. 新 bank 有統一 schemaVersion
2. 所有 deploy 前會自動 validator
3. manifest 是 readiness 的單一 authority
4. catalog 不需要 runtime patch 才知道章節可不可用
5. legacy module 都有明確標記
6. one-shot workflow 不再殘留
7. README 不保存容易快速過期的細節
8. 各專門 MD 的 authority 清楚
9. Firebase 與 Exam-Record 分工固定
10. 新對話可以只靠 README + 專門 authority 文件安全接手
```

達到以上狀態後，再做大規模目錄整理會安全很多。

---

# 30. 目前最推薦的下一步

目前要區分「已完成地基」、「學習功能主線」與「工程安全網」。

## 30.1 已完成地基

```text
正式固定題庫
→ 2,159 題 permanent questionId
→ revision
→ append-only governance
```

因此現在不再需要先解決「同一題到底是不是同一題」；這個最重要的 identity 問題已經有正式答案。

## 30.2 學習功能主線：先把 identity 接進 Firebase 回溯

目前最值得往前推的學習功能是：

> **作答歷程回溯 → 每題歷史 → 錯誤導航 → 智慧複習。**

建議順序：

```text
exam:submitted
↓
attempt answers[] 保存 questionId / revision
↓
presentedQuestionIds[]
↓
canonical option / handwriting result
↓
同一 examKey 的歷次 Firebase attempts
↓
回溯前一次作答
↓
每題累積：作答幾次 / 錯幾次 / 上次結果
↓
chapter / lesson weakness
↓
concept-level weakness
↓
adaptive review
```

這條主線不需要等待所有 Concept Registry 或 manifest 都完成才開始。

## 30.3 工程安全網：Repo Health Check v1

與學習功能主線平行，工程面仍應盡快建立：

> **Repo Health Check v1。**

原因：

```text
題庫已超過兩千題
正式 identity 已成為長期資料資產
題庫仍會快速增加
多科、多 schema、多 asset、多 module
```

validator 應優先守住：

```text
questionId uniqueness
revision
JSON parse
answer index
asset path
bank path
正式題必要欄位
```

接著再逐步進行：

```text
manifest
→ schema 收斂
→ Concept / Question / Asset Registry
→ module / workflow cleanup
```

因此目前不是一條單線 roadmap，而是兩條並行：

```text
學習功能：
questionId → Firebase recall → weakness → adaptive review

工程治理：
validator → manifest → schema / registry → cleanup
```

兩條線共享同一個已完成地基：**永久 question identity。**

---

# 31. 長期目標

最終希望 Exam 形成完整閉環：

```text
Google Drive
教材 evidence / canonical
        ↓
Knowledge Layer
Concept Registry
        ↓
Question Layer
Question Registry / Asset Registry
永久 questionId / revision
        ↓
GitHub Exam
validated structured question banks
        ↓
學生作答
        ↓
Firebase attempts
questionId-based answer history
        ↓
回溯 / 每題歷史統計
        ↓
Firebase Learner State
        ↓
錯誤紀錄導航
        ↓
Mastery / Misconception
        ↓
智慧選題 / 類比練習 / spaced review
        ↓
再次作答
        └──────────────→ 回到 Learner State
```

最終系統不是回答：

> 「還有多少題沒做？」

而是回答：

> **「現在最值得做哪幾題？」**

同時仍保持：

```text
資料可追溯
答案可核對
教材不亂猜
不同來源不混淆
錯誤可以被修復
掌握程度可以重新評估
架構可維護
學生介面簡單
新資料可以持續加入
```

這是目前 Exam 專案未來整建與 AI 化的主要藍圖。
