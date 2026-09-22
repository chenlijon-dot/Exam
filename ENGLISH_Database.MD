# ENGLISH_Database 英文科知識庫建立準則

> 英文資料庫結構、authority、Google Drive 現況與 GitHub 對接說明  
> 最後盤點：2026-09-22

本文件記錄目前 `Exam` 專案的英文資料庫結構，重點是讓後續整理、OCR 校正、題庫轉換與前端建置都有固定 authority，不再只靠對話記憶判斷資料放在哪裡。

本文件應搭配：

- [`TEXTBOOK_COLLECTION_WORKFLOW.md`](./TEXTBOOK_COLLECTION_WORKFLOW.md)
- [`EXAM_WORKFLOW.md`](./EXAM_WORKFLOW.md)

---

## 1. 核心原則

英文資料目前分成兩條主要資料線：

1. **GEPT 初級字彙資料庫**
2. **GEPT 初級閱讀能力題庫／教材知識庫**

兩條資料線的 authority 不完全相同，不應強行共用單一階層。

### 1.1 閱讀題庫 authority

```text
實體教材／正式解答頁／實體書照片
        ↓
OCR + 人工校正
        ↓
每回「原始文字校正版」Google Doc
        ↓
canonical 閱讀教材知識庫
        ↓
GitHub JSON / 前端題庫
```

閱讀題庫的優先順序：

| 層級 | Authority | 用途 |
|---|---|---|
| 1 | 實體教材、正式解答頁、原始照片 | 最終來源 evidence、答案核對 |
| 2 | 人工校正後的「原始文字校正版」Google Doc | 英文題庫文字 authority |
| 3 | canonical 閱讀教材知識庫 | 教學概念、文法、字彙、題型與 concept ID 整理 |
| 4 | GitHub JSON | 網站可作答題庫；屬衍生資料，不是原始 authority |
| 5 | 模型記憶 | 只能輔助，不可覆蓋教材 evidence |

英文題庫尤其遵守：

```text
照片 → OCR → 人工校正 → Google Doc → JSON
```

不可直接由未校正 OCR 產生網站題庫。

### 1.2 字彙資料庫 authority

```text
正式來源 PDF
    ↓
欄位解析／人工校正
    ↓
XLSX / SQL canonical structured data
    ↓
查詢、出題、後端匯入、其他 deployment artifacts
```

字彙線不需要先經過「閱讀教材知識庫」才能成為正式 authority。

目前 primary structured authority 為：

```text
GEPT_beginner_vocabulary_database.xlsx
GEPT_beginner_vocabulary.sql
```

SQLite `.db` 若日後由上述資料產生，視為可再生成的 deployment artifact，不作為 primary authority，避免 XLSX / SQL / DB 三份各自修改造成漂移。

---

# 2. Google Drive 現行目錄

目前正式英文主樹如下：

```text
英文/
└─ 全民英檢/
   └─ 初級/
      ├─ GEPT_beginner_vocabulary_database.xlsx
      ├─ GEPT_beginner_vocabulary.sql
      └─ 閱讀/
         ├─ 原始資料/
         └─ 整理資料/
```

其中：

```text
閱讀/原始資料/
```

主要放每一回「原始文字校正版」Google Doc。

```text
閱讀/整理資料/
```

目前放單一 canonical：

```text
英文_GEPT初級_閱讀能力_教材知識庫
```

這份 canonical 不應建立 v2 / final / new 等平行版本；新資料持續合併回同一份。

---

# 3. GEPT 初級字彙資料庫

## 3.1 目前正式檔案

`英文/全民英檢/初級/` 目前有：

```text
GEPT_beginner_vocabulary_database.xlsx
GEPT_beginner_vocabulary.sql
```

另有原始來源：

```text
GEPT_beginner_vocabulary_source_2026-04-29.pdf
```

目前來源 PDF 尚位於 Drive 上層／根目錄，沒有和 XLSX / SQL 一起收進正式英文資料夾；這是待整理項目。

另外 Drive 根目錄仍有一份較早建立、同名的：

```text
GEPT_beginner_vocabulary_database.xlsx
```

正式結構內的 `英文/全民英檢/初級/GEPT_beginner_vocabulary_database.xlsx` 應視為目前整理後的位置；根目錄同名檔屬重複／待清理候選。

## 3.2 SQL 結構

SQL table：

```sql
gept_beginner_vocab
```

欄位：

| 欄位 | 意義 |
|---|---|
| `id` | 主鍵 |
| `word` | 原始字彙 |
| `word_norm` | 正規化查詢字串 |
| `part_of_speech` | 詞性 |
| `chinese` | 中文義 |
| `note` | 補充說明、拼法／用法註記 |
| `level` | GEPT 級別，目前為初級 |
| `academic_vocab` | 學術字彙標記，如 L1、L2、L7 等 |
| `source_page` | 原始來源頁碼 |

目前結構化資料共：

```text
2,397 筆 vocabulary records
2,216 個 distinct word forms
```

`2,397` 是「詞性／義項 record 數」，不是 2,397 個互不重複單字。

並建立索引：

```sql
idx_vocab_word      → word_norm
idx_vocab_pos       → part_of_speech
idx_vocab_academic  → academic_vocab
```

### 重要資料特性

同一個 `word_norm` 可以有多筆資料，因為同一字可能有：

- 不同詞性
- 不同義項
- 不同用法

因此：

```text
id 是 record key
word_norm 是 lookup key，不應設定 UNIQUE
```

`source_page` 必須保留，方便將結構化資料追回原始 PDF。

---

# 4. GEPT 初級閱讀資料庫

## 4.1 Canonical 範圍

目前 Google Drive canonical 已確認：

```text
全民英檢初級｜閱讀能力測驗
第一回 ～ 第十二回
每回 Q1–35 完整
```

固定題型：

```text
第一部分：詞彙和結構   Q1–15
第二部分：段落填空     Q16–25
第三部分：閱讀理解     Q26–35
```

每回：

```text
35 題
作答時間 35 分鐘
```

來源教材：

```text
萬事通 智能碼書《國中英文 全民英檢攻略 全》
```

## 4.2 各回頁碼與目前資料狀態

| 回次 | 原書頁碼 | 辨識資料 | Drive 正式資料夾 | GitHub 可作答 JSON |
|---|---:|---|---|---|
| 第一回 | p.1–9 | Q1–35 完整 | 已在 `閱讀/原始資料` | 已有 `round-01.json` |
| 第二回 | p.11–18 | Q1–35 完整 | 已在 `閱讀/原始資料` | 已有 `round-02.json` + `round-02-q07-15.json` |
| 第三回 | p.19–26 | Q1–35 完整 | 已在 `閱讀/原始資料` | 已有 `round-03.json` |
| 第四回 | p.27–34 | Q1–35 完整 | 已在 `閱讀/原始資料` | 已有 `round-04.json` |
| 第五回 | p.35–42 | Q1–35 完整 | 已在 `閱讀/原始資料` | 已有 `round-05.json` |
| 第六回 | p.43–51 | Q1–35 完整 | 已在 `閱讀/原始資料` | 已有 `round-06.json` |
| 第七回 | p.53–60 | Q1–35 完整 | 已在 `閱讀/原始資料` | 已有 `round-07.json` |
| 第八回 | p.61–68 | Q1–35 完整 | 已在 `閱讀/原始資料` | 已有 `round-08.json` |
| 第九回 | p.69–76 | Q1–35 完整 | 已在 `閱讀/原始資料` | 已有 `round-09.json` |
| 第十回 | p.77–84 | Q1–35 完整 | 已在 `閱讀/原始資料` | 已有 `round-10.json`，正式答案已核對 |
| 第十一回 | p.85–92 | Q1–35 完整 | **目前仍在 Drive 上層／根目錄** | 尚未建置 |
| 第十二回 | p.93–101 | Q1–35 完整 | **目前仍在 Drive 上層／根目錄** | 尚未建置 |

因此「資料已辨識」與「網站已上線」必須分開看：

```text
Google Drive source coverage = 第一～十二回完整
GitHub online JSON coverage    = 第一～十一回完整
```

目前 `exam-english-gept.js` registry 僅列出第一～第六回：

```text
第一～十一回：ready=true
第十二回：尚未註冊
```

所以前端狀態落後於 Drive authority。

---

# 5. 每回「原始文字校正版」的角色

命名規則：

```text
萬事通_全民英檢初級_閱讀能力測驗_第X回_原始文字校正版
```

這些 Google Doc 是英文題庫的主要文字 authority。

必須保留：

- 原題號
- 原選項 A/B/C/D 順序
- 段落填空共用文章
- 閱讀題組共用文章
- 表格／時刻表／公告的文字關係
- 圖片型題目的必要位置註記
- 金額、時間、百分比、刪除價等特殊資訊
- OCR 不確定處的註記

不得為了「讓英文看起來比較順」而自行改寫原題。

### 第十～十二回答案

目前 canonical 明確記錄：

```text
第十、十一、十二回原書解答頁已取得
```

第十回完整校正版已依官方／教材解答頁逐題核對，可使用：

```text
answerVerified: true
```

第十一、十二回辨識檔目前含答案欄位；是否可標：

```text
answerVerified: true
```

仍以正式解答頁 evidence 的逐題核對紀錄為準。不可只因辨識檔已有答案文字，就自動等同「正式答案已驗證」。

其餘回次如要標 `answerVerified: true`，亦應以該回正式解答 evidence 為準，不因模型推理解出答案就視為官方答案。

---

# 6. Canonical 教材知識庫

Google Drive：

```text
閱讀/整理資料/
└─ 英文_GEPT初級_閱讀能力_教材知識庫
```

目前 canonical 已整併第一～十二回，內容包含：

- 詞彙語意
- 慣用語與固定搭配
- 文法結構
- 段落填空能力
- 閱讀理解能力
- 高頻詞彙／片語
- 閱讀策略
- 常見迷思
- 考試重點
- concept ID 候選
- 各回新增能力點與文本型態

canonical 的用途是「教學與分類」，不是用來取代原始題文。

也就是：

```text
要查原題 → 看各回原始文字校正版
要查觀念 → 看 canonical 教材知識庫
要查網站題 → 看 GitHub JSON
```

---

# 7. GitHub 題庫資料層

目前路徑：

```text
chapter-bank/english/gept/elementary/reading/
```

現有：

```text
round-01.json
round-02.json
round-02-q07-15.json
round-03.json
round-04.json
round-05.json
round-06.json
round-07.json
round-08.json
round-09.json
round-10.json
round-11.json
```

前端入口：

```text
exam-english-gept.js
```

目前 JSON schema 的主要欄位：

```text
schemaVersion
exam
questions[]
```

`exam` 常用欄位：

```text
key
examType
subject
title
subtitle
unit
difficulty
scoreMode
preserveOptionOrder
analysisEligible
sourceNote
```

單題常用欄位：

```text
number
section
q
o
a
fixedOptions
conceptIds
e
```

題組另外使用：

```text
groupId
introLabel
intro
```

### 題組規則

Q16–20、Q21–25、閱讀文章等共用內容：

```text
文章只存一次
後續題目用 groupId 共用
```

前端顯示時提供「題組內容」視窗，不要讓學生每題重複看一整篇相同文章。

---

# 8. 英文資料流

## 8.1 閱讀題庫

```text
實體書照片
  ↓
逐頁 OCR
  ↓
人工校正
  ↓
每回「原始文字校正版」Google Doc
  ↓
整併 canonical 教材知識庫
  ↓
建立 GitHub round-XX.json
  ↓
逐題詳解 + conceptIds + groupId
  ↓
exam-english-gept.js 上線
```

## 8.2 字彙資料庫

```text
GEPT beginner vocabulary source PDF
  ↓
欄位解析／校正
  ↓
GEPT_beginner_vocabulary_database.xlsx
  ↓
GEPT_beginner_vocabulary.sql
  ↓
未來單字查詢／出題／後端匯入
```

XLSX 與 SQL 應由同一份校正後資料生成；SQLite `.db` 或其他格式原則上由 primary structured authority 再生，不反向成為唯一來源。

---

# 9. 目前發現的 Drive 結構漂移

以下不是內容缺失，而是「檔案位置／重複檔」問題。

## 9.1 第十回有兩份同名 Google Doc

目前 Drive 有：

1. `閱讀/原始資料` 內的完整第十回校正版
2. Drive 上層／根目錄的一份較早第十回同名文件

正式 authority 應以：

```text
閱讀/原始資料/萬事通_全民英檢初級_閱讀能力測驗_第十回_原始文字校正版
```

為主。

舊版不應再被後續流程誤抓成 canonical source。

## 9.2 第十一、十二回尚未歸位

兩份辨識資料已完整，但目前不在：

```text
閱讀/原始資料/
```

後續應搬入同一資料夾，讓第一～十二回在單一位置可被完整列舉。

## 9.3 字彙來源與重複 XLSX 尚未歸位

Drive 根目錄目前仍有：

```text
GEPT_beginner_vocabulary_source_2026-04-29.pdf
GEPT_beginner_vocabulary_database.xlsx   ← 舊／重複副本
```

而正式英文資料夾已有：

```text
英文/全民英檢/初級/
├─ GEPT_beginner_vocabulary_database.xlsx
└─ GEPT_beginner_vocabulary.sql
```

建議未來改成：

```text
初級/
├─ 字彙/
│  ├─ 原始資料/
│  │  └─ GEPT_beginner_vocabulary_source_2026-04-29.pdf
│  └─ 整理資料/
│     ├─ GEPT_beginner_vocabulary_database.xlsx
│     └─ GEPT_beginner_vocabulary.sql
└─ 閱讀/
   ├─ 原始資料/
   └─ 整理資料/
```

這樣字彙與閱讀就使用同一套「原始資料／整理資料」邏輯。

## 9.4 原始照片目前未形成 Drive 影像 archive

目前 `閱讀/原始資料` 實際主要是校正後 Google Doc；翻拍照片仍以對話上傳 evidence 為主，Drive 內沒有逐回完整照片資料夾。

若未來需要長期可追溯 archive，可增加：

```text
閱讀/原始資料/
├─ 第01回_照片/
├─ 第02回_照片/
...
└─ 第12回_照片/
```

但對「文字型題庫」而言，依現行 workflow，人工校正 Google Doc 仍是主要題庫 authority。

---

# 10. 建議的最終穩定結構

```text
英文/
└─ 全民英檢/
   └─ 初級/
      ├─ 字彙/
      │  ├─ 原始資料/
      │  │  └─ GEPT_beginner_vocabulary_source_2026-04-29.pdf
      │  └─ 整理資料/
      │     ├─ GEPT_beginner_vocabulary_database.xlsx
      │     └─ GEPT_beginner_vocabulary.sql
      │
      └─ 閱讀/
         ├─ 原始資料/
         │  ├─ 第01回 原始文字校正版
         │  ├─ 第02回 原始文字校正版
         │  ├─ ...
         │  └─ 第12回 原始文字校正版
         │
         └─ 整理資料/
            └─ 英文_GEPT初級_閱讀能力_教材知識庫
```

GitHub 對應：

```text
chapter-bank/english/gept/elementary/reading/
├─ round-01.json
├─ round-02.json
├─ ...
└─ round-12.json
```

---

# 11. 後續工作優先順序

目前建議依序處理：

1. 把第十一、十二回移入 `閱讀/原始資料`。
2. 將舊第十回同名副本標記／移除，避免誤抓。
3. 建立 `初級/字彙/原始資料` 與 `整理資料`，將 PDF、XLSX、SQL 歸位。
4. 確認根目錄舊 vocabulary XLSX 後再移除重複副本。
5. 將第十二回依校正版轉為 GitHub JSON。
6. 更新 `exam-english-gept.js`，讓前端由「第一～六回」同步到實際可用回次。
7. 每次新增英文資料後，同步更新本 `ENGLISH_Database.MD` 的 coverage 與 known drift。

---

# 12. 維護檢查表

新增英文題庫資料時：

```text
[ ] 是否先查 Drive 已有資料？
[ ] 是否回到同一份原始文字校正版更新？
[ ] 題號是否連續？
[ ] A/B/C/D 順序是否與原書一致？
[ ] 題組文章是否只存一次？
[ ] 圖表／時刻表／廣告是否保留視覺語意？
[ ] 缺頁是否明確標示而沒有自行補題？
[ ] 官方解答是否有 evidence？
[ ] answerVerified 是否只在正式核對後設 true？
[ ] canonical 是否只維護一份？
[ ] GitHub JSON 是否由校正版衍生？
[ ] conceptIds 是否沿用既有命名？
[ ] 前端 round registry 是否同步更新？
```

新增字彙資料時：

```text
[ ] word 與 word_norm 是否分開？
[ ] 同字不同詞性／義項是否保留多筆？
[ ] source_page 是否保留？
[ ] academic_vocab 標記是否保留？
[ ] XLSX 與 SQL 是否由同一份校正資料生成？
[ ] 是否明確區分 primary authority 與可再生成的 .db / deployment artifact？
[ ] 是否避免在 Drive 根目錄產生另一份無 authority 的副本？
```

---

## 一句話總結

目前英文資料庫的真正基礎已經是：

```text
GEPT 初級字彙 2,397 筆 records / 2,216 個 distinct word forms
+
GEPT 初級閱讀第一～十二回完整辨識資料
+
單一 canonical 閱讀教材知識庫
+
GitHub 第一～十一回可作答 JSON
```

後續工作的重點已不是重新辨識舊資料，而是：**整理 Drive authority、消除重複檔、把第十二回穩定轉成 GitHub 題庫。**
