# 各科各校段考題處理流程

> 本文件定義 `Exam` 專案中「各科各校段考／公開題庫」的共同處理方式。
>
> 適用科目：國文、英文、數學、自然、社會，以及後續新增科目。
>
> 工作原則依 `README.md`：**GitHub-first；Google Drive 保存原始資料；GitHub Exam 保存真正拿來作答的題庫；只有 binary asset／裁圖／大量本機處理等情況才回本機 `E:\Exam`。**

---

## 1. 三層資料角色

```text
Google Drive
→ 原始段考題目卷
→ 官方答案卷
→ 原始教材／參考資料

Google Sheet（各科可有自己的索引表）
→ 每一題對應到哪一課／章／單元／能力範圍
→ 保留尚未能確定的 unknown

GitHub: chenlijon-dot/Exam
→ 網站可直接使用的題庫 JSON
→ 題目必要圖片 assets
→ runtime / catalog / 題庫程式
```

一句話：

```text
Drive = 原始證據
Sheet = 題目分類索引
GitHub = 正式可作答題庫
```

---

## 2. 標準作業流程

收到一份新的各校段考後，依下列順序處理：

```text
1. 找到原始題目卷
2. 找到官方答案卷
3. 讀完整份考卷與答案
4. 逐題建立或更新 Google Sheet 索引
5. 判斷每題真正對應的課次／章節／單元
6. 將可作答題目寫入對應 chapter-bank JSON
7. 圖片題依原卷裁圖規則建立 asset
8. 驗證答案、選項順序、來源與題數
9. commit 到 GitHub main
10. 確認 GitHub Pages deployment
```

若暫時沒有官方答案卷：

```text
可以先建立 Sheet 索引
可以先保存 pending/source 資料
不可把 AI 推測答案當成官方答案寫入正式自動評量題庫
```

---

## 3. Google Sheet 題目索引

各科可以有自己的 Google Sheet，但建議欄位至少包含：

```text
年分｜國中｜段考｜題號｜出自於
```

其中 `出自於` 可依科目填：

```text
國文 → 第一課〈夏夜〉、第二課〈手的故事〉、第一課〈夏夜〉（跨文本）
數學 → 1-1 正負數、2-3 一元一次方程式、...
自然 → 1-2 科學方法、2-1 生物體的基本構造、...
英文 → Lesson / Unit / Reading / Grammar 範圍
社會 → 地理／歷史／公民的章節或單元
```

無法可靠判斷時保留：

```text
unknown
```

不要為了消除 `unknown` 而硬分類。

### 3.1 題號格式

原卷若有大題結構，保留原始結構：

```text
一-1
一-2
二-1
三-19
```

單純連續題號則保留：

```text
1
2
3
...
```

網站顯示序號與 `originalQuestionNumber` 是兩件事，不要改掉原卷題號。

---

## 4. 正式題庫 JSON 原則

各校段考題來源類型統一為：

```json
"sourceType": "school-exam"
```

題庫通常放在：

```text
chapter-bank/<subject>/<semester>/<unit-or-lesson>/school-exams.json
```

例如：

```text
chapter-bank/chinese/7-1/lesson-01/school-exams.json
chapter-bank/science/7-1/1-2/school-exams.json
```

實際路徑以目前 catalog 與既有 repository 結構為準，不要自行另創平行命名系統。

### 4.1 必須盡量保留的 provenance

每題至少應盡可能保留：

```json
{
  "school": "高雄市立鳳甲國中",
  "year": "114",
  "exam": "第一學期七年級第一次段考",
  "originalQuestionNumber": "14",
  "sourcePage": 2,
  "answerVerified": true
}
```

題目顯示文字可在題尾保留簡短來源：

```text
[114 鳳甲國中]
```

### 4.2 選項順序

真實段考題必須保留原卷選項順序：

```json
"preserveOptionOrder": true
```

不要對真實考題做選項隨機排列。

### 4.3 官方答案優先

答案來源優先順序：

```text
官方答案卷
> 原校公布資料
> 可被可靠驗證的原始來源
> AI 推理
```

只有在已和官方答案核對後，才設：

```json
"answerVerified": true
```

---

## 5. 共通題型處理

### 5.1 一般單選題

使用 `mcq`，或省略 `type` 讓 runtime 以一般單選題處理。

```json
{
  "q": "題目文字 [114 XX國中]",
  "o": ["A選項", "B選項", "C選項", "D選項"],
  "a": 2,
  "e": "解析或答案依據"
}
```

`a` 採 0-based：

```text
A = 0
B = 1
C = 2
D = 3
```

### 5.2 題組／閱讀／共用資料

可用：

```json
"introLabel": "題組標題",
"intro": "共用文章、資料、實驗描述或表格說明"
```

目前 runtime 會在題目上方以 passage box 顯示 `intro`。

適用於：

- 國文閱讀題組
- 英文閱讀題組
- 自然實驗題組
- 社會資料判讀題組
- 數學共用情境題

### 5.3 紙筆題／非自動判分題

使用：

```json
"type": "manual-study"
```

可搭配：

```json
"manualInstruction": "請在紙上作答；本題不列入自動計分。",
"manualAnswer": "官方參考答案"
```

這類題目：

- 顯示在題庫中
- 可顯示參考答案
- 不計入正答率
- 不進入一般錯題統計
- 不污染 AI 自動判分資料

### 5.4 官方「送分」題

若官方答案卷標示：

```text
送分
```

不要自行虛構 A/B/C/D 答案。

建議：

- 保留來源紀錄
- 標明 `officialDisposition: "送分"`
- 不納入自動評量分母
- runtime 尚未支援時可先放 `pendingQuestions`

### 5.5 特殊答案碼

若原校答案卡出現：

```text
AB / AC / BD / ABC / ABD ...
```

先確認它是不是：

- 真正複選題
- 共用選項庫
- 配對題答案碼
- 特殊答案卡編碼

不要看到多個字母就直接當成 checkbox 多選題。

---

## 6. 圖片題處理規則（所有科目共用）

核心原則：

```text
原卷可以直接裁圖
→ 優先使用原卷裁圖

不是：
原圖 → AI 猜測 → 重新生成近似圖
```

若圖片本身會影響題意、選項、比例、位置、字形或版面，就必須保留原圖。

### 6.1 常見必須保留圖片的情況

```text
國文：書法、字形、漫畫、海報、廣告、信封、卡片、圖文配對、版面題
數學：幾何圖、座標圖、方格圖、統計圖、摺紙圖、圖形選項、天平
自然：實驗裝置、顯微圖、構造圖、流程圖、照片判讀、數據圖表
社會：地圖、歷史圖片、統計圖、圖表、區域分布圖
英文：圖片選項、情境圖、圖表、廣告／菜單／時刻表等閱讀素材
```

### 6.2 圖片格式

優先：

```text
原卷掃描／裁切圖 → PNG
```

真正適合向量表示、且不會改變原卷資訊時才考慮 SVG。

若原圖的：

- 筆畫
- 比例
- 角度
- 字體
- 排版
- 相對位置
- 格點
- 圖例

本身就是考點，不要重畫。

### 6.3 JSON 引用方式

目前 `exam-runtime-flex.js` 已支援：

```json
"image": ".../q05-figure.png",
"imageAlt": "第5題附圖"
```

選項圖可使用：

```json
"optionImage": ".../q08-options.png",
"optionImageAlt": "第8題選項圖"
```

圖片與題目文字分開保存，JSON 只引用 asset。

### 6.4 asset 命名

建議命名保留來源資訊：

```text
<school>-<year>-q<question>-figure.png
<school>-<year>-q<question>-options.png
```

例如：

```text
fengjia-114-q23.png
yichang-114-q08-options.png
```

避免不同學校都只有 `q01.png` 而難以追溯。

---

## 7. 何時回本機 `E:\Exam`

依 GitHub-first 規則，一般：

```text
README / Markdown
JSON
JavaScript
HTML / CSS
小型 SVG
```

直接由 GitHub connector 修改。

以下工作才優先回本機：

- PNG / JPG 等 binary asset
- PDF 裁圖
- 壓縮／格式轉換
- 大量檔案批次處理
- connector 無法可靠寫入的 binary
- 需要 localhost 實際預覽

流程：

```text
先確認 E:\Exam 同步 origin/main
→ 處理 binary asset
→ 更新 JSON 引用
→ localhost 驗證
→ git add / commit / pull --rebase / push
```

若 working tree 不乾淨，不要硬 pull。

---

## 8. 科目專屬規則

### 8.1 國文

國文允許「跨文本」歸課。

例如第一課〈夏夜〉教授童詩、擬人、新詩閱讀時，另一篇童詩若明確用來測同一課能力，可以標：

```text
第一課〈夏夜〉（跨文本）
```

但若只能靠模糊聯想，仍保留 `unknown`。

國文常見 `manual-study`：

- 注音國字
- 注釋
- 改錯
- 簡答
- 需要人工判讀的題型

### 8.2 數學

- 公式優先用 KaTeX。
- 圖形本身是題意時，優先原卷裁圖。
- 幾何比例、角度、格點、交點不得用 AI 畫近似圖代替。
- 既有範例：`past-exams/bct/90/first/math.json` 與 `assets/math/`。

### 8.3 自然

- 實驗裝置、顯微圖、器官構造、流程與圖表若影響判讀，保留原圖。
- 實驗題要完整保留控制變因、操縱變因、應變變因與題幹條件。
- 不要把原卷實驗條件簡化到改變答案。

### 8.4 英文

- 閱讀文章與共用情境用 `intro`。
- 圖片、廣告、菜單、表格、時刻表若是閱讀素材，保留原版面。
- 若未來處理聽力題，音檔 provenance 與播放方式須另外定義，不先猜規格。

### 8.5 社會

- 地圖、統計圖、歷史圖片與資料判讀版面優先保留原圖。
- 題目可依地理／歷史／公民再歸入真正章節。

---

## 9. Google Drive 原始檔規則

每份段考至少應盡量保存：

```text
題目卷
答案卷
```

原始 PDF 是後續校對下列事項的最終證據：

- OCR 是否抄錯
- 選項順序
- 題號
- 圖片
- 排版
- 題組範圍
- 官方答案
- 送分題
- 特殊作答格式

不要用整理後 JSON 取代原始考卷。

---

## 10. 正式匯入前檢查清單

```text
[ ] 題目卷來源正確
[ ] 官方答案卷已尋找／核對
[ ] 學校、年度、段考名稱正確
[ ] 原始題號已保存
[ ] 選項順序與原卷一致
[ ] answerVerified 狀態正確
[ ] Google Sheet／索引已更新
[ ] unknown 沒被硬猜成某章節
[ ] 科目特有分類規則已遵守
[ ] 圖片題保留原卷重要視覺資訊
[ ] 圖片有 imageAlt / optionImageAlt
[ ] 紙筆題不計分
[ ] 送分題沒有被硬塞答案
[ ] JSON 可被 runtime 正常載入
[ ] 網站題數與自動評量分母正確
[ ] GitHub Pages deployment 成功
```

---

## 11. 日常 ChatGPT 作業方式

沒有 binary asset：

```text
讀 Drive 題目卷＋答案卷
→ 更新各科 Google Sheet／索引
→ 讀 GitHub 最新 main
→ 直接更新 school-exams.json / catalog / runtime
→ commit main
→ 驗證 Pages
```

有圖片或其他 binary asset：

```text
先完成題目分類與答案驗證
→ 決定哪些原圖是題意必要資訊
→ 原卷裁 PNG
→ binary asset 回 E:\Exam 處理
→ JSON 與程式同步更新
→ localhost 驗證
→ commit / push
```

不要因為只有一兩個 JSON 小修改，就要求使用者跑整套 PowerShell patch。

---

## 12. 核心原則摘要

```text
真實題目 → 保留真實來源
官方答案 → 高於 AI 推理
原始選項 → 不亂序
圖片是題意 → 原卷裁圖
不確定分類 → unknown
科目特有延伸分類 → 明確標示
紙筆題 → 可收錄、不計分
送分題 → 保留來源、不虛構答案
純文字修改 → GitHub-first
binary asset → 必要時回 E:\Exam
```

本文件是各科各校段考題後續整理、匯入、校對與網站呈現的共用 SOP。