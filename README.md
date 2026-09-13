# 國中線上題庫 Exam

> 專案狀態、資料規格與工作流程文件。後續新增科目、學期、章節、題庫、歷屆試題、錯題診斷或資料結構時，請同步更新本 README。
>
> 最後更新：2026-09-13

## 1. 專案目標

這個專案要逐步建立一套可在手機與電腦使用的「國中線上題庫」。

主要方向：

- 一般題庫依「科目 → 年級／學期 → 章節 → 難度」進入。
- 主選單另外提供「歷屆考題」，整理國中基測／教育會考歷屆試題。
- 一般章節題庫可建立簡易、中等、困難等不同層級題目。
- 作答後立即判定答案，可顯示正確答案與詳解。
- 保存作答紀錄與錯題，供後續複習。
- 一般章節錯題可交由 AI 依「該章課文知識基準」分析真正的弱點。
- 歷屆考題保留原始題號、選項順序、題組脈絡與必要附圖，不因目前課綱而改寫原題。
- 題庫內容與私人學習紀錄分離：公開網站不存放私人學習資料或 API Secret。

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

## 8. GitHub 架構

### 公開題庫網站

```text
chenlijon-dot/Exam
```

用途：GitHub Pages、題庫前端、catalog、歷屆題資料、通用作答介面、作答紀錄與錯題 UI。

網站：

```text
https://chenlijon-dot.github.io/Exam/
```

### 私人學習資料與 AI 後端

```text
chenlijon-dot/Exam-Record
```

用途：個人作答紀錄、AI analysis request/result、curriculum、GitHub Actions、Gemini API Secret。

`Exam-Record` 應維持 Private。

---

## 9. 目前主要檔案與樹狀結構

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

---

## 10. 安全規則

### GitHub Token

- 不可寫入 repository 原始碼。
- 不可寫入 README。
- 不可貼到 ChatGPT 對話。
- 前端目前只存於 `sessionStorage`。

### Gemini API Key

- 不可放進公開 GitHub Pages JavaScript。
- 存在私人 `Exam-Record` 的 GitHub Actions Secret。
- Secret 名稱：`GEMINI_API_KEY`。

README 不應紀錄任何 token、password 或 API key 實值。

---

## 11. 建置原則

### A. 一般題庫先確認教材

新增一般章節前先取得課本／講義，確認科目、學期、章節、範圍與核心概念。

### B. 未答不等於答錯

```text
答對
答錯
未答
```

三種狀態必須分開。未答不得進錯題，也不得作為 AI 弱點證據。

### C. 歷屆題保留原貌

- 不為配合現行課本而改寫原題。
- 保留制度、年度、次別、科目、題號。
- 保留原始選項順序。
- 題組文章保留必要上下文。
- 必要圖像獨立保存成資產。
- 課綱與 concept mapping 用 metadata 處理，不改題目本身。

### D. 題目來源與答案來源分開

歷屆題建置時要把兩件事分清楚：

```text
題目內容來源 → 使用者提供的原始試卷／可核對原卷
答案來源     → 另外搜尋可靠歷屆答案並交叉核對
```

網路搜尋到的題庫文字不得在沒有核對原卷的情況下直接取代使用者提供的試題。

---

# 12. 歷屆考題完整匯入 SOP

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

此步可避免做到一半才發現漏題、重複題號或文章配錯題目。

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

原則：

- 保留理解該題必要的完整文章。
- 不把題組文章重寫成摘要。
- 不因文章太長而任意省略會影響判題的內容。
- 同一篇文章可在對應題目中重複引用，以維持每題可獨立顯示與錯題回顧。

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

圖片不可只為美觀而加；只有題意需要時才納入。

## Step 7：搜尋並核對答案來源

題目內容與答案來源要分開處理。

拿到原卷後，另外搜尋該年度、次別、科目的答案。

答案來源優先序：

```text
1. 官方考試／教育主管機關公布資料
2. 官方或公立教育機構保存的歷屆答案
3. 學校／教育單位保存的原始答案檔
4. 可追溯來源的歷屆試題資料庫
5. 其他可靠二手整理
6. 模型自行推理：只能當最後輔助，不可假裝成官方答案
```

### 答案核對原則

- 優先找完整答案表，不要只找零散題解。
- 若有兩個獨立可靠來源，可交叉核對。
- 若來源互相衝突，該題先標為待確認，不要硬選一個答案上線。
- 若網路只有題目沒有答案，不可把其他人的未核對解析當成正式答案。
- 模型自行解題可以用來發現「答案表可能有抄錯」，但不能取代來源核對。

## Step 8：第二輪逐題核對

在建立正式 JSON 前，至少做一次「題目＋答案」第二輪核對。

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

對形近字、古文、標點與圖題提高人工核對優先級。

## Step 9：建立標準 JSON

路徑：

```text
past-exams/<exam-type>/<year>/<session>/<subject>.json
```

目前例子：

```text
past-exams/bct/90/first/chinese.json
past-exams/bct/90/second/chinese.json
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

單題基本格式：

```json
{
  "number": 1,
  "q": "題目",
  "o": ["A選項", "B選項", "C選項", "D選項"],
  "a": 0,
  "fixedOptions": true,
  "e": "答案／解析說明"
}
```

題組題可增加：

```text
intro
introLabel
```

圖題可增加：

```text
image
imageAlt
```

## Step 10：建立目錄與圖片資產

每份試卷使用自己的目錄，避免圖檔互相污染：

```text
past-exams/
└─ bct/
   └─ 90/
      ├─ first/
      │  ├─ chinese.json
      │  └─ assets/
      │
      └─ second/
         ├─ chinese.json
         └─ assets/
```

命名應讓人直接知道題號與用途，例如：

```text
q31-invitation.svg
q34-letter.svg
```

## Step 11：接入網站導航

修改：

```text
exam-past-exams.js
```

導航層級：

```text
歷屆考題
→ 考試制度
→ 年度
→ 次別
→ 科目
→ 載入 JSON
```

新增試卷時要同時：

- 將原本「待匯入」改成可點。
- 顯示正確題數。
- 加入對應 loader。
- `onBack` 回到正確的年度／次別科目頁。

## Step 12：交給通用考試引擎

歷屆 JSON 載入後交給：

```text
exam-runtime-flex.js
```

應確認：

- 題數不是寫死 20 題。
- 題目可以 46、47 或其他題數。
- 題組與圖片正常顯示。
- 歷屆題不洗牌。
- 底部按鈕與返回導航正常。

## Step 13：測試歷屆專用評量

歷屆題：

```text
scoreMode: percent
```

測試至少包含：

```text
全部答對
部分答對
故意答錯
有未作答
重新作答
```

結果必須以正確率呈現，不得出現一般題庫的「每題 5 分／滿分 100 分」。

## Step 14：測試錯題資料

交卷後確認：

- `past-exam` metadata 正確。
- 年度／次別／科目正確。
- 原始題號正確。
- 未作答沒有進錯題。
- 圖題在錯題回顧中仍可顯示圖片。
- 題組錯題仍可看到必要文章。

## Step 15：部署 GitHub Pages

完成資料與導航 commit 後：

```text
push / commit
→ GitHub Actions pages workflow
→ 等待 completed / success
→ 再用實際 Pages 網站測試
```

不可只看到 GitHub repository 有檔案就假設網站已更新。

若手機仍看到舊版，要考慮瀏覽器／Pages 快取，必要時使用新的 query version 測試。

## Step 16：實機抽查

至少抽查：

```text
第一題
中間純文字題
圖題
第一題題組
最後一題
返回導航
交卷結果
錯題紀錄
```

使用手機版至少測一次，因為目前主要使用情境包含手機。

## Step 17：更新 README

每完成一份正式歷屆試卷，都要同步更新：

- 網站入口樹狀圖
- 已收錄題數
- JSON 路徑
- 圖片資產
- GitHub 檔案樹
- 已完成項目
- 下一階段
- 一句話狀態

---

## 13. 歷屆試題品質分級與「完成」定義

不要把「JSON 已建立」直接等同「完全校對完成」。

建議用下列狀態理解：

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

## 14. 資料來源與 provenance 規則

### 題目 authority

第一 authority 是使用者提供、可直接看到原題的試卷。

網路資料主要用途：

- 找答案表
- 找官方／教育機構保存版本
- 解決原卷模糊處
- 交叉核對特殊字句

不可因網路版排版漂亮，就直接用網路題庫覆蓋使用者提供原卷。

### 建議未來逐步增加的 provenance metadata

目前既有 JSON 以 `sourceNote` 為主；後續可逐步增加：

```text
questionSource
answerSources[]
verifiedAt
verificationStatus
notes
```

這些欄位不是目前所有舊題都已實作，加入時要保持 backward compatibility。

---

## 15. 目前工作進度

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

### 下一階段

- [ ] 對已匯入歷屆國文進行持續第二輪人工抽查／校對
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

## 16. README 維護規則

本 README 是跨 ChatGPT 對話接手本專案時的「專案進度索引 + SOP」。

新的對話若要繼續本專案：

1. 先讀 `chenlijon-dot/Exam/README.md`。
2. 再查看 GitHub repository 最新檔案。
3. README 與程式碼不一致時，以最新程式碼為準，再回頭更新 README。
4. 不要重新猜測已完成架構。
5. 不要自行補尚未確認的教材章節或歷屆年度。
6. 歷屆題匯入優先遵守「第 12 節完整 SOP」。
7. 每完成一份新試卷，都要同步更新入口樹、檔案樹與進度。

---

## 17. 目前一句話狀態

截至 2026-09-13：

> 系統已形成「一般章節題庫 + 歷屆考題」雙軌架構；自然一上科學方法已有三種難度題庫與 Gemini curriculum-based 錯題診斷，國文六學期入口已建立；歷屆考題目前已正式納入 90 年第一次基測國文 46 題與第二次基測國文 47 題，共 93 題，並支援題組、圖題、固定原始選項、正確率評量、錯題 metadata 與手機作答。歷屆試題從「使用者提供原卷 → 影像／文字辨識 → 題目還原 → 網路答案核對 → 圖題資產 → JSON → 導航 → 評量／錯題測試 → Pages 部署 → README 更新」的完整流程已文件化，可作為後續批次匯入的標準產線。
