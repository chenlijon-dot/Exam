# 國文各校段考題處理流程

> 本文件定義 `Exam` 專案中「國文各校段考／公開題庫」的正式處理方式。
>
> 適用範圍：原始考卷、官方答案卷、Google Sheet 課次索引、章節題庫 JSON、閱讀題組、紙筆題、圖片題與來源 provenance。
>
> 工作原則依 `README.md`：**GitHub-first；Google Drive 保存原始資料；GitHub Exam 保存真正拿來作答的題庫；只有 binary asset／裁圖等工作才回本機 `E:\Exam`。**

---

## 1. 三層資料角色

```text
Google Drive
→ 原始段考題目卷
→ 官方答案卷
→ 原始教材／參考資料

Google Sheet：國文科_各校段考題課次索引
→ 每一題對應到哪一課／哪一類
→ 保留尚未能確定的 unknown

GitHub: chenlijon-dot/Exam
→ 網站可直接使用的題庫 JSON
→ 題目必要圖片 assets
→ runtime / catalog / 題庫程式
```

一句話：

```text
Drive = 原始證據
Sheet = 題目課次索引
GitHub = 正式可作答題庫
```

---

## 2. 標準作業流程

收到一份新的國文段考後，依下列順序處理：

```text
1. 找到原始題目卷
2. 找到官方答案卷
3. 讀完整份考卷與答案
4. 逐題建立 Google Sheet 索引
5. 判斷哪些題目可歸入既有課次
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

## 3. Google Sheet 課次索引

目前使用：

```text
國文科_各校段考題課次索引
```

固定欄位：

```text
年分｜國中｜段考｜題號｜出自於
```

例如：

```text
114｜高雄市立鳳甲國中｜第一學期七年級第一次段考｜14｜第一課〈夏夜〉
114｜高雄市立鳳甲國中｜第一學期七年級第一次段考｜27｜第一課〈夏夜〉（跨文本）
114｜高雄市立鳳甲國中｜第一學期七年級第一次段考｜29｜unknown
```

### 3.1 題號格式

原卷若有大題結構，保留原始結構：

```text
一-1
一-2
二-1
三-19
```

單純連續選擇題則可用：

```text
1
2
3
...
```

不要為了網站顯示而改掉原卷題號；網站內部顯示序號與 `originalQuestionNumber` 是兩件事。

### 3.2 `出自於` 的判斷

優先使用：

```text
第一課〈夏夜〉
第二課〈手的故事〉
第三課〈吃冰的滋味〉
...
```

若不是直接課文內容，但明確是該課所延伸的文體、修辭或閱讀能力，可標：

```text
第一課〈夏夜〉（跨文本）
```

國文科允許「跨文本」歸課，因為段考常用另一篇文章測同一課所教的：

- 文體
- 修辭
- 寫作手法
- 閱讀理解
- 主旨判讀
- 語文知識

例如〈夏夜〉教授童詩、擬人與新詩閱讀時，另一首童詩可合理列為：

```text
第一課〈夏夜〉（跨文本）
```

但若只能靠模糊聯想，或沒有足夠依據判斷來源課次，保留：

```text
unknown
```

不要為了消除 `unknown` 而硬分類。

---

## 4. 正式題庫 JSON 原則

各校段考題來源類型統一為：

```json
"sourceType": "school-exam"
```

國文各校題庫通常放在：

```text
chapter-bank/chinese/<semester>/<lesson>/school-exams.json
```

例如：

```text
chapter-bank/chinese/7-1/lesson-01/school-exams.json
```

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

題目顯示文字建議在題尾保留簡短來源：

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

正式題目應標：

```json
"answerVerified": true
```

只有在已和官方答案核對後才設為 `true`。

---

## 5. 國文題型處理

### 5.1 一般單選題

使用 `mcq`，或省略 `type` 讓 runtime 以一般單選題處理。

基本結構：

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

### 5.2 閱讀題組

閱讀文章可放在：

```json
"introLabel": "閱讀題組｜〈文章名〉作者",
"intro": "文章全文或題組文字"
```

目前 runtime 會在題目上方以 passage box 顯示 `intro`。

同一篇閱讀文章若對應多題，可在各子題保留相同的 `intro` / `introLabel`，之後若 runtime 升級成共享 `reading-group` 再做資料結構優化。

### 5.3 紙筆題／注釋題／非自動判分題

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
- 不應進入錯題統計
- 不應污染 AI 自動判分資料

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

若目前 runtime 不直接顯示此類題，可先留在 `pendingQuestions` 或來源紀錄中。

### 5.5 特殊答案碼

若原校答案卡使用：

```text
AB / AC / BD / ABC / ABD ...
```

先確認它是不是「答案卡編碼」或「配對代碼」。

不要看到多個字母就直接判定為 multiple-select。

例如共用選項庫／配對題應另外視為 `matching-code` 類型，不要錯做 checkbox 多選題。

---

## 6. 國文圖片題處理規則

國文圖片題比照 90 年第一次基測數學科的圖片處理原則。

核心原則：

```text
原卷可以直接裁圖
→ 使用原卷裁圖

不是：
原圖 → AI 猜測 → 重新畫一張近似圖
```

這條規則同樣適用國文。

### 6.1 哪些國文題必須保留圖片

常見包括：

- 書法字體辨識
- 字形比較
- 漫畫
- 廣告
- 海報
- 圖文配對
- 表格
- 卡片／信封格式
- 題辭版面
- 圖示選項
- 排版本身就是題意的題目

若失去圖片後會改變題意、降低可判讀性或讓選項失真，就必須保留原圖。

### 6.2 圖片格式

優先：

```text
原卷掃描／裁切圖 → PNG
```

只有真正適合向量重建、且不會改變原卷資訊時才考慮 SVG。

若原圖的：

- 筆畫
- 比例
- 字體
- 排版
- 相對位置
- 圖框
- 圖例

本身就是考點，不要重畫。

### 6.3 JSON 引用方式

目前 `exam-runtime-flex.js` 已支援：

```json
"image": ".../q05-figure.png",
"imageAlt": "第5題附圖"
```

若圖片主要屬於選項區，可使用：

```json
"optionImage": ".../q08-options.png",
"optionImageAlt": "第8題選項圖"
```

runtime 會分別渲染題目附圖與選項圖。

### 6.4 asset 位置

章節題庫建議把圖片放在對應 lesson 底下，例如：

```text
chapter-bank/chinese/7-1/lesson-01/
├─ school-exams.json
└─ assets/
   ├─ fengjia-qxx.png
   └─ yiychang-qxx.png
```

命名應保留學校／題號或至少能清楚追溯來源，避免未來不同學校都出現 `q01.png` 而混淆。

例如：

```text
fengjia-114-q23.png
yichang-114-q08-options.png
```

---

## 7. 圖片題何時需要回本機 `E:\Exam`

依 GitHub-first 規則，一般 JSON／JS／Markdown 直接由 GitHub connector 修改。

只有需要 binary asset 時才走本機：

```text
ChatGPT / 原卷 PDF
        ↓
裁出原始 PNG
        ↓
下載到 Windows
        ↓
確認 E:\Exam 已同步 origin/main
        ↓
Copy-Item 到正確 assets 位置
        ↓
修改 JSON 引用
        ↓
localhost 驗證
        ↓
git add / commit / pull --rebase / push
```

開始本機處理前：

```powershell
git -C E:\Exam status
git -C E:\Exam pull --rebase origin main
```

若 working tree 不乾淨，不要硬 pull。

---

## 8. Google Drive 原始檔規則

每份段考原始資料至少應盡量保存：

```text
題目卷
答案卷
```

不要用整理後 JSON 取代原始 PDF。

原始 PDF 是後續處理下列問題的最終證據：

- OCR 是否抄錯
- 選項順序
- 題號
- 圖片
- 排版
- 題組範圍
- 官方答案
- 送分題
- 特殊作答格式

---

## 9. 正式匯入前檢查清單

每批題目至少確認：

```text
[ ] 題目卷來源正確
[ ] 官方答案卷已尋找／已核對
[ ] 學校、年度、段考名稱正確
[ ] 原始題號已保存
[ ] 選項順序與原卷一致
[ ] answerVerified 狀態正確
[ ] Google Sheet 每題都有索引
[ ] unknown 沒被硬猜成某一課
[ ] 跨文本題有清楚標「（跨文本）」
[ ] 圖片題保留原卷重要視覺資訊
[ ] 圖片有 imageAlt / optionImageAlt
[ ] 紙筆題不計分
[ ] 送分題沒有被硬塞答案
[ ] JSON 結構可被 runtime 正常載入
[ ] 網站顯示題數與自動評量分母正確
[ ] GitHub Pages deployment 成功
```

---

## 10. 建議的日常 ChatGPT 作業方式

一般沒有圖片的新段考：

```text
讀 Drive 題目卷＋答案卷
→ 更新 Google Sheet
→ 讀 GitHub 最新 main
→ 直接更新 school-exams.json
→ commit main
→ 驗證 Pages
```

有圖片的段考：

```text
讀 Drive 原卷
→ 先完成題目分類與答案驗證
→ 決定哪些圖片是題意必要資訊
→ 原卷裁 PNG
→ binary asset 回 E:\Exam 處理
→ JSON / 程式仍維持 GitHub-first 或在同一批本機 commit
→ 驗證 Pages
```

不要因為只有一兩個 JSON 小修改，就要求使用者跑整套 PowerShell patch。

---

## 11. 目前可參考的既有實作

圖片題實作範例：

```text
past-exams/bct/90/first/math.json
past-exams/bct/90/first/assets/math/
```

其中已存在：

- 題目附圖 `image`
- `imageAlt`
- 選項圖 `optionImage`
- 原卷裁圖 PNG（例如 `q26-options.png`）
- SVG 圖形 asset

國文圖片題沿用同一個「題目文字與圖片 asset 分離、JSON 指向圖片」的架構。

---

## 12. 核心原則摘要

```text
真實題目 → 保留真實來源
官方答案 → 高於 AI 推理
原始選項 → 不亂序
圖片是題意 → 原卷裁圖
跨文本 → 可以歸課，但要明標
不確定 → unknown
紙筆題 → 可收錄、不計分
送分題 → 保留來源、不虛構答案
純文字修改 → GitHub-first
binary asset → 必要時回 E:\Exam
```

這份流程是國文各校段考題後續整理、匯入與校對的預設 SOP。
