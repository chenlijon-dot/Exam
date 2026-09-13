# 國中線上題庫 Exam

> 專案狀態、資料規格與工作流程文件。後續新增科目、學期、章節、題庫、歷屆試題、教材參考資料、錯題診斷或資料結構時，請同步更新本 README。
>
> 最後更新：2026-09-13

## 1. 專案目標

這個專案要逐步建立一套可在手機與電腦使用的「國中線上題庫 + 教材參考知識庫」。

主要方向：

- 一般題庫依「科目 → 年級／學期 → 章節 → 難度」進入。
- 主選單另外提供「歷屆考題」，整理國中基測／教育會考歷屆試題。
- 一般章節題庫可建立簡易、中等、困難等不同層級題目。
- 作答後立即判定答案，可顯示正確答案與詳解。
- 保存作答紀錄與錯題，供後續複習。
- 一般章節錯題可交由 AI 依「該章課文知識基準」分析真正的弱點。
- 歷屆考題保留原始題號、選項順序、題組脈絡與必要附圖，不因目前課綱而改寫原題。
- Google Drive 作為原始教材與長期參考資料庫；GitHub 不負責大量保存課本掃描原檔。
- GitHub `Exam` 保存網站與可執行題庫資料；私人 `Exam-Record` 保存作答資料與 AI curriculum。
- 題庫內容、教材原始資料、私人學習紀錄三者分層管理。

---

## 2. 目前網站入口流程

```text
國中題庫
│
├─ 國文　（六個學期入口已建立，章節待教材確認）
│  ├─ 七年級上學期／一上
│  ├─ 七年級下學期／一下
│  ├─ 八年級上學期／二上
│  ├─ 八年級下學期／二下
│  ├─ 九年級上學期／三上
│  └─ 九年級下學期／三下
│
├─ 英文　（建置中）
├─ 數學　（建置中）
│
├─ 自然
│  └─ 七年級上學期／一上
│     └─ 第 1 章 科學方法
│        ├─ 簡易：20 題
│        ├─ 中等：20 題
│        └─ 困難：20 題
│
├─ 社會　（建置中）
│
└─ 歷屆考題
   ├─ 國中基本學力測驗（基測）
   │  └─ 90 年度
   │     ├─ 第一次
   │     │  ├─ 國文科：46 題　✅
   │     │  ├─ 英文科　（待匯入）
   │     │  ├─ 數學科　（待匯入）
   │     │  ├─ 自然科　（待匯入）
   │     │  └─ 社會科　（待匯入）
   │     │
   │     └─ 第二次
   │        ├─ 國文科：47 題　✅
   │        ├─ 英文科　（待匯入）
   │        ├─ 數學科　（待匯入）
   │        ├─ 自然科　（待匯入）
   │        └─ 社會科　（待匯入）
   │
   └─ 國中教育會考　（待匯入）
```

### 章節名稱原則

一般題庫必須先取得實際課本／講義，再建立課次與章節。不要憑印象一次補滿所有出版社或年級內容。

### 歷屆年份原則

目標是逐步整理約 15 年的可核對歷屆試題，但不先硬寫死年度範圍。舊制基測與教育會考跨制度，應依實際取得且能核對的試卷逐年建置。

目前正式可作答的歷屆國文試卷：

```text
90 年第一次基測國文：46 題
90 年第二次基測國文：47 題
```

---

## 3. 科目、章節與歷屆題分類規則

### 一般題庫

```text
科目
└─ 年級／學期
   └─ 章節
      └─ 題庫難度
         └─ 題目
```

目前五大科目：國文、英文、數學、自然、社會。

### 歷屆考題

```text
歷屆考題
└─ 考試制度
   └─ 年度
      └─ 次別（若該制度有多次測驗）
         └─ 科目
            └─ 題目
```

目前考試制度：

```text
國中基本學力測驗（基測）
國中教育會考
```

歷屆題不可強迫塞進單一現行課文章節。若之後要做跨年度弱點分析，應額外加入 chapter tag／concept ID，不改動原題。

---

## 4. 已完成：自然一上「科學方法」題庫

```text
自然
└─ 七年級上學期（一上）
   └─ 第 1 章 科學方法
      ├─ 簡易：20 題
      ├─ 中等：20 題
      └─ 困難：20 題
```

每題 5 分，滿分 100 分。

題型由基本記憶、概念理解逐步進入情境應用、資料判讀與實驗設計判斷。

---

## 5. 已完成：90 年度基測國文歷屆題

### 第一次

```text
90 年度
└─ 第一次
   └─ 國文科：46 題
```

資料：

```text
past-exams/bct/90/first/chinese.json
```

圖題資產：

```text
past-exams/bct/90/first/assets/q29-calligraphy.svg
past-exams/bct/90/first/assets/q30-letter.svg
```

### 第二次

```text
90 年度
└─ 第二次
   └─ 國文科：47 題
```

題型結構：

```text
第 1～34 題：單題
第 35～47 題：題組
```

資料：

```text
past-exams/bct/90/second/chinese.json
```

圖題資產：

```text
past-exams/bct/90/second/assets/q31-invitation.svg
past-exams/bct/90/second/assets/q34-letter.svg
```

### 歷屆題共同支援

- 保留正式題號。
- 保留原始 A／B／C／D 選項順序。
- 支援單題與題組文章。
- 支援題目附圖。
- 可交卷、標示答對／答錯、顯示答案與詳解欄位。
- 可重新作答。
- 可返回該年度／次別的科目頁。

---

## 6. 評量、作答紀錄與錯題規則

### 一般章節題庫

- 可依題庫設計使用簡易／中等／困難。
- 選項可隨機排列，正確答案必須同步重新定位。
- 科學方法目前為每題 5 分、滿分 100 分。

### 歷屆考題

歷屆題不用一般模擬考的分數制，而以正確題目比率呈現：

```text
答對題數 / 總題數
正確率 %
答錯題數
未答題數
```

例如：

```text
答對 37 / 46 題
正確率 80.4%
答錯 9 題
未答 0 題
```

不可因一般題庫每題 5 分，就將 46 題、47 題或其他題數的歷屆試卷硬換算為同一種分數。

### 選項順序

一般題庫：可重新排列。

歷屆題：預設固定原始順序。

```text
preserveOptionOrder: true
fixedOptions: true
```

### 作答紀錄

```text
practice   → 一般章節題庫
past-exam  → 歷屆考題
```

歷屆紀錄應至少保存：

- 考試制度
- 年度
- 次別
- 科目
- 原始題號
- 選答與正答
- 答對／答錯／未答
- 答對題數／總題數
- 正確率
- 作答時間

### 錯題複習

- 只記錄「有作答但答錯」。
- 未作答不列入錯題。
- 歷屆錯題保留年度／次別／科目／原始題號。
- 題組題保存必要文章上下文。
- 圖題保存圖片路徑，錯題回顧時重新顯示圖片。
- 同一題可累積錯誤次數。

---

## 7. AI 錯題診斷

目前 AI 錯題分析使用 Google Gemini，正式建立 curriculum-based 診斷的章節為：

```text
自然一上 → 科學方法
Exam-Record/curriculum/science-method.json
```

目前後端模型：

```text
gemini-3.5-flash-lite
```

### 歷屆題 AI 狀態

歷屆題已進入作答紀錄與錯題系統，但暫不直接送入自然科 curriculum 的 AI 診斷。

未來要啟用歷屆國文弱點分析，應先完成：

```text
歷屆題
→ 科目／章節分類
→ concept ID
→ 對應 curriculum knowledge base
→ AI 診斷
```

---

# 8. 資料儲存三層架構

本專案正式採用三層資料分工：

```text
Google Drive
→ 原始教材／參考資料／長期教材記憶

GitHub: chenlijon-dot/Exam
→ 網站程式／一般題庫／歷屆考題／題目必要圖片

GitHub Private: chenlijon-dot/Exam-Record
→ 私人作答紀錄／AI request-result／結構化 curriculum
```

三層不要混用。

## 8.1 Google Drive：教材參考資料庫

Google Drive 負責保存「原始、長期、可能較大型」的教材與參考資料。

適合放：

- 使用者拍攝的課本照片
- 講義照片
- 課本／講義 PDF
- PowerPoint
- 老師補充資料
- 考前整理
- 課堂筆記
- 原始圖片
- 其他未必直接給網站讀取、但之後會反覆查閱的資料
- ChatGPT 讀取後整理出的可搜尋 Google Doc

Google Drive 的角色是：

```text
原始教材庫
+
長期參考記憶庫
```

網站作答時不應每次即時去 Drive 抓整份 PDF；Drive 是建置題庫與分析教材時的 authority/reference source。

## 8.2 GitHub Exam：題庫與網站執行資料

公開 `Exam` repository 保存：

- 網站 JavaScript／HTML
- 一般題庫
- 歷屆考題 JSON
- 題目必要圖片 assets
- catalog／navigation
- 可以直接被 GitHub Pages 使用的資料

因此「考題資料放 GitHub」是目前正式原則。

大量完整課本、整本講義掃描檔、長期參考原始素材，不應因為方便而全部塞入公開 `Exam` repository。

## 8.3 GitHub Exam-Record：私人學習與 AI 資料

私人 `Exam-Record` 保存：

- 個人作答紀錄
- 錯題相關後端資料
- AI analysis request/result
- machine-readable curriculum knowledge base
- GitHub Actions
- Gemini Secret

這裡的 `curriculum` 是 AI 診斷用的「整理後結構化知識」，不是完整原始課本影像倉庫。

---

# 9. Google Drive 教材知識庫規格

## 9.1 建議資料夾結構

Google Drive 建議以科目、學期、課次管理：

```text
國中教材參考資料/
├─ 國文/
│  ├─ 七年級上/
│  │  ├─ 第一課_課名/
│  │  │  ├─ 原始資料/
│  │  │  │  ├─ 課本照片
│  │  │  │  ├─ 講義照片
│  │  │  │  └─ 原始 PDF／PPT
│  │  │  │
│  │  │  └─ 整理資料/
│  │  │     └─ 國文_七上_第一課_教材知識庫（Google Doc）
│  │  │
│  │  └─ 第二課_...
│  └─ ...
│
├─ 英文/
├─ 數學/
├─ 自然/
└─ 社會/
```

實際資料夾名稱應以教材內容確認後再建立；未確認課名時不要憑印象預建完整課表。

## 9.2 一課一份 canonical 教材知識庫

同一課原則上維持一份主要整理文件，例如：

```text
國文_七上_第一課_教材知識庫
```

之後收到新照片、新講義、新老師補充時：

```text
讀取新資料
→ 判斷是否與既有內容重複／衝突
→ 將新資訊整併進同一份 canonical Google Doc
→ 保留來源註記
```

不要每次收到兩張新照片就新增一份互相重疊的整理文件，否則 Drive 很快會失去「記憶庫」價值。

## 9.3 教材知識庫內容

整理後的 Google Doc 建議包含：

```text
【基本資料】
科目
年級／學期
課次
課名
教材版本／出版社（若已知）
作者
文體

【來源資料】
原始照片／PDF／講義名稱
頁碼或照片範圍
新增日期

【課文／教材核心】
課文或教材內容重點
段落大意
主旨
重要概念
作者／背景資料

【考試重點】
字音
字形
字義
詞語
成語
修辭
句型
國學常識
重要文句
常見陷阱／迷思

【老師補充】
講義額外內容
課堂筆記
考前提醒

【題庫建置備註】
適合出題的概念
可能的 concept ID
已建立／待建立題型
```

不同科目可依需求調整欄位，不必硬套國文格式。

---

# 10. 使用者拍照教材 → Google Drive 的標準 SOP

這是未來使用者在 ChatGPT 對話中持續餵教材時的標準流程。

## Step 1：接收照片／PDF／講義

使用者可能提供：

- 手機拍照
- 截圖
- PDF
- PPT
- Word
- 老師講義

先判斷：

```text
科目
年級／學期
課次／章節
資料類型
是否屬於既有教材知識庫
```

若課次尚未確認，不自行猜測。

## Step 2：先讀原始資料，不急著出題

先完整理解資料內容，再判斷：

- 是課文正文？
- 字音字形？
- 作者／國學常識？
- 老師補充？
- 已整理內容的重複資料？
- 新增內容？
- 與舊資料有衝突？

不得因為模型「知道這篇課文」就用模型記憶取代使用者提供的教材。

## Step 3：保留原始資料

若使用者要求存入 Drive，原始照片／PDF 應保留在：

```text
該科目／學期／課次/原始資料/
```

原始影像的作用：

- provenance
- 日後重新核對
- 防止整理時誤讀
- 保存版面、圖表、標記等文字整理無法完整表達的資訊

## Step 4：建立或更新整理後 Google Doc

分析完成後，不只保存照片；同時將可重複利用的教材資訊整理進 canonical Google Doc。

```text
原始照片／PDF
        ↓
閱讀與分析
        ↓
教材知識庫 Google Doc
```

若既有該課 canonical Doc：更新同一份。

若尚未存在：建立新的 canonical Doc。

## Step 5：保留來源資訊

新增內容最好能追溯：

```text
來自哪張照片
哪份講義
哪一頁
哪次新增
```

若某項內容只是推論而非教材明載，也應與來源內容區分。

## Step 6：出題時優先查 Drive 教材記憶

一般章節題庫後續建題流程：

```text
Google Drive 原始／整理教材
        ↓
讀取該課 canonical 教材知識庫
        ↓
確認本次出題範圍
        ↓
建立／校對題目
        ↓
GitHub Exam 題庫
```

也就是：

```text
Drive = 我們記得「教了什麼」
GitHub Exam = 我們實際「考什麼」
```

## Step 7：需要 AI 錯題診斷時，再萃取 curriculum

若該章要啟用正式 AI 弱點診斷：

```text
Drive 教材知識庫
→ 萃取 machine-readable curriculum
→ Exam-Record/curriculum/<chapter-id>.json
→ Gemini 錯題診斷
```

因此 Drive 與 `Exam-Record/curriculum` 不是二選一：

```text
Drive = 完整教材參考層
curriculum JSON = AI 診斷用精煉結構層
```

---

# 11. 資料來源與版權原則

- 使用者提供的課本／講義原始影像可以保存於私人 Google Drive 作為個人教材參考資料。
- 完整出版社課本或大量受版權保護教材，不應任意公開放在 GitHub Pages。
- GitHub 題庫只保存網站需要的題目與必要 assets。
- AI 整理教材時可建立摘要、概念、字詞、修辭、考點與來源索引。
- 需要引用原文時，保留「足以支撐學習與核對」的必要範圍，不把公開 GitHub 當成教材全文鏡像站。

---

# 12. GitHub 目前主要檔案與樹狀結構

### Exam

```text
Exam/
├─ README.md
├─ index.html
│
├─ exam-catalog.js
│  └─ 首頁科目 → 學期 → 章節入口
│
├─ exam-runtime-flex.js
│  ├─ 支援不同題數
│  ├─ 題組文章
│  ├─ 題目附圖
│  ├─ 一般分數制
│  └─ 歷屆正確率制
│
├─ exam-past-exams.js
│  └─ 歷屆導航與試卷載入
│     └─ 基測 → 90 年度 → 第一次／第二次 → 科目
│
├─ exam-option-randomizer.js
│  └─ 一般題庫可洗牌；歷屆題鎖定原始順序
│
├─ exam-records.js
│  ├─ practice：分數制
│  └─ past-exam：正確率制
│
├─ exam-wrong-ui.js
├─ exam-records-clear.js
├─ exam-gpt-analysis.js
│
├─ past-exams/
│  └─ bct/
│     └─ 90/
│        ├─ first/
│        │  ├─ chinese.json
│        │  └─ assets/
│        │     ├─ q29-calligraphy.svg
│        │     └─ q30-letter.svg
│        │
│        └─ second/
│           ├─ chinese.json
│           └─ assets/
│              ├─ q31-invitation.svg
│              └─ q34-letter.svg
│
└─ .github/
   └─ workflows/
      └─ pages.yml
```

### Exam-Record

```text
Exam-Record/
├─ curriculum/
│  └─ science-method.json
├─ records/
├─ analysis-requests/
├─ analysis-results/
└─ .github/
   ├─ scripts/
   │  └─ analyze_wrong_answers.py
   └─ workflows/
      └─ analyze-wrong-answers.yml
```

Google Drive 不列入 Git repository tree；Drive 的教材目錄另依第 9 節規格管理。

---

# 13. 歷屆考題完整匯入 SOP

這一節是後續所有歷屆題整理的標準流程。新的 ChatGPT 對話接手時，應優先遵守這一節，而不是重新發明流程。

## Step 1：接收使用者提供的原始試卷

可能收到：

- 原始 PDF
- 網站「列印成 PDF」的版本
- 掃描 PDF
- 一頁一頁的圖片

先確認：

```text
考試制度
年度
次別
科目
PDF 總頁數
真正有內容的頁數
題目總數
單題／題組的分界
```

例如目前已處理：

```text
90 年第一次基測國文：46 題
90 年第二次基測國文：47 題
```

## Step 2：判斷 PDF 是文字型還是影像型

### 文字型 PDF

若具有可靠文字層，可先抽取文字，再回到頁面影像核對版面、特殊字、圖表與題組。

### 影像型 PDF

若沒有文字層：

```text
PDF
→ 逐頁閱讀影像
→ 必要時提高解析度
→ 放大／裁切難讀區域
→ 逐題人工校對
```

不要因為自動文字辨識看起來像正確，就跳過原始頁面核對。

OCR 只能作為輔助，不能取代人工比對原卷，尤其是：

- 國文字形題
- 同音／形近字
- 古文
- 標點
- 引號內文字
- 書法字形
- 書信格式

## Step 3：建立試卷 census

在正式輸入 JSON 前，先做整份試卷盤點：

```text
總題數
單題範圍
題組範圍
每一題是否有圖
哪些題目共用同一篇文章
哪些頁面存在跨頁題組
```

## Step 4：逐題還原題幹與選項

題目文字以使用者提供的原卷為 authority。

每題至少確認：

```text
number   原始題號
q        題幹
o        A/B/C/D 原始選項
a        正確答案 index
```

歷屆題：

```text
fixedOptions: true
```

不得自行美化或改寫原題。

可以修正的只有明確屬於數位轉錄造成的錯誤，例如誤辨字、漏字、錯誤換行；修正依據仍要回到原卷。

## Step 5：處理題組文章

若數題共用同一篇文章，使用：

```text
intro
introLabel
```

原則：保留理解該題必要的完整文章，不將題組文章改寫成摘要。

## Step 6：辨識「不能只靠文字」的圖題

以下情況通常要建立圖片資產：

- 書法
- 書信／信封／喜帖格式
- 表格
- 圖表
- 地圖
- 示意圖
- 題目本身要求判讀版面配置
- 選項本身是圖像

流程：

```text
原始試卷頁
→ 找到題目必要圖像區域
→ 裁切／重建乾淨圖片
→ 存入該試卷 assets/
→ JSON 以 image / imageAlt 引用
```

目前實例：

```text
90-1 國文 Q29：書法圖
90-1 國文 Q30：書信格式圖
90-2 國文 Q31：喜帖圖
90-2 國文 Q34：書信格式圖
```

## Step 7：搜尋並核對答案來源

題目內容與答案來源要分開處理。

答案來源優先序：

```text
1. 官方考試／教育主管機關公布資料
2. 官方或公立教育機構保存的歷屆答案
3. 學校／教育單位保存的原始答案檔
4. 可追溯來源的歷屆試題資料庫
5. 其他可靠二手整理
6. 模型自行推理：只能當最後輔助，不可假裝成官方答案
```

來源互相衝突時，該題先標為待確認，不硬選答案上線。

## Step 8：第二輪逐題核對

檢查：

```text
題號是否連續
題目是否漏字
選項是否對位
A/B/C/D 是否保持原順序
答案 index 是否與答案表一致
題組文章是否配到正確題目
圖題圖片是否為正確題號
```

## Step 9：建立標準 JSON

路徑：

```text
past-exams/<exam-type>/<year>/<session>/<subject>.json
```

試卷 metadata 至少包括：

```text
key
examType
examTypeLabel
examYear
examSession
examSessionLabel
subject
subjectLabel
title
subtitle
unit
difficulty
difficultyLabel
scoreMode: percent
preserveOptionOrder: true
analysisEligible: false（尚未有專屬 curriculum 時）
sourceNote
```

## Step 10：建立目錄與圖片資產

每份試卷使用自己的目錄，避免圖檔互相污染。

## Step 11：接入網站導航

修改：

```text
exam-past-exams.js
```

導航：

```text
歷屆考題
→ 考試制度
→ 年度
→ 次別
→ 科目
→ 載入 JSON
```

## Step 12：交給通用考試引擎

歷屆 JSON 載入後交給：

```text
exam-runtime-flex.js
```

確認題數不寫死、題組／圖片正常、歷屆題不洗牌、返回導航正常。

## Step 13：測試歷屆專用評量

```text
scoreMode: percent
```

測試：全部答對、部分答對、故意答錯、有未作答、重新作答。

## Step 14：測試錯題資料

確認年度／次別／科目／原始題號、圖題、題組文章與未作答分流正常。

## Step 15：部署 GitHub Pages

```text
commit
→ GitHub Actions pages workflow
→ completed / success
→ 實際 Pages 網站測試
```

不可只看到 repository 有檔案就假設網站已更新。

## Step 16：實機抽查

至少抽查第一題、中間題、圖題、第一題題組、最後一題、返回導航、交卷結果、錯題紀錄。

手機版至少測一次。

## Step 17：更新 README

同步更新入口樹狀圖、題數、JSON 路徑、圖片 assets、檔案樹與工作進度。

---

## 14. 歷屆試題品質分級與「完成」定義

```text
A. imported
   已完成題目結構化，可進網站測試

B. answer-verified
   答案已由可靠來源核對

C. visually-verified
   題幹、選項、題組、圖片已逐題對照原卷

D. production-ready
   導航、評量、錯題、手機顯示與部署皆通過測試
```

若未來把狀態寫入 metadata，可進一步自動顯示校對狀態。

---

## 15. 歷屆題資料來源與 provenance 規則

### 題目 authority

第一 authority 是使用者提供、可直接看到原題的試卷。

網路資料主要用途：

- 找答案表
- 找官方／教育機構保存版本
- 解決原卷模糊處
- 交叉核對特殊字句

不可因網路版排版漂亮，就直接用網路題庫覆蓋使用者提供原卷。

### 建議未來逐步增加的 provenance metadata

```text
questionSource
answerSources[]
verifiedAt
verificationStatus
notes
```

這些欄位不是目前所有舊題都已實作，加入時要保持 backward compatibility。

---

## 16. 安全規則

### GitHub Token

- 不可寫入 repository 原始碼。
- 不可寫入 README。
- 不可貼到 ChatGPT 對話。
- 前端目前只存於 `sessionStorage`。

### Gemini API Key

- 不可放進公開 GitHub Pages JavaScript。
- 存在私人 `Exam-Record` 的 GitHub Actions Secret。
- Secret 名稱：`GEMINI_API_KEY`。

### Google Drive

- README 不紀錄 Google 帳號、Drive token、分享憑證或私人 folder ID。
- 教材原始資料預設視為私人參考資料，不因接入 Drive 就自動公開。

---

## 17. 目前工作進度

### 已完成

- [x] GitHub Pages 題庫網站
- [x] 手機版 responsive 介面
- [x] 自然一上「科學方法」簡易／中等／困難各 20 題
- [x] 一般題庫選項隨機排列
- [x] 作答、交卷、詳解
- [x] 作答紀錄與錯題紀錄
- [x] 未答與錯答分離
- [x] 私人 Exam-Record 同步
- [x] Gemini 錯題診斷
- [x] 科學方法 curriculum knowledge base
- [x] 國文六個學期入口
- [x] 歷屆考題 → 基測／教育會考骨架
- [x] 通用歷屆題執行層
- [x] 歷屆題固定原始選項
- [x] 歷屆題題組文章
- [x] 歷屆題附圖
- [x] 歷屆題正確率評量
- [x] 歷屆題錯題 metadata
- [x] 90 年第一次基測國文 46 題
- [x] 90 年第一次圖題 Q29／Q30
- [x] 90 年第二次基測國文 47 題
- [x] 90 年第二次圖題 Q31／Q34
- [x] 第二次基測國文接入導航
- [x] 歷屆題完整匯入 SOP 文件化
- [x] Google Drive 已確定作為教材原始資料／參考知識庫
- [x] GitHub Exam／Google Drive／Exam-Record 三層資料分工文件化
- [x] 使用者拍照教材 → 分析 → Drive canonical 教材知識庫流程文件化

### 下一階段

- [ ] 在 Google Drive 建立正式「國中教材參考資料」資料夾架構
- [ ] 建立第一份 canonical 教材知識庫 Google Doc
- [ ] 將後續使用者拍攝教材依第 10 節 SOP 納入 Drive
- [ ] 對已匯入歷屆國文持續第二輪人工抽查／校對
- [ ] 為歷屆國文逐步補充更完整解析
- [ ] 匯入 91 年度基測國文
- [ ] 逐步匯入其他年度基測試題
- [ ] 建立教育會考實際年度清單與題庫
- [ ] 分批匯入英文／數學／自然／社會歷屆題
- [ ] 為歷屆題增加 chapter／concept ID
- [ ] 建立歷屆國文 curriculum／concept mapping 後再啟用 AI 弱點診斷
- [ ] 依實際教材建立國文各學期課次／章節
- [ ] 逐章建立一般題庫 curriculum knowledge base

---

## 18. README 維護規則

本 README 是跨 ChatGPT 對話接手本專案時的「專案進度索引 + SOP」。

新的對話若要繼續本專案：

1. 先讀 `chenlijon-dot/Exam/README.md`。
2. 再查看 GitHub repository 最新檔案。
3. 若任務涉及教材參考資料，再搜尋 Google Drive 對應科目／學期／課次的 canonical 教材知識庫。
4. README 與程式碼不一致時，以最新程式碼為準，再回頭更新 README。
5. README 與 Drive 教材內容不一致時，教材事實以可核對的原始資料／最新 canonical 教材知識庫為準。
6. 不要重新猜測已完成架構。
7. 不要自行補尚未確認的教材章節或歷屆年度。
8. 歷屆題匯入優先遵守「第 13 節完整 SOP」。
9. 教材照片／講義整理優先遵守「第 10 節 SOP」。
10. 每完成一份新試卷、教材章節或重要架構調整，都要同步更新 README。

---

## 19. 目前一句話狀態

截至 2026-09-13：

> 系統目前採「Google Drive 教材參考記憶 + GitHub Exam 題庫網站 + Private Exam-Record 學習紀錄／AI curriculum」三層架構。一般題庫已有自然一上科學方法三種難度與 Gemini curriculum-based 錯題診斷，國文六學期入口已建立；歷屆考題已納入 90 年第一次基測國文 46 題與第二次 47 題，共 93 題，支援題組、圖題、固定原始選項、正確率評量與錯題 metadata。後續使用者提供的課本照片、講義、PDF 等原始教材，將先由 ChatGPT 分析，再保存至 Google Drive 原始資料層並持續更新每課 canonical 教材知識庫；需要出題時再從 Drive 參考資料生成／校對題庫並寫入 GitHub Exam。
