# 各科各校段考題處理流程

> 本文件定義 `Exam` 專案中「各科各校段考／公開題庫」的共同母 SOP。
>
> 適用科目：**國文、英文、數學、自然、社會，以及後續新增科目。**
>
> 本文件不把所有科目的題型硬壓成同一種格式；它統一的是：**來源、分類、答案驗證、provenance、GitHub 題庫建置、網站接線、重新歸類與驗證方式。**
>
> 科目專屬文件可以存在，例如國文的舊有補充文件；但若與本文件衝突，以本文件的共同資料治理原則為準。
>
> 最後更新：2026-09-15

---

# 1. 核心目標

收到一份學校段考卷，不是單純把 PDF 轉成 JSON，而是完成一條可持續維護的資料鏈：

```text
原始題目卷 + 官方答案卷
        ↓
整卷 census
        ↓
Google Sheet 逐題索引
        ↓
實際教材／canonical 教材知識庫比對
        ↓
章節／課次／小節／concept mapping
        ↓
題型與答案驗證
        ↓
GitHub chapter-bank
        ↓
各章節「各校題庫」網站入口
        ↓
作答／返回／再次進入／錯題／手機實測
        ↓
日後教材增加時重新掃 unknown／舊分類
```

最重要的不是「每題都一定要分到某一課」，而是：

```text
能確定才歸類
不能確定就 unknown
教材增加後可以重新判讀
分類錯了可以回溯修正
原始考卷永遠保留作為 evidence
```

---

# 2. 四層資料角色

## 2.1 Google Drive = 原始 evidence + 教材 authority

保存：

```text
各校原始題目卷 PDF／圖片
官方答案卷
更正版／補充說明
原始教材／課本／講義
canonical 教材知識庫
```

原卷用來核對：

```text
題號
選項順序
圖片
題組範圍
版面
答案
送分
特殊答案碼
```

教材／canonical 用來判斷：

```text
這題真正出自哪一課／哪一章／哪一小節／哪個 concept
```

## 2.2 Google Sheet = 逐題分類索引

各科可有自己的索引表，例如：

```text
國文科_各校段考題課次索引
自然科_各校段考題章節索引
```

最低欄位：

```text
年分｜國中｜段考｜題號｜出自於
```

可擴充：

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

Sheet 是「逐題 mapping 工作台」，不是原始題目本體。

## 2.3 GitHub `chenlijon-dot/Exam` = 正式網站題庫

保存：

```text
chapter-bank JSON
題目必要 assets
catalog
runtime
各校題庫載入與合併設定
README / workflow
```

## 2.4 Private `Exam-Record` = 個人學習結果

保存：

```text
作答紀錄
錯題
AI request/result
machine-readable curriculum
```

一句話：

```text
Drive       = 原始證據 + 教材 authority
Sheet       = 逐題分類索引
GitHub Exam = 正式可作答題庫
Exam-Record = 個人學習結果
```

---

# 3. 收到新考卷後的標準流程

本流程分成「快速擷取」與「正式納入」兩段。大量圖片／PDF 不再逐題跑完整正式流程。

## 3.1 第一階段：整卷快速擷取（RAW → STAGING）

```text
1. 在 Drive 找到題目卷
2. 有答案卷則一起定位，但此階段不要求完成答案 QA
3. 確認學校／年度／學期／年級／科目／段考次別
4. 確認頁碼／題號／大題順序
5. 連續辨識整卷
6. 保留題號、題幹、選項、題組文字
7. 圖題先記 [有圖] / image pending / 頁碼
8. 看不清處標 [待人工確認]
9. 寫入 staging 文字檔／校正版
10. 整卷或整批完成後才停
```

RAW → STAGING 階段預設不做：

```text
完整 census 深度分類
Google Sheet 精細 mapping
canonical 逐題回查
正式 answerVerified
questionId / revision
chapter-bank sidecar
runtime 接線
Pages deploy
```

這一段的目標是先把原卷內容快速、完整地「吃進來」。

## 3.2 第二階段：正式納入（STAGING → ACTIVE）

staging 文字層完整後，再批次進行：

```text
1. 完整閱讀整份考卷
2. 建立正式 census
3. 在 Google Sheet 建立整卷逐題索引
4. 第一輪 chapter / lesson mapping
5. 不確定題回查 canonical
6. 無法可靠判斷者標 unknown
7. 判斷題型與 runtime 需求
8. 以官方答案卷核對答案
9. 完成 provenance / answerVerified
10. 正式題建立 questionId + revision
11. 適合網站呈現者寫入 chapter-bank
12. pending 題保留但不混入正式自動評量
13. 更新 runtime / schoolCount / subtitle
14. 驗證 JSON、導航、返回、再次進入
15. commit / push main
16. Pages 部署後實機抽查
17. 日後教材增加時重新掃 unknown 與低信心分類
```

正式 promotion 另須遵守 README 第 23.1 節與 question-bank governance spec。

沒有答案卷時仍可做：

```text
原卷保存
census
Sheet 索引
章節初步 mapping
pending 題目保存
```

但不可：

```text
把 AI 推測答案標成官方答案
把未驗證題混進正式自動評量
設 answerVerified: true
```

---

# 4. 整卷 census：一定先看完整份考卷

不要只抓到幾題像某章就開始拆題。

至少盤點：

```text
總頁數
總作答項目數
大題結構
單選
複選
填充
改錯
注音／國字
計算
證明
手寫題
閱讀／實驗／資料題組
共用文章
共用圖表
地圖
統計圖
實驗圖
圖片選項
共用選項庫
特殊答案碼
送分題
跨單元範圍
```

「總作答項目數」不一定等於印刷上的連續題號。

例如：

```text
第一大題 8 格填空
第二大題 10 格字音字形
第三大題 8 格解釋
第四大題 35 題選擇

→ census 應知道共有 61 個作答項目
```

---

# 5. Google Sheet 逐題索引規則

## 5.1 題號忠實保留

原卷有大題結構：

```text
一-1
二-6
三-2
四-17
```

原卷是連號：

```text
1
2
3
...
```

Sheet 的題號與網站重新編排後的顯示序號不同。

GitHub 題目要另保留：

```json
"originalQuestionNumber": "三-2"
```

## 5.2 unknown 是正式狀態，不是失敗

無法可靠歸類：

```text
unknown
```

常見原因：

```text
版本不同
教材尚未收集到該課
補充教材
一般語文／一般能力
獨立閱讀
跨章但缺乏足夠教學關聯
只在某個選項中碰巧出現課文字詞
```

不能因為「看起來像」就硬歸課。

## 5.3 Sheet 與 GitHub 必須同步修正

若日後重新判定：

```text
unknown → 第三課
第一課 → unknown
第二課 → 第五課跨文本
```

要同步檢查：

```text
Google Sheet mapping
GitHub 題庫位置
lessonMapping / chapterTags / conceptIds
runtime merge path
學校數與題數顯示
```

不能只改 Sheet，不管網站；也不能網站搬題後 Sheet 還停在舊分類。

---

# 6. 章節分類：一定回到實際教材

分類優先順序：

```text
使用者提供的實際教材／正式課本
→ Google Drive canonical 教材知識庫
→ 已確認 catalog／目錄
→ 原卷命題範圍文字
→ 模型一般知識只作輔助
```

## 6.1 不要用關鍵字機械分類

錯誤例子：

```text
題目選項裡出現「童叟無欺」
→ 就直接丟進〈吃冰的滋味〉
```

正確判斷要問：

```text
題目真正考的是什麼？
正解所需知識是否來自這一課？
這個概念是否在 canonical 教材中？
若拿掉那個碰巧出現的選項，題目是否仍屬該課？
```

如果答案是否定的，就不要硬歸。

## 6.2 跨文本可以歸課，但要有教學關聯

例如：

```text
第三課〈吃冰的滋味〉（跨文本：飲食與懷舊）
第五課〈論語選〉（跨文本：見賢思齊／自省）
```

成立條件：

```text
它測的是該課已教過的閱讀方法／主旨／修辭／價值概念／能力
而不是單純主題有點像
```

## 6.3 新教材進來後要重新掃舊資料

這是正式流程的一部分。

```text
canonical 教材新增到新課
→ 回頭查 Google Sheet 的 unknown
→ 也抽查以前低信心分類
→ 能確定者重新 mapping
→ 有誤歸者退回 unknown 或搬到正確章節
→ 再同步 GitHub 題庫
```

因此：

```text
unknown = 可等待更多教材證據的暫存分類
```

不是永遠不處理。

---

# 7. canonical 教材知識庫與段考的雙向關係

主要方向：

```text
教材
→ canonical
→ chapter / lesson / section / concept
→ 段考 mapping
```

但段考也能提醒我們檢查教材整理是否缺漏：

```text
某校反覆考某概念
→ 回 canonical 查證
→ 若教材確實有但 canonical 漏寫
→ 補 canonical
```

不可：

```text
某校出了一題
→ 就直接把該概念宣告成正式教材內容
```

一定要回原始教材驗證。

---

# 8. GitHub chapter-bank 目錄與檔案策略

依現有 repository 的 catalog 建置，不自行另創平行命名。

共同概念：

```text
chapter-bank/<subject>/<semester>/<chapter-or-lesson>/...
```

自然實例：

```text
chapter-bank/science/7-1/unit-01/section-02/
```

國文實例：

```text
chapter-bank/chinese/7-1/lesson-03/
chapter-bank/chinese/7-1/language-01/
```

## 8.1 各校題庫與自編題完全分開

```text
practice-easy.json
practice-medium.json
practice-hard.json
```

屬於：

```json
"sourceType": "practice-generated"
```

各校真題屬於：

```json
"sourceType": "school-exam"
```

不可互相混用。

## 8.2 推薦使用「每一來源批次 sidecar」

實際運作已證明，當同一章節累積多校真題時，推薦：

```text
school-exams.json                         # 可作 base / legacy bank
school-exams-<school>-<year>.json        # 一校一批 sidecar
```

例如：

```text
school-exams-siyu-114.json
school-exams-yushan-114.json
school-exams-zuoying-113.json
```

好處：

```text
來源清楚
新增一校不必大改巨型 JSON
容易回滾
容易重新歸類
答案待驗證時可獨立 pending
不同學校不互相污染
```

若該章第一次建立各校題庫，也可以直接以第一個 sidecar 作 `bankPath`，不必為了形式硬建立空的 `school-exams.json`。

## 8.3 runtime 合併，而不是人工複製

網站可採：

```text
bankPath   = 主檔／第一個來源
extraPaths = 其他學校 sidecar
```

載入時：

```text
依序 fetch
→ 合併 questions
→ 重新給網站顯示 number
→ 保留 originalQuestionNumber
```

不要為了讓網站讀得到，就把同一題再複製進另一個 aggregate JSON。

---

# 9. school-exam JSON 最低資料規格

建議來源層 metadata：

```json
{
  "source": {
    "school": "XX市立XX國中",
    "year": "114",
    "exam": "第一學期七年級第一次段考",
    "sourceType": "school-exam",
    "sourceFile": "原始題目卷.pdf",
    "answerFile": "官方答案卷.pdf",
    "answerVerified": true
  }
}
```

單題至少保留：

```json
{
  "originalQuestionNumber": "17",
  "school": "XX市立XX國中",
  "year": "114",
  "exam": "第一學期七年級第一次段考",
  "type": "mcq",
  "answerVerified": true,
  "lessonMapping": "1-2 科學方法",
  "q": "題目文字 [114 XX國中]",
  "o": ["A", "B", "C", "D"],
  "a": 1,
  "e": "官方答案與必要解析"
}
```

可再加入：

```text
sourcePage
sourceUrl
chapterTags[]
conceptIds[]
verificationStatus
notes
introLabel
intro
image
imageAlt
optionImage
optionImageAlt
```

---

# 10. provenance 絕對不能丟

來源至少應能回答：

```text
哪一校？
哪一年？
哪次段考？
原卷第幾題？
答案是否官方核對？
原始檔在哪裡？
```

網站題幹可附簡短來源：

```text
[114 四育國中]
[113 左營國中]
```

但簡短顯示不能取代結構化 provenance。

---

# 11. 答案驗證與 pending 流程

答案來源優先：

```text
官方答案卷
> 原校正式公布資料
> 可可靠驗證的原始來源
> 可靠二手資料
> AI 推理只能最後輔助
```

只有完成核對：

```json
"answerVerified": true
```

## 11.1 pendingQuestions

答案還沒確認、特殊題型 runtime 尚未支援，或原卷需再人工視覺核對時，可放：

```json
"pendingQuestions": []
```

常見 status：

```text
pending-answer-key
pending-answer-key-visual-verification
pending-special-runtime
pending-special-option-code-runtime
```

pending 原則：

```text
可以保存 provenance
可以保存原題
不可進正式 questions 自動評量
```

## 11.2 pending 升級成正式題

取得官方答案後：

```text
找到 pending 題
→ 依 school + year + originalQuestionNumber 確認身分
→ 建立正式 question
→ answerVerified = true
→ 從 pendingQuestions 移除
→ 不得同時留下正式題 + pending 重複副本
```

升級後重新計算：

```text
自動評量題數
紙筆題數
schoolCount
網站 subtitle
```

---

# 12. 真實段考選項順序

真實考題：

```json
"preserveOptionOrder": true
```

不能像自編題一樣隨機 A/B/C/D。

理由：

```text
官方答案以原始選項位置為基礎
特殊題碼可能與原順序有關
後續人工比對原卷較容易
```

---

# 13. 共通題型資料模型

## 13.1 一般單選題

```json
{
  "type": "mcq",
  "q": "題目文字 [114 XX國中]",
  "o": ["A選項", "B選項", "C選項", "D選項"],
  "a": 2,
  "e": "解析"
}
```

答案 index：

```text
A = 0
B = 1
C = 2
D = 3
```

## 13.2 題組／閱讀／共用資料

```json
"introLabel": "題組名稱",
"intro": "共用文章／情境／實驗描述／資料"
```

適用：

```text
國文閱讀題組
英文閱讀／克漏字
數學共用情境
自然實驗題組
社會資料判讀
```

同題組的多題可重用同一段 intro；不要為了拆題而丟失共用文章。

## 13.3 manual-study：紙筆題／不適合自動判分

```json
{
  "type": "manual-study",
  "gradingMode": "manual",
  "manualInstruction": "請在紙上作答；完成後自行核對。",
  "manualAnswer": "官方參考答案"
}
```

適用：

```text
國字注音
改錯
解釋
翻譯
計算過程
證明
作文式短答
```

原則：

```text
可收錄
可顯示參考答案
不進自動正答率
不進一般錯題統計
不污染 AI 自動判分
```

## 13.4 官方送分題

不要虛構一個正確選項。

```json
"officialDisposition": "送分"
```

並排除自動評量分母。

## 13.5 特殊答案碼／共用選項庫

遇到：

```text
AB / AC / BD / ABC
```

先判斷：

```text
真複選？
共用選項庫？
配對題？
答案卡編碼？
```

不要看到多字母就直接改成 checkbox。

若 runtime 尚未支援：

```text
保留原題 + 官方答案碼
→ pending-special-runtime
```

---

# 14. 圖片題：全科共同規則

核心：

```text
原卷可裁圖
→ 優先使用原卷裁圖
```

不要：

```text
原圖
→ AI 看懂
→ 重新生成一張類似圖
```

只要圖片會影響：

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

## 14.1 常見圖題

```text
國文：書法、漫畫、廣告、信封、圖文閱讀
英文：情境圖、菜單、時刻表、廣告
數學：幾何、座標、方格、統計圖、摺紙、圖形選項
自然：實驗裝置、顯微圖、構造圖、流程圖、數據圖表
社會：地圖、歷史圖片、統計圖、區域分布
```

## 14.2 檔案格式

優先：

```text
原卷裁切 → PNG
```

真正適合向量化且資訊不會改變才用 SVG。

## 14.3 JSON

```json
"image": ".../q05-figure.png",
"imageAlt": "第5題附圖"
```

選項圖：

```json
"optionImage": ".../q08-options.png",
"optionImageAlt": "第8題選項圖"
```

## 14.4 asset 命名

```text
<school>-<year>-q<question>-figure.png
<school>-<year>-q<question>-options.png
```

## 14.5 圖片一律使用實體檔案，禁止 Base64

正式題庫的教材圖、考題圖、表格、地圖、幾何圖、照片、圖形選項，一律保存為真正的圖片檔案。

標準：

```text
原卷／原 PDF
→ 裁出作答必要區域
→ PNG / JPG / WebP
→ GitHub assets
→ JSON 記錄相對路徑
→ 網頁用 <img> 顯示
```

例如：

```json
{
  "image": "assets/questions/science/114-dawan/q04.png",
  "imageAlt": "第4題附圖"
}
```

禁止：

```text
"image": "data:image/png;base64,..."
把整張圖片 Base64 塞進 JSON
把 Base64 塞進 JS / HTML
把大型 binary 轉成文字後再經 connector / ChatGPT 搬運
```

理由：

```text
Base64 會膨脹資料量
Git diff 幾乎不可讀
容易超過 API / connector payload
容易 timeout / truncation
瀏覽器與 repository 都更難維護
```

例外只限非常小、純 UI 裝飾用途的 icon／SVG；任何會影響題意或作答的圖片都不得 Base64 內嵌。

原始完整 evidence 留在 Google Drive；GitHub 只放網站真正需要的裁切 asset。

---

# 15. 各章節「各校題庫」功能建置方式

這一節是近期實作後正式確立的共同規則。

## 15.1 章節已有題庫

流程：

```text
新增學校 sidecar JSON
→ 加入該章 bank config 的 extraPaths
→ schoolCount 改成「不同學校數」
→ runtime 合併 questions
→ 網站各校題庫直接進入混合真題
```

`schoolCount` 是：

```text
實際不同學校數
```

不是：

```text
JSON 檔數
題目數
```

同一學校不同年度若 UI 要顯示「校數」，仍算同一校；若未來要顯示「來源批次數」，另設欄位，不混用。

## 15.2 章節第一次有各校題庫

需要同時做：

```text
1. 建立 chapter-bank 目錄（若尚無）
2. 建立第一份 school-exam JSON
3. catalog 顯示「各校題庫」卡
4. runtime 建立 bank config
5. 設定 lesson/chapter key
6. 設定 backLabel
7. 設定 loadingText
8. 設定 schoolCount
9. 測試可進入
10. 測試返回後可再次進入
```

不要只有 JSON 有檔案，但網站入口仍是 disabled。

## 15.3 不列學校清單，直接進混合真題

目前的 UX 原則：

```text
點「各校題庫」
→ 直接進入該章節全部已收錄的各校題目
```

題目本身以：

```text
[年份 XX國中]
```

標示來源。

## 15.4 合併後重新編網站 display number

runtime 可：

```text
合併多個 sidecar
→ questions.forEach((q, i) => q.number = i + 1)
```

但永遠保留：

```json
"originalQuestionNumber": "原卷題號"
```

---

# 16. 導航與 runtime 特別注意事項

題庫不是「能打開一次」就算完成。

必測：

```text
進入各校題庫
→ 作答／返回
→ 回到章節題庫頁
→ 再次點各校題庫
→ 還能正常進入
```

## 16.1 disabled button 必須 reset

載入時可以暫時：

```text
button.disabled = true
```

但：

```text
載入成功
載入失敗
返回章節
```

三條路徑都要恢復 enabled。

否則會出現：

```text
卡片看得到
但返回後再也點不進去
```

## 16.2 MutationObserver 不可自己觸發無限迴圈

若 catalog 用 `MutationObserver` 自動 enhance UI：

```text
不要每次 observer 觸發都無條件重寫 textContent
```

建議：

```js
function setTextIfChanged(node, text) {
  if (node && node.textContent !== text) node.textContent = text;
}
```

否則可能：

```text
DOM 更新
→ observer
→ 再寫 DOM
→ observer
→ 無限循環
→ 整頁卡死
```

此規則適用所有科目的動態 catalog。

## 16.3 不要重複綁 click handler

可用 dataset guard：

```text
data-direct-school-bank = 1
```

或科目自己的等價方式，確保同一按鈕不會重複綁多次。

---

# 17. 題數與 subtitle 計算

混合題庫時應由實際載入結果計算：

```text
manualCount = manual-study 題數
autoCount   = total - manualCount
```

subtitle 可顯示：

```text
XX 題自動評量＋YY 題紙筆練習
```

不要手寫一個永遠不更新的題數。

新增／移除／重新歸類題目後，都要重新確認：

```text
頁面顯示題數
評量分母
紙筆題數
schoolCount
```

---

# 18. 重新歸類與搬題流程

教材收集持續增加，因此「重新歸類」是正常維護工作。

正式流程：

```text
1. 找出 Sheet 的 unknown 或低信心分類
2. 讀最新 canonical
3. 回看原始題目卷
4. 判斷真正測驗概念
5. 必要時回看官方答案與詳解
6. 更新 Sheet
7. 若 GitHub 已有該題：從錯誤章節移除
8. 加入正確章節 sidecar
9. 更新 lessonMapping / conceptIds
10. 更新 runtime merge paths（若新章第一次有題）
11. 更新 schoolCount
12. 確認沒有重複題
13. 實測網站
```

可能結果包括：

```text
unknown → 某章
某章 → unknown
某章 → 另一章
某章 → 某章（跨文本）
```

## 18.1 寧可退回 unknown

若重新查教材後發現原分類只是「碰巧出現課文詞語」：

```text
直接退回 unknown
```

這比讓錯誤 mapping 長期污染題庫更好。

---

# 19. 重複題與 sidecar 去重

不同學校可能：

```text
完全相同題
同題庫來源
只換人名
只換數字
```

處理原則：

```text
完全相同且希望節省資料
→ 可共用題目內容並保留多 provenance

實質不同
→ 分開保存
```

同一來源 sidecar 內，重新跑匯入工具時應盡量做到 idempotent：

```text
用 school + year + originalQuestionNumber
或其他穩定 key
判斷 replace / skip
```

不要每跑一次 script 就新增一份重複題。

---

# 20. 科目適應層

共同 SOP 不等於共同題型。

## 20.1 國文

常見：

```text
課文理解
字音字形
注釋
修辭
國學常識
標點
跨文本
閱讀題組
紙筆題
```

跨文本歸課必須有明確教學關聯。

## 20.2 英文

常見：

```text
Vocabulary
Grammar
Dialogue
Cloze
Reading
Translation
Listening
廣告／菜單／時刻表／圖片情境
```

聽力若正式收錄，需另外保留：

```text
音檔來源
播放規則
題組關聯
```

## 20.3 數學

常見：

```text
純計算
文字應用
幾何
作圖
證明
統計圖表
```

公式可用 KaTeX。

圖形比例、角度、座標、格點不得 AI 近似重畫。

## 20.4 自然

常見：

```text
概念
實驗設計
變因判讀
器材
顯微圖
構造圖
流程圖
數據圖表
實驗題組
```

不能為縮短題目而刪掉會影響答案的：

```text
操縱變因
控制變因
應變變因
材料差異
溫度
時間
濃度
```

## 20.5 社會

可再分：

```text
地理
歷史
公民
```

常見：

```text
地圖
時間軸
史料
歷史圖片
統計圖
表格
法條／制度情境
```

---

# 21. 考卷特性優先於現有 runtime

正確方向：

```text
忠實保留原卷
→ 用現有 runtime 呈現
→ runtime 不足時擴充 runtime
```

錯誤方向：

```text
runtime 現在只會四選一
→ 所以把所有題目硬改成四選一
```

例如：

```text
注音題
→ manual-study

共用選項碼 AB / AC
→ 保留原格式 pending

閱讀文章
→ intro + questions

圖片選項
→ optionImage
```

---

# 22. GitHub-first 與回本機的界線

## GitHub-first

適合：

```text
Markdown
JSON
JavaScript
HTML
CSS
純文字設定
```

## 回本機 `E:\Exam`

適合：

```text
PNG / JPG
PDF 裁圖
旋轉／校正影像
批次轉檔
大量 sidecar 批次產生
localhost 實際預覽
```

本機流程：

```text
git status
→ 確認 working tree
→ 必要時 git pull --rebase origin main
→ 執行 patch / binary 處理
→ JSON UTF-8 驗證
→ git diff --check
→ localhost 實測
→ git add -A
→ git diff --cached --check
→ commit
→ git pull --rebase origin main
→ push
→ git status 應 clean
```

working tree 不乾淨時不要硬 pull。

---

# 23. 驗證清單

每批正式匯入前至少檢查：

```text
[ ] 題目卷來源正確
[ ] 答案卷已尋找／核對
[ ] 學校／年度／學期／年級／科目／段考名稱正確
[ ] 已完整 census
[ ] Sheet 每個作答項目有索引
[ ] originalQuestionNumber 正確
[ ] 原始選項順序保留
[ ] preserveOptionOrder = true
[ ] answerVerified 狀態正確
[ ] unknown 沒有硬猜
[ ] 跨文本有明確教學關聯
[ ] pending 沒混進正式 questions
[ ] pending 升級後舊 pending 已移除
[ ] 圖題保留必要視覺資訊
[ ] imageAlt / optionImageAlt 已補
[ ] 題組 intro 完整
[ ] manual-study 不進自動評量分母
[ ] 送分題沒有虛構答案
[ ] sidecar 沒重複題
[ ] runtime merge paths 完整
[ ] schoolCount 是不同學校數
[ ] 題數／subtitle 與實際載入一致
[ ] JSON UTF-8 可解析
[ ] JS 無語法錯誤（可用環境允許的方式檢查）
[ ] 返回章節正常
[ ] 返回後可再次進各校題庫
[ ] MutationObserver 無無限更新
[ ] 作答／交卷／詳解正常
[ ] 錯題／紀錄符合該題型
[ ] 手機畫面可用
[ ] GitHub Pages deployment 成功
[ ] Sheet 與 GitHub mapping 一致
[ ] README／workflow 如有重大進度已更新
```

---

# 24. 日常 ChatGPT 作業方式

## 純文字考題

若任務是「先辨識／先吃資料」：

```text
讀 Drive 原卷
→ 整批轉 staging 文字
→ 標記待人工確認
→ 暫停於 STAGING
```

若任務是「正式納入題庫」：

```text
staging 文字
→ census
→ Sheet mapping
→ 讀 canonical
→ 答案 QA
→ questionId / revision
→ GitHub 建／更新 sidecar JSON
→ 更新 runtime merge config
→ commit main
→ Pages 實測
```

## 有圖題

快速擷取階段：

```text
原卷圖片／PDF
→ 先辨識文字
→ 記錄圖題頁碼／題號
→ 標 image pending
→ 繼續整批
```

正式納入階段：

```text
完成 census / mapping / 答案驗證
→ 判斷必要圖片
→ 原卷裁 PNG
→ assets 放 GitHub
→ JSON 引用 image / optionImage
→ Pages 實測
```

## 教材又新增

```text
更新 canonical
→ 回頭掃 unknown
→ 修 Sheet
→ 修 GitHub 題庫位置
→ 修 runtime config
→ 再驗證
```

不要為了一兩個純文字 JSON 修改，就要求使用者手動跑整套 patch。

但大量 sidecar、圖片、批次 reclassify 時，使用本機腳本是合理的。

---

# 25. 已驗證的實作模式

目前專案已經驗證兩種重要模式。

## 25.1 國文多校 sidecar + runtime merge

同一課可有：

```text
school-exams.json
school-exams-yushan-114.json
school-exams-zuoying-113.json
school-exams-siyu-114.json
...
```

runtime 直接合併後呈現一份「各校題庫」。

已實際驗證：

```text
新增學校
pending → official verified
跨文本歸課
unknown 重掃
題目搬課
返回後再次進入
MutationObserver 卡死修正
```

這些經驗屬於全科可重用的網站與資料治理模式，不是國文專屬。

## 25.2 自然逐題拆卷歸小節

已驗證：

```text
整份段考先 census
→ Google Sheet 索引
→ 只把真正屬於 1-2 科學方法的題放入該小節題庫
```

這證明同一套流程可以跨科使用。

---

## 24.1 圖片大量匯入時的 ChatGPT 預設

使用者若說：

```text
先辨識
先轉文字
先吃題目
先整理圖片
先把這幾章轉成文字檔
```

一律優先解讀為：

```text
RAW → STAGING
```

除非使用者明確再說：

```text
正式納入
建立題庫
上 GitHub
上線
```

否則不要自行展開：

```text
questionId
revision
Sheet mapping
runtime
deploy
完整正式 QA
```

目標是維持大量圖片輸入吞吐量，避免治理成本前移。

---

# 26. 核心原則摘要

```text
共同 SOP ≠ 所有科目同一題型

原始考卷 → 永遠保留
官方答案 → 高於 AI 推理
整卷 → 先 census 再拆題
Sheet → 保存逐題 mapping
章節分類 → 回實際教材／canonical
無法確定 → unknown
教材增加 → 回頭重掃 unknown
跨文本 → 要有教學關聯
真實選項 → 不亂序
各校題庫 → 與自編題完全分開
多校累積 → sidecar + runtime merge
pending → 不進正式評量
答案確認 → 再升級 official verified
圖片是題意 → 原卷裁圖
紙筆題 → manual-study
特殊答案碼 → 不硬轉普通選擇題
新章第一次有真題 → JSON + catalog + runtime 一起建
返回後 → 必須能再次進入
動態 UI → 防止 observer loop / 重複 handler
重新歸類 → Sheet + GitHub + runtime 一起同步
純文字修改 → GitHub-first
binary / 大批次 → 必要時回 E:\Exam
```

---

# 27. 本文件定位

`EXAM_WORKFLOW.md` 是**所有科目各校段考的母 SOP**。

科目專用補充文件可以存在，但只補充該科特殊題型，不推翻以下底線：

```text
來源可追溯
答案可驗證
原卷資訊不任意改寫
章節分類有教材依據
unknown 可以保留
題型依考卷特性處理
Sheet 與網站題庫可互相回溯
多校題庫可持續擴充
網站導航可重複進出
資料結構可長期維護
```

未來遇到新的科目、新題型、新考卷格式，優先更新本母 SOP，而不是硬把新資料塞進舊模板。