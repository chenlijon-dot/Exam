# 國中線上題庫 Exam

> 專案狀態、資料規格與工作流程文件。後續新增科目、學期、章節、題庫、歷屆試題、校內段考、教材參考資料、錯題診斷或資料結構時，請同步更新本 README。
>
> 最後更新：2026-09-14

---

## 1. 專案定位

本專案不是單純的「考卷收藏」，而是逐步建立一套：

```text
教材參考知識庫
        ↓
章節／課次題庫
        ↓
正式歷屆考題 + 各校段考題
        ↓
作答紀錄／錯題
        ↓
AI 弱點診斷
```

核心原則：

- 一般題庫依「科目 → 年級／學期 → 課次／章節 → 題目」管理。
- 正式歷屆考題保留原卷架構，不強迫拆散。
- 各校段考／公開題庫原始卷保存於 Google Drive，再逐題拆解並歸入真正對應的課次／章節。
- Google Drive 保存原始教材與參考資料；GitHub `Exam` 保存網站可直接使用的題庫資料。
- 私人 `Exam-Record` 保存個人作答資料與 AI curriculum。
- 所有題目都要盡可能保留來源 provenance。

---

## 2. 目前網站入口

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
├─ 數學　（一般章節題庫建置中；歷屆題已開始匯入）
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
   │     │  ├─ 國文科：46 題 ✅
   │     │  └─ 數學科：32 題 ✅
   │     └─ 第二次
   │        └─ 國文科：47 題 ✅
   │
   └─ 國中教育會考　（待匯入）
```

目前正式歷屆題：

```text
國文：46 + 47 = 93 題
數學：90 年第一次 32 題
合計：125 題
```

---

## 3. 題目來源分成三類

系統中的題目來源必須區分：

```text
題庫來源
│
├─ 1. 自編題 practice-generated
│     └─ 依實際教材／講義與 curriculum 建立
│
├─ 2. 正式歷屆題 official-past-exam
│     └─ 基測／教育會考等完整官方考試
│
└─ 3. 校內段考／公開題庫 school-exam
      └─ 各校公開段考、模擬考、複習卷等
```

三類題目的來源、保存方式與呈現方式不同，不應全部混成同一種資料。

---

# 4. 資料儲存三層架構

本專案正式採用：

```text
Google Drive
→ 原始教材
→ 各校段考／公開題庫原始檔
→ 長期參考資料／教材記憶

GitHub: chenlijon-dot/Exam
→ 網站程式
→ 一般章節題庫
→ 正式歷屆考題 JSON
→ 從校內段考拆出的可作答單題
→ 題目必要圖片 assets

GitHub Private: chenlijon-dot/Exam-Record
→ 個人作答紀錄
→ 錯題資料
→ AI request/result
→ machine-readable curriculum
```

一句話：

```text
Drive = 原始資料與記憶
GitHub Exam = 真正拿來考的題庫
Exam-Record = 學習結果與 AI 診斷資料
```

---

# 4.1 GitHub-first 工作流程（2026-09-14 起）

本專案日常修改的預設 authority 為：

```text
GitHub: chenlijon-dot/Exam
branch: main
```

本機仍保留 working copy：

```text
E:\Exam
```

但 `E:\Exam` 不再是日常修改的唯一或優先入口；它改為「需要本機檔案處理時使用的工作副本」。

日常預設流程：

```text
Google Drive／使用者提供資料
        ↓
ChatGPT 先讀 GitHub 最新 main
        ↓
直接透過 GitHub connector 修改文字檔／題庫程式
        ↓
commit 到 origin/main
        ↓
GitHub Pages deployment
```

換句話說：

```text
GitHub origin/main = 網站程式與題庫的遠端 authority
E:\Exam           = 必要時才使用的本機工作副本
```

## 4.1.1 跨 ChatGPT 對話統一規則

不同科目或不同工作可以在不同 ChatGPT 對話進行。只要要修改 `Exam` repository，預設都先讀 GitHub 最新狀態，再直接對 GitHub 修改。

正式原則：

```text
預設：GitHub connector 直接修改
必要時：repo 回 E:\Exam 做本機處理
```

適合直接在 GitHub 處理：

- README / Markdown
- JSON 題庫
- JavaScript
- HTML / CSS
- 純文字設定檔
- 小型 SVG
- 其他 connector 可穩定讀寫的文字檔

適合改走本機 `E:\Exam`：

- PNG / JPG 等 binary asset
- PDF 或大型檔案
- 需要裁圖、壓縮、格式轉換的檔案
- GitHub connector 無法可靠上傳或更新的檔案
- 需要本機程式批次處理、實際預覽或大量檔案操作的工作

因此不要為了每一個小修改都先要求使用者 pull / edit / commit / push；能安全直接改 GitHub 的工作，由 ChatGPT 直接完成。

同一個檔案避免同時由「GitHub connector」與「本機 Git」兩邊修改，以免互相踩版本。

## 4.1.2 本機 fallback / repo 回來處理檔案

若工作必須使用本機 `E:\Exam`，開始前先同步遠端。

若 working tree clean：

```powershell
git -C E:\Exam pull --rebase origin main
```

若 working tree 有修改：

```text
先確認本機未提交內容
→ 不直接硬 pull
→ 必要時先 commit 或 stash
→ 再同步 origin/main
```

本機完成後：

```powershell
Set-Location E:\Exam

git status
git diff

git add <修改檔案>
git commit -m "<清楚描述此次修改>"
git pull --rebase origin main
git push origin main
```

原則上不要使用：

```powershell
git push --force
```

除非已明確確認需要改寫 Git history。

若 ChatGPT 已經直接把新 commit 寫到 GitHub，而之後又要回本機工作，先執行：

```powershell
git -C E:\Exam status
git -C E:\Exam pull --rebase origin main
```

如此 `E:\Exam` 才會重新追上最新 `origin/main`。

## 4.1.3 ChatGPT 產生 binary 檔案的匯入方式

若 ChatGPT 產生 PNG、JPG 或其他 connector 不適合直接寫入的檔案，採：

```text
ChatGPT 產生檔案
        ↓
使用者下載到 Windows Downloads
        ↓
人工確認檔案正常
        ↓
必要時同步 E:\Exam
        ↓
Copy-Item 到 repository 正確位置
        ↓
修改 JSON / manifest 引用
        ↓
本機驗證
        ↓
git add / commit / pull --rebase / push
```

PowerShell 範例：

```powershell
Copy-Item `
    "$env:USERPROFILE\Downloads\q26-options.png" `
    "E:\Exam\past-exams\bct\90\first\assets\math\q26-options.png" `
    -Force
```

本機流程是 binary / 大型檔案的 fallback，不是所有修改的必經步驟。

## 4.1.4 數學歷屆考題圖片規則

數學歷屆考題的圖形本身可能就是題意的一部分，因此必須以「還原原卷」為優先。

正式原則：

```text
原卷可直接裁圖
→ 優先使用原卷裁圖

不是：
原圖 → AI 猜測 → 重新生成近似圖
```

適用於：

- 幾何圖
- 座標圖
- 方格圖
- 相似形
- 圓
- 摺紙圖
- 統計圖
- 圖形選項
- 流程圖
- 天平等題意示意圖

尤其涉及：

```text
長度比例
角度
格點位置
相似關係
交點
圖形方向
```

時，不得自行重新生成一張「看起來差不多」的圖。

圖片格式原則：

```text
原卷掃描／裁切圖
→ PNG 優先

真正的向量圖
→ 可使用 SVG
```

避免：

```text
SVG
└─ 再內嵌 data:image/...;base64 raster image
```

這種作法在不同瀏覽器與 GitHub Pages 上可能產生相容性問題。

因此像：

```text
past-exams/bct/90/first/assets/math/q26-options.png
```

這類原卷裁圖，直接以 PNG asset 儲存並由 JSON 引用。

題庫仍保持：

```text
題幹文字 → HTML / KaTeX
公式 → KaTeX
原始圖形 → PNG asset
答案 → JSON
```

如此既能保留原卷精確性，也保留文字搜尋、錯題分析與未來 AI curriculum 的能力。

---
# 5. Google Drive：教材參考知識庫

## 5.1 適合放什麼

- 使用者拍攝的課本照片
- 講義照片
- 課本／講義 PDF
- PPT
- Word
- 老師補充資料
- 課堂筆記
- 考前整理
- 原始圖片
- ChatGPT 整理後的 canonical Google Doc

Google Drive 的角色：

```text
原始教材庫
+
長期教材記憶庫
```

網站作答時不應每次直接去 Drive 抓整份 PDF；Drive 是出題、校對、分析時的 reference authority。

## 5.2 建議資料夾

```text
國中教材參考資料/
├─ 國文/
│  ├─ 七年級上/
│  │  ├─ 第一課_課名/
│  │  │  ├─ 原始資料/
│  │  │  └─ 整理資料/
│  │  │     └─ 國文_七上_第一課_教材知識庫
│  │  └─ ...
│  └─ ...
├─ 英文/
├─ 數學/
├─ 自然/
└─ 社會/
```

未確認課名時不要憑印象預建完整課表。

## 5.3 一課一份 canonical 教材知識庫

同一課維持一份主文件。

收到新照片／講義時：

```text
新資料
→ 閱讀
→ 判斷新增／重複／衝突
→ 整併進同一份 canonical Doc
→ 保留來源註記
```

不要每次新增資料就另外生一份互相重疊的整理文件。

## 5.4 canonical Doc 建議內容

```text
【基本資料】
科目
年級／學期
課次
課名
出版社／版本
作者
文體

【來源資料】
照片／PDF／講義名稱
頁碼
新增日期

【教材核心】
課文／教材內容
段落重點
主旨
重要概念
作者／背景

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
常見陷阱

【老師補充】
講義內容
課堂筆記
考前提醒

【題庫建置】
適合出題的概念
concept ID 候選
已有題型
待補題型
```

---

# 6. 使用者拍攝教材 → Google Drive SOP

```text
1. 使用者上傳照片／PDF／講義
        ↓
2. 確認科目、學期、課次／章節
        ↓
3. 完整閱讀原始資料
        ↓
4. 區分正文、補充、字音字形、考點等
        ↓
5. 原始資料保存到 Drive/原始資料
        ↓
6. 更新該課 canonical 教材知識庫
        ↓
7. 保留來源檔名／頁碼／照片範圍
        ↓
8. 出題時重新查該課 Drive knowledge base
        ↓
9. 題目整理後寫入 GitHub Exam
```

不得因為模型本身「知道」課文，就取代使用者實際提供的教材內容。

---

# 7. 校內段考／線上公開題庫：儲存原則

各校公開的段考卷、模擬卷、複習卷通常數量大、格式不一，也可能包含 PDF、Word、掃描圖或網站列印版。

正式原則：

```text
原始段考卷 → Google Drive
拆解後可作答題目 → GitHub Exam
```

原因：

- Drive 適合保存大量原卷與來源資料。
- 原卷日後可重新核對 OCR、題號、圖表與答案。
- GitHub 不需要塞入大量原始 PDF。
- 同一份段考往往跨多課，不適合直接當成單一章節題庫。
- 真正有價值的是「拆題後重新掛到課次／概念」。

---

# 8. Google Drive：校內段考建議目錄

```text
國中教材參考資料/
└─ 校內段考資料/
   ├─ 國文/
   │  ├─ 七年級上/
   │  │  ├─ A國中_114上_第一次段考/
   │  │  │  ├─ 原始資料/
   │  │  │  │  ├─ 試題.pdf
   │  │  │  │  ├─ 答案.pdf
   │  │  │  │  └─ 來源資訊
   │  │  │  └─ 整理資料/
   │  │  │     └─ 題目拆解整理
   │  │  └─ ...
   │  └─ ...
   ├─ 英文/
   ├─ 數學/
   ├─ 自然/
   └─ 社會/
```

不要依網站名稱當主要分類；主要分類仍是：

```text
科目 → 年級／學期 → 學校／年度／考試次別
```

---

# 9. 校內段考完整匯入 SOP

## Step 1：取得原始考卷

來源可能是：

- 學校官網
- 縣市教育網
- 教師資源網站
- 公開題庫網站
- 使用者提供 PDF／Word／圖片

先保存來源網址與下載日期。

## Step 2：原始資料存入 Google Drive

保留：

```text
試題原檔
答案原檔
來源網址
學校名稱
學年度
學期
考試次別
科目
年級
```

若來源頁面日後消失，仍可靠 Drive 原檔重新核對。

## Step 3：建立整份考卷 census

盤點：

```text
總題數
各題型
圖題
題組
答案表
大致涵蓋課次
```

## Step 4：逐題拆解

一題一題整理：

```text
原始題號
題幹
選項
答案
圖像
來源 metadata
```

## Step 5：判斷真正對應的課次／章節

這是校內段考最重要的一步。

不要只因為整份考卷是「第一次段考」就把全部題目綁在同一章。

每題依內容掛：

```text
chapterTags
lessonTags
conceptIds
```

例如：

```text
第 12 題
→ 七上第一課
→ 修辭
→ 譬喻
```

若一題跨兩課，可多重標記：

```json
"chapterTags": ["lesson-01", "lesson-02"]
```

## Step 6：保留原始 provenance

即使題目已重新歸到章節題庫，仍要知道它原本來自哪張卷。

建議 metadata：

```text
sourceType: school-exam
school
schoolYear
semester
examName
originalQuestionNumber
sourceUrl
sourceFile
capturedAt
answerVerified
```

未來可擴充：

```text
chapterTags[]
conceptIds[]
verificationStatus
notes
```

## Step 7：答案核對

優先使用：

```text
學校原始答案
→ 教育單位答案
→ 同來源正式答案頁
→ 可靠二手整理
```

來源衝突時先標記待確認，不自行假裝有官方答案。

## Step 8：寫入 GitHub 章節題庫

拆題後以「章節」為核心，不以原考卷為核心。

概念：

```text
國文七上第一課
├─ 自編題
├─ A國中段考題
├─ B國中段考題
└─ 其他公開題庫題
```

實際程式資料可依未來題庫重構方式放在：

```text
chapter-bank/<subject>/<semester>/<chapter>.json
```

此路徑目前是規劃，不代表現有 repository 已建立完成。

## Step 9：避免重複題

不同學校常會引用相同題目或同一來源題庫。

匯入前應檢查：

- 題幹高度相同
- 選項相同
- 圖片相同
- 僅修改人名／數字的變形題

若確認為完全相同題目，可保留多個來源 provenance，而不必複製成多題。

## Step 10：更新 README／索引

完成一批段考拆題後，更新：

```text
已整理學校／年度
新增題數
涵蓋課次
Google Drive 分類狀態
GitHub chapter-bank 狀態
```

---

# 10. 章節題庫是校內段考整理的核心

各校段考資料最終目的不是蒐集「很多 PDF」，而是建立：

```text
一課一課
一章一章
一個 concept 一個 concept
```

例如：

```text
國文
└─ 七年級上
   ├─ 第一課
   │  ├─ 自編題
   │  ├─ 各校段考題
   │  └─ 公開複習題
   ├─ 第二課
   └─ 語文常識
```

未來可因此做到：

```text
七上第一課：各校常考題
第一課：只練修辭
第一課：只練字音字形
第一課：高錯誤率題目
跨校同 concept 混合練習
```

並可進一步統計：

```text
某章節各校最常考什麼
某 concept 出現頻率
哪些題型最容易答錯
```

---

# 11. 題目來源 metadata 建議

所有未來新題逐步統一 provenance。

## 自編題

```text
sourceType: generated
subject
semester
chapter
conceptIds
referenceSources
```

## 正式歷屆題

```text
sourceType: official-past-exam
examType
examYear
examSession
subject
originalQuestionNumber
questionSource
answerSources
```

## 校內段考

```text
sourceType: school-exam
school
schoolYear
semester
examName
subject
originalQuestionNumber
sourceUrl
sourceFile
chapterTags
conceptIds
answerVerified
```

來源資料不只是備註，未來可以用來篩選：

```text
只做某校題目
只做正式歷屆題
只做各校段考題
混合自編 + 段考 + 歷屆
```

---

# 12. 正式歷屆考題與校內段考的差異

```text
正式基測／會考
→ 保留整張考卷
→ 保留原始題序
→ 保留 A/B/C/D
→ 可整卷作答

校內段考／公開題庫
→ 原卷保存 Drive
→ 每題拆解
→ 依實際課次／chapter／concept 重新分類
→ GitHub 主要提供章節式練習
```

若未來有需求，也可以另外提供「原校原卷模式」，但不是目前主要資料模型。

---

# 13. 正式歷屆考題評量規則

歷屆題不使用一般題庫的固定分數制，而以：

```text
答對題數 / 總題數
正確率 %
答錯題數
未答題數
```

為主要結果。

歷屆選項：

```text
preserveOptionOrder: true
fixedOptions: true
```

未答與答錯分開處理。

---

# 14. 已完成的正式歷屆考題

## 90 年第一次基測國文

```text
past-exams/bct/90/first/chinese.json
```

46 題。

圖題：

```text
q29-calligraphy.svg
q30-letter.svg
```

## 90 年第二次基測國文

```text
past-exams/bct/90/second/chinese.json
```

47 題。

```text
第 1～34 題：單題
第 35～47 題：題組
```

圖題：

```text
q31-invitation.svg
q34-letter.svg
```

---

# 15. 正式歷屆考題完整匯入 SOP

```text
1. 接收原始 PDF／圖片
2. 確認制度／年度／次別／科目
3. 判斷文字型或影像型 PDF
4. 建立試卷 census
5. 逐題還原題幹與原始選項
6. 題組保存 intro／introLabel
7. 圖題建立 assets
8. 另找可靠答案來源核對
9. 第二輪逐題比對原卷
10. 建立 past-exams/... JSON
11. 接入 exam-past-exams.js
12. 交由 exam-runtime-flex.js
13. 測試正確率／未答／錯題
14. 測試圖題／題組／返回導航
15. GitHub Pages 部署成功後實機抽查
16. 更新 README
```

答案來源優先序：

```text
官方考試／主管機關
→ 公立教育機構保存資料
→ 學校／教育單位答案
→ 可追溯歷屆資料庫
→ 可靠二手資料
→ 模型自行解題只能最後輔助
```

---

# 16. 正式歷屆題品質分級

```text
A. imported
   已完成結構化

B. answer-verified
   答案已由可靠來源核對

C. visually-verified
   題幹／選項／題組／圖片已對照原卷

D. production-ready
   導航／評量／錯題／手機／部署皆測試完成
```

「JSON 已存在」不等於「完全校對完成」。

---

# 17. AI 錯題診斷

目前正式 curriculum-based AI 診斷：

```text
自然一上 → 科學方法
Exam-Record/curriculum/science-method.json
```

後端模型：

```text
gemini-3.5-flash-lite
```

Drive 與 curriculum JSON 的關係：

```text
Google Drive canonical 教材知識庫
→ 萃取 machine-readable curriculum
→ Exam-Record/curriculum/<chapter-id>.json
→ Gemini 錯題診斷
```

歷屆國文與校內段考題尚未全面啟用 AI 弱點診斷；需先有 chapter／concept mapping 與對應 curriculum。

---

# 18. GitHub 目前主要樹狀結構

```text
Exam/
├─ README.md
├─ index.html
├─ exam-catalog.js
├─ exam-runtime-flex.js
├─ exam-past-exams.js
├─ exam-option-randomizer.js
├─ exam-records.js
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

規劃中的校內段考拆題資料：

```text
chapter-bank/
└─ <subject>/
   └─ <semester>/
      └─ <chapter>.json
```

此處為規劃路徑；實際 repository 如已建立，應以最新 GitHub 內容為準並同步更新本 README。

私人：

```text
Exam-Record/
├─ curriculum/
│  └─ science-method.json
├─ records/
├─ analysis-requests/
├─ analysis-results/
└─ .github/
```

---

# 19. 版權與 provenance 原則

- 使用者提供的課本／講義可保存私人 Drive 作個人學習參考。
- 各校公開段考原始卷優先保存私人 Drive，並保留原始網址與學校資訊。
- 「網路上可下載」不自動等於「可以無限制公開重製」。
- 公開 GitHub 主要保存網站需要的結構化題庫與必要 assets。
- 若來源權利或重製條件不清楚，採保守方式處理，不把完整原卷鏡像公開。
- 題目整理後仍應保存來源 provenance，不將來源洗掉。
- 題目內容有疑義時回原卷核對，不依模型印象自行修正。

---

# 20. 安全規則

### GitHub Token

- 不寫入 repository。
- 不寫入 README。
- 不貼到對話。
- 前端只存於 `sessionStorage`。

### Gemini API Key

- 不進公開 JavaScript。
- 存於 Private `Exam-Record` GitHub Actions Secret。

### Google Drive

- README 不紀錄 Google 帳號、token、私人 folder ID 或分享憑證。
- Drive 教材與段考原始資料預設視為私人參考資料。

---

# 21. 目前工作進度

## 已完成

- [x] GitHub Pages 題庫網站
- [x] 手機版 responsive
- [x] 自然一上科學方法簡易／中等／困難各 20 題
- [x] 作答／交卷／詳解
- [x] 作答紀錄／錯題紀錄
- [x] 未答與錯答分離
- [x] 私人 Exam-Record 同步
- [x] Gemini 錯題診斷
- [x] 科學方法 curriculum
- [x] 國文六學期入口
- [x] 歷屆考題基測／會考骨架
- [x] 通用歷屆考試引擎
- [x] 歷屆固定選項／題組／圖題／正確率
- [x] 90 年第一次基測國文 46 題
- [x] 90 年第二次基測國文 47 題
- [x] 90 年第一次基測數學 32 題
- [x] 正式歷屆考題匯入 SOP
- [x] Google Drive 教材 reference 架構文件化
- [x] 使用者拍照教材 → Drive canonical knowledge SOP
- [x] 校內段考原始卷 → Drive 的保存原則文件化
- [x] 校內段考拆題 → 課次／chapter／concept → GitHub 的 SOP 文件化
- [x] GitHub-first 修改流程文件化

## 下一階段

- [ ] 在 Google Drive 建立「國中教材參考資料」正式資料夾
- [ ] 建立「校內段考資料」正式資料夾
- [ ] 建立第一份 canonical 教材知識庫 Google Doc
- [ ] 找第一份公開校內段考作為拆題試驗
- [ ] 確認 `chapter-bank` 的正式 JSON schema
- [ ] 建立第一個章節式混合題庫（自編 + 校內段考）
- [ ] 對目前 90 年兩份基測國文持續人工校對
- [ ] 匯入後續基測／教育會考
- [ ] 為題目逐步加入 chapter／concept ID
- [ ] 建立國文 curriculum／concept mapping

---

# 22. README 接手規則

新的 ChatGPT 對話要繼續本專案時：

1. 先讀 `chenlijon-dot/Exam/README.md`。
2. 再讀 GitHub repository 最新 `main` 的實際檔案；README 與程式不一致時，以最新程式為準並修正 README。
3. 預設直接使用 GitHub connector 對 `chenlijon-dot/Exam` 讀寫，不要求先回本機操作。
4. 只有 binary asset、大型檔案、批次處理、需要本機預覽，或 connector 無法可靠完成時，才改用 `E:\Exam`。
5. 回到 `E:\Exam` 前先同步 `origin/main`；GitHub 直接修改完成後，本機副本可能落後，之後再用時必須先 `pull --rebase`。
6. 涉及教材時，搜尋 Google Drive canonical 教材知識庫。
7. 涉及校內段考時，先查 Drive 是否已有原卷與整理資料。
8. README 與教材事實不一致，以可核對原始資料／canonical knowledge 為準。
9. 不自行猜課名、章節或尚未存在的年度。
10. 正式歷屆題走第 15 節 SOP。
11. 校內段考走第 9 節 SOP。
12. 使用者拍攝教材走第 6 節 SOP。
13. 數學歷屆圖形以原卷裁圖為優先，不生成近似圖取代原圖。
14. 每完成新試卷、新章節、新段考批次或重要架構調整，都更新 README。

---

# 23. 目前一句話狀態

截至 2026-09-14：

> 系統目前採「Google Drive 原始教材／校內段考參考記憶 + GitHub Exam 可執行題庫 + Private Exam-Record 學習紀錄／AI curriculum」三層架構。日常程式與題庫修改以 GitHub `origin/main` 為 authority，ChatGPT 預設直接透過 GitHub connector 修改；只有 binary asset、大型檔案、裁圖／轉檔、批次處理或 connector 不適合處理的情況，才回到 `E:\Exam` 本機工作副本。正式歷屆題目前已納入 90 年第一次基測國文 46 題、第二次國文 47 題，以及第一次數學 32 題；教材照片與各校段考原始卷以 Google Drive 長期保存。各校段考仍採逐題拆解、保留 provenance，再依實際課次、chapter 與 concept 插入 GitHub 章節題庫的方向發展。
