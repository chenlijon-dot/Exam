# Exam Project Blueprint

> 專案架構治理、技術債整理與未來工作藍圖。
>
> 建立日期：2026-09-20
>
> 本文件不是即時題數、章節 ready 狀態或教材內容的最高 authority。  
> 即時現況仍以 `README.md`、各專門 authority 文件、`curriculum-catalog/`、`chapter-bank/` 與實際程式資料為準。
>
> 本文件回答的是：
>
> **「目前系統還有哪些地方值得整理？接下來要往什麼方向做？」**

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
還有哪些技術債
哪些地方需要收斂
未來優先工作是什麼
完成到什麼程度才算穩定
```

因此：

```text
README = 現況與總憲法
BLUEPRINT = 未來方向與整建計畫
各專門 MD = 個別領域 authority
實際 JSON / JS / catalog / Drive = 真正資料來源
```

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

# 4. P0：Repository Health Check

這是目前最值得優先建立的工程基礎。

目標：

> 在 GitHub Pages deployment 前，自動抓出會讓網站壞掉的資料錯誤。

建議新增：

```text
scripts/
└─ validate_exam_repo.py
```

或類似 validator。

## 4.1 第一版至少檢查

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

### 重複

```text
同一 bank 是否有重複 stable key
school + year + originalQuestionNumber 是否重複
```

### metadata

```text
school-exam provenance 是否完整
sourceType 是否合理
preserveOptionOrder 是否符合來源類型
```

## 4.2 Error / Warning 分級

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

# 5. P0：建立單一 Curriculum / Bank Manifest

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

# 6. P1：題庫 Schema 收斂

目前 chapter-bank 已經存在多個世代的資料格式。

這不是錯，但新資料應逐步統一。

## 6.1 建議正式欄位

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
id
q
o
a
explanation
conceptIds
sourceType
originalQuestionNumber
preserveOptionOrder
```

特殊題型則明確用：

```text
manual-study
groupId
images
officialDisposition
pendingQuestions
```

## 6.2 不一次硬轉全部舊資料

策略應是：

```text
舊資料保持相容
新資料全部走新 schema
validator 先 warning
逐批 migration
最後才提高要求
```

---

# 7. P1：Module Inventory

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

# 8. P1：Deployment Workflow 收斂

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

## 8.1 應保留

```text
build SHA
deployment timestamp
artifact upload
Pages deploy
validation
```

## 8.2 應逐步搬回 source

```text
功能性 script 注入
ready 狀態
legacy module workaround
產品邏輯 patch
```

---

# 9. P1：清理 One-shot / Legacy Workflow

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

# 10. P1：Firebase / Exam-Record 邊界固定

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

# 11. P1：Catalog 與實際 Bank 自動比對

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

# 12. P2：README 動態資訊減量

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

# 13. P2：Android 文件拆分

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

# 14. P2：英文資料庫整理

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

# 15. P2：教材 Canonical → Machine-readable Curriculum

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

# 16. P2：題庫可追溯性

未來每一道正式來源題目，都應能回答：

```text
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

# 17. P2：自動化 Smoke Test

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

# 18. 安全與隱私目標

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

# 19. 專案目錄未來建議

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

# 20. 建議實施順序

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

---

# 21. Definition of Done

未來可以把「Exam 架構穩定第一階段」定義為：

```text
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

# 22. 目前最推薦的下一步

如果只選一件事：

> **先建立 Repo Health Check v1。**

原因：

```text
現在資料量已經夠大
題庫會持續快速增加
多科、多 schema、多 asset、多 module
```

此時先建立 validator，等於先裝安全網。

完成 validator 後，再進行：

```text
manifest
→ schema 收斂
→ module cleanup
→ directory refactor
```

會安全得多。

---

# 23. 長期目標

最終希望 Exam 變成：

```text
教材 evidence
        ↓
canonical knowledge
        ↓
machine-readable curriculum
        ↓
structured question banks
        ↓
validated repository
        ↓
web learning
        ↓
Firebase learning history
        ↓
AI diagnosis / adaptive practice
```

同時仍保持：

```text
資料可追溯
答案可核對
教材不亂猜
架構可維護
學生介面簡單
新資料可以持續加入
```

這是目前 Exam 專案未來整建與擴充的主要藍圖。
