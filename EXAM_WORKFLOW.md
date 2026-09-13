# 各科各校段考題處理流程

> 本文件定義 `Exam` 專案中「各科各校段考／公開題庫」的共同 SOP。
>
> 適用科目：**國文、英文、數學、自然、社會，以及後續新增科目。**
>
> `CHINESE_SCHOOL_EXAM_WORKFLOW.md` 是國文已實作的科目專屬範例，不代表其他科目必須照抄國文題型；其他科目沿用本文件的共同精神，再依實際考卷特性調整。
>
> 核心原則：**共同資料規範要一致，但題型處理不能僵化。先忠實理解原卷，再決定最適合該科、該份考卷的資料結構與網站呈現。**

---

# 1. 共同骨架 + 科目／考卷適應層

所有科目先遵守共同骨架：

```text
原始題目卷 + 官方答案卷
        ↓
完整讀卷／建立 census
        ↓
逐題分類索引
        ↓
章節／課次／單元／concept mapping
        ↓
保留 provenance
        ↓
轉成網站可作答資料
        ↓
實機驗證
```

但真正轉題時，再依科目和原卷決定：

```text
這題是純文字嗎？
是圖題嗎？
是題組嗎？
是閱讀測驗嗎？
是實驗資料題嗎？
是計算題嗎？
是地圖／統計圖嗎？
是紙筆作答嗎？
有沒有特殊答案格式？
```

因此本 SOP 不是要求所有考卷長得一樣，而是要求：

```text
資料來源一致可追溯
分類方式一致可維護
答案驗證一致可靠
呈現方式依考卷特性調整
```

---

# 2. 三層資料角色

```text
Google Drive
→ 原始段考題目卷
→ 官方答案卷
→ 原始教材／講義／canonical 教材知識庫

Google Sheet（各科可有自己的索引表）
→ 每一題對應哪一課／章／單元／小節／能力範圍
→ 保留尚未能確定的 unknown

GitHub: chenlijon-dot/Exam
→ 網站可直接使用的題庫 JSON
→ 題目必要圖片 assets
→ runtime / catalog / 題庫程式
```

一句話：

```text
Drive = 原始證據與教材 reference
Sheet = 題目分類索引
GitHub = 正式可作答題庫
```

Private `Exam-Record` 另負責：

```text
學生作答紀錄
錯題
AI request/result
machine-readable curriculum
```

---

# 3. 標準作業流程

收到一份新的各校段考後，依下列順序處理：

```text
1. 找到原始題目卷
2. 找到官方答案卷
3. 確認學校／年度／學期／年級／科目／段考次別
4. 完整讀完整份考卷，不只抽看幾題
5. 建立整卷 census
6. 逐題建立或更新 Google Sheet 索引
7. 依實際教材判斷每題真正對應的課次／章節／單元／小節
8. 必要時再掛 concept ID
9. 判斷題型與是否需要圖片／題組／特殊 runtime
10. 將可作答題目寫入對應 chapter-bank JSON
11. 圖片題依原卷裁圖規則建立 asset
12. 核對答案、選項順序、題號、來源與題數
13. commit 到 GitHub main
14. 確認 GitHub Pages deployment
15. 實際進網站抽查作答、返回、計分、錯題與手機畫面
16. 更新 README／索引
```

若暫時沒有官方答案卷：

```text
可以先保存原卷
可以先完成 census
可以先建立 Sheet 索引
可以先標記 pending

不可把 AI 推測答案偽裝成官方答案
不可在正式自動評量中設 answerVerified: true
```

---

# 4. 整份考卷 census

在逐題拆解前，先盤點整份卷。

至少確認：

```text
總題數
大題結構
單選／複選／填充／手寫題
題組數
圖題數
閱讀文章
表格／統計圖／地圖／實驗資料
是否有共用選項
是否有特殊答案碼
是否有送分題
是否跨多個單元
```

目的不是多做一張表，而是先知道「這份考卷到底長什麼樣」。

不同考卷可能需要不同資料模型；不要還沒完整讀卷就套模板。

---

# 5. Google Sheet 題目索引

各科可有自己的 Google Sheet。

最低建議欄位：

```text
年分｜國中｜段考｜題號｜出自於
```

後續可擴充：

```text
科目
年級學期
單元／課次
小節
concept ID
題型
圖題
答案狀態
備註
```

`出自於` 依科目而定：

```text
國文 → 第一課〈夏夜〉、語文常識、跨文本閱讀
英文 → Unit / Lesson / Reading / Grammar / Vocabulary
數學 → 1-1 正負數、2-3 一元一次方程式……
自然 → 1-2 科學方法、1-3 認識實驗室、2-1 生物體的基本構造……
社會 → 地理／歷史／公民的章節、主題或能力範圍
```

無法可靠判斷時：

```text
unknown
```

不要為了讓表格看起來完整而硬猜。

## 5.1 題號格式

原卷有大題結構就保留：

```text
一-1
一-2
二-1
三-19
```

連續題號就保留：

```text
1
2
3
...
```

網站顯示序號和 `originalQuestionNumber` 是兩件事。

---

# 6. 章節分類必須回到實際教材

整份段考屬於「第一次段考」不代表所有題目都屬於同一章。

每題依內容重新判定：

```text
subject
semester
unit / lesson
section
concept
```

例如自然目前已確認的教材樹：

```text
自然七上
└─ 單元 1 生命現象與科學探究
   ├─ 1-1 生命現象和生物圈
   ├─ 1-2 科學方法
   └─ 1-3 認識實驗室
```

若題目是變因控制，就應歸 `1-2 科學方法`；若是顯微鏡操作，就應歸 `1-3 認識實驗室`。

分類優先依據：

```text
使用者提供的實際教材
→ Google Drive canonical 教材知識庫
→ 已確認 catalog
→ 模型一般知識最後才輔助
```

---

# 7. canonical 教材知識庫與段考分類的關係

各校段考不是獨立於教材之外。

理想流程：

```text
原始教材／講義
→ canonical 教材知識庫
→ chapter / section / concept 架構
→ 段考逐題 mapping
```

若某題歸屬不清楚，先回 Drive 對應教材查證。

如果段考揭露一個教材中尚未整理的重要考點：

```text
段考發現新考點
→ 回頭核對教材
→ 若確實屬本章內容
→ 更新 canonical
→ 再更新 concept mapping
```

不要反過來只因某校出了一題，就憑空改寫課程範圍。

---

# 8. 正式題庫 JSON 原則

各校段考題來源類型統一：

```json
"sourceType": "school-exam"
```

題庫路徑依既有 repository 結構：

```text
chapter-bank/<subject>/<semester>/<unit-or-lesson>/<section>/school-exams.json
```

目前自然實例：

```text
chapter-bank/science/7-1/unit-01/section-02/school-exams.json
```

實際路徑以 GitHub 最新 catalog／既有結構為準，不另創平行命名系統。

## 8.1 provenance

每題至少盡量保留：

```json
{
  "school": "高雄市立大灣國中",
  "year": "114",
  "exam": "第一學期七年級第一次段考",
  "originalQuestionNumber": "3",
  "sourcePage": 1,
  "answerVerified": true
}
```

未來可擴充：

```text
sourceFile
sourceUrl
capturedAt
chapterTags[]
conceptIds[]
verificationStatus
notes
```

題目顯示可保留簡短來源：

```text
[114 大灣國中]
```

## 8.2 真實段考選項不亂序

```json
"preserveOptionOrder": true
```

真實段考的 A/B/C/D 位置是原卷的一部分，不做自編題那種選項隨機。

## 8.3 官方答案優先

```text
官方答案卷
> 原校正式公布資料
> 可可靠驗證的原始來源
> 可靠二手資料
> AI 推理只能最後輔助
```

只有正式核對後才設：

```json
"answerVerified": true
```

---

# 9. 共通題型資料模型

## 9.1 一般單選題

```json
{
  "q": "題目文字 [114 XX國中]",
  "o": ["A選項", "B選項", "C選項", "D選項"],
  "a": 2,
  "e": "解析或答案依據"
}
```

`a` 為 0-based：

```text
A = 0
B = 1
C = 2
D = 3
```

## 9.2 題組／閱讀／共用資料

```json
"introLabel": "題組標題",
"intro": "共用文章、情境、實驗描述或資料表說明"
```

可用於：

- 國文閱讀題組
- 英文閱讀題組
- 自然實驗題組
- 社會資料判讀題組
- 數學共用情境題

## 9.3 紙筆題／非自動判分題

```json
"type": "manual-study"
```

可搭配：

```json
"manualInstruction": "請在紙上作答；本題不列入自動計分。",
"manualAnswer": "官方參考答案"
```

原則：

- 可以收錄
- 可以顯示答案
- 不進自動正答率
- 不進一般錯題統計
- 不污染 AI 自動判分資料

## 9.4 官方送分題

不要虛構正確選項。

建議：

```json
"officialDisposition": "送分"
```

並排除自動評量分母。

## 9.5 特殊答案碼

遇到：

```text
AB / AC / BD / ABC ...
```

先判斷究竟是：

- 真複選
- 共用選項庫
- 配對題
- 特殊答案卡編碼

不要看到多字母就直接做 checkbox。

---

# 10. 圖片題規則（全科共同）

核心：

```text
原卷可直接裁圖
→ 優先使用原卷裁圖
```

不是：

```text
原圖
→ AI 理解
→ 重新生成近似圖
```

圖片若會影響：

```text
題意
比例
角度
字形
位置
版面
圖例
數值
方向
```

就必須保留原始視覺資訊。

## 10.1 各科常見圖題

```text
國文：書法、字形、漫畫、廣告、信封、卡片、圖文閱讀
英文：情境圖、圖片選項、廣告、菜單、時刻表、圖表
數學：幾何、座標、方格、統計圖、摺紙、天平、圖形選項
自然：實驗裝置、顯微圖、構造圖、流程圖、照片、數據圖表
社會：地圖、歷史圖片、統計圖、區域分布、資料表
```

## 10.2 格式

優先：

```text
原卷裁切 → PNG
```

真正適合向量化且不改變資訊時才用 SVG。

## 10.3 JSON 引用

```json
"image": ".../q05-figure.png",
"imageAlt": "第5題附圖"
```

選項圖：

```json
"optionImage": ".../q08-options.png",
"optionImageAlt": "第8題選項圖"
```

## 10.4 asset 命名

```text
<school>-<year>-q<question>-figure.png
<school>-<year>-q<question>-options.png
```

例如：

```text
dayuan-114-q12-figure.png
```

---

# 11. 科目專屬適應規則

這一節是「共同 SOP 之上的科目適應層」。

不同科目不要求使用完全相同的題目結構。

## 11.1 國文

可能包含：

- 課文理解
- 字音字形
- 注釋
- 修辭
- 國學常識
- 跨文本閱讀
- 閱讀題組
- 手寫題

允許「跨文本」歸課，但必須有明確教學關聯。

例如：

```text
第一課〈夏夜〉（跨文本）
```

若只是模糊聯想則維持 `unknown`。

國文已有：

```text
CHINESE_SCHOOL_EXAM_WORKFLOW.md
```

它是國文專屬細節補充，不是其他科目的硬性模板。

## 11.2 英文

可能包含：

- Vocabulary
- Grammar
- Dialogue
- Cloze
- Reading
- Translation
- Listening
- 圖片／廣告／菜單／時刻表

閱讀文章與共用情境用 `intro`。

若未來處理聽力：

```text
音檔來源
播放次數
播放控制
答案格式
```

須另訂規格，不先假設。

## 11.3 數學

可能包含：

- 純計算
- 文字應用
- 幾何
- 作圖
- 證明／過程題
- 統計圖表

公式優先 KaTeX。

圖形題以原卷為準；角度、長度比例、格點、交點等不得 AI 近似重畫。

紙筆計算或證明題若 runtime 不適合自動判分，可採 `manual-study`。

## 11.4 自然

可能包含：

- 基本概念
- 實驗設計
- 變因判讀
- 實驗器材
- 顯微鏡
- 生物構造圖
- 資料表
- 統計圖
- 實驗題組
- 圖片辨識

自然題尤其要保留完整實驗條件。

不能為了縮短題目，把：

```text
操縱變因
控制變因
應變變因
材料差異
溫度／時間／濃度
```

刪到足以改變答案。

自然分類應優先查：

```text
Google Drive canonical 教材知識庫
```

目前已實作：

```text
1-2 科學方法
1-3 認識實驗室
單元1 綜合複習
```

## 11.5 社會

社會可再細分：

```text
地理
歷史
公民
```

常見資料：

- 地圖
- 時間軸
- 歷史圖片
- 統計圖
- 表格
- 法條／制度情境
- 文字材料

圖片、地圖與資料來源若是題意核心，保留原圖與原版面。

---

# 12. 考卷特性優先原則

除了科目差異，同一科的不同考卷也可能需要不同處理。

例如同樣是自然科：

```text
A 校：40 題純單選
B 校：25 題單選 + 2 組實驗題組
C 校：大量顯微鏡／圖表圖題
D 校：另有手寫實驗設計題
```

不能為了「統一格式」而把所有考卷壓成 40 題純文字單選。

正式原則：

```text
先忠實保留原卷資訊
→ 再利用共通 runtime 能力呈現
→ runtime 不足時才擴充 runtime
```

不是：

```text
runtime 現在只會某種題型
→ 所以強迫原卷改成那種題型
```

---

# 13. Google Drive 原始檔規則

每份段考至少保存：

```text
題目卷
答案卷
```

能取得時再保存：

```text
來源網址
下載日期
學校資訊
版本／更正版說明
```

原始檔是後續校對的最終 evidence，用於核對：

- OCR
- 選項順序
- 題號
- 圖片
- 排版
- 題組範圍
- 答案
- 送分
- 特殊格式

不要讓整理後 JSON 取代原卷。

---

# 14. 重複題處理

不同學校可能出現：

```text
完全相同題
只換人名
只改數字
同題庫來源的變形題
```

處理時先判斷：

```text
完全相同
→ 可共用題目內容並保留多個 provenance

實質不同
→ 分開保存
```

不要只因學校不同就無限複製同一題，也不要因題目看起來很像就錯誤合併。

---

# 15. 何時回本機 E:\Exam

GitHub-first 適合：

- Markdown
- JSON
- JavaScript
- HTML / CSS
- 純文字設定

回本機適合：

- PNG / JPG
- PDF 裁圖
- 旋轉／校正影像
- 批次轉檔
- 大量檔案操作
- localhost 實際預覽

流程：

```text
先確認 E:\Exam 同步 origin/main
→ 處理 binary
→ 更新 JSON
→ localhost 驗證
→ git add / commit
→ pull --rebase
→ push
```

working tree 不乾淨時不要硬 pull。

---

# 16. 正式匯入前檢查清單

```text
[ ] 題目卷來源正確
[ ] 官方答案卷已尋找／核對
[ ] 學校、年度、學期、年級、科目、段考名稱正確
[ ] 已完整讀卷並建立 census
[ ] 原始題號保存
[ ] 原始選項順序保存
[ ] answerVerified 狀態正確
[ ] Google Sheet／索引已更新
[ ] 章節分類有教材依據
[ ] unknown 沒有被硬猜
[ ] 科目專屬規則已遵守
[ ] 原卷特殊題型沒有被硬改成普通單選
[ ] 圖片題保留重要視覺資訊
[ ] imageAlt / optionImageAlt 已補
[ ] 紙筆題不污染自動計分
[ ] 送分題沒有虛構答案
[ ] 題組共用資料完整
[ ] JSON 可被 runtime 載入
[ ] 網站題數／評量分母正確
[ ] 返回導航正常
[ ] 作答紀錄／錯題功能符合該題型
[ ] 手機畫面可用
[ ] GitHub Pages deployment 成功
[ ] README 已更新
```

---

# 17. 日常 ChatGPT 作業方式

沒有 binary asset：

```text
讀 Drive 題目卷＋答案卷
→ 讀 canonical 教材（需要分類時）
→ 建立／更新 Sheet 索引
→ 讀 GitHub 最新 main
→ 更新 chapter-bank / catalog / runtime
→ commit main
→ 驗證 Pages
```

有圖片／PDF 裁圖：

```text
先完成題目分類與答案驗證
→ 判斷哪些圖是題意必要資訊
→ 原卷裁 PNG／必要旋轉校正
→ binary asset 必要時回 E:\Exam
→ 更新 JSON 引用
→ 實機／localhost 驗證
→ commit / push
```

不要為了一兩個純文字 JSON 修改，就要求使用者手動跑整套 patch。

---

# 18. 已有實作範例

## 18.1 國文

國文已有專用補充 SOP：

```text
CHINESE_SCHOOL_EXAM_WORKFLOW.md
```

可參考其：

- 原卷保存
- 課次 mapping
- 各校題庫 UI
- 跨文本處理

但其他科目只取其「資料治理精神」，不照搬國文題型假設。

## 18.2 自然

第一份正式案例：

```text
高雄市立大灣國中
114 學年度第一學期
七年級第一次段考
自然科
```

已完成：

```text
40 題整卷 census
官方答案卷配對
Google Sheet 逐題索引
```

目前歸入：

```text
自然七上
→ 單元 1 生命現象與科學探究
→ 1-2 科學方法
```

的題目：

```text
原第 3 題
原第 8 題
原第 37 題
原第 40 題
```

GitHub：

```text
chapter-bank/science/7-1/unit-01/section-02/school-exams.json
```

這個案例證明：

```text
國文 workflow 的共同精神
可以延伸到自然
但分類與題型呈現仍依自然教材與考卷特性調整
```

---

# 19. 核心原則摘要

```text
共同 SOP ≠ 所有科目強迫同一模板

真實題目 → 保留真實來源
官方答案 → 高於 AI 推理
原始選項 → 不亂序
完整考卷 → 先 census 再拆題
章節分類 → 回實際教材／canonical
圖片是題意 → 原卷裁圖
不確定分類 → unknown
跨題型差異 → 依原卷特性處理
紙筆題 → 可收錄但不硬做自動判分
送分題 → 保留來源，不虛構答案
純文字修改 → GitHub-first
binary asset → 必要時回 E:\Exam
完成一批 → 更新 README
```

---

# 20. 本文件的定位

`EXAM_WORKFLOW.md` 是**所有科目各校段考的母 SOP**。

科目專用文件可以存在，例如：

```text
CHINESE_SCHOOL_EXAM_WORKFLOW.md
未來可能有 SCIENCE_SCHOOL_EXAM_WORKFLOW.md
未來可能有 MATH_SCHOOL_EXAM_WORKFLOW.md
```

但專用文件只補充該科特性，不應推翻下列共同底線：

```text
來源可追溯
答案可驗證
原卷資訊不任意改寫
章節分類有教材依據
題型依考卷特性處理
網站資料可維護
```

若未來遇到新題型或新考卷格式，本文件應持續更新，而不是硬把新資料塞進舊模板。