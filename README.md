# 國中線上題庫 Exam

> 專案狀態、資料架構、教材資料庫、題庫與工作流程的主要索引。
>
> 後續新增科目、學期、單元、小節、教材照片、canonical 教材知識庫、自編題、各校段考、歷屆試題、AI curriculum 或網站功能時，請同步更新本 README。
>
> 最後更新：2026-09-19

---

# 1. 專案定位

本專案不是單純收藏考卷，而是逐步建立一套可以長期擴充的：

```text
國中教材知識庫
+ 線上題庫
+ 歷屆試題
+ 各校段考
+ 作答紀錄
+ AI 弱點診斷
```

整體資料流：

```text
原始教材／講義／正式試卷／各校考卷
        ↓
Google Drive 原始 evidence／canonical 教材知識庫
        ↓
章節／課次／concept mapping
        ↓
自編題 + 各校段考題 + 正式歷屆題
        ↓
GitHub Exam 結構化題庫
        ↓
GitHub Pages 線上作答
        ↓
作答紀錄／錯題
        ↓
Private Exam-Record + AI 弱點診斷
```

核心原則：

- Google Drive 保存教材與原始 evidence。
- GitHub `chenlijon-dot/Exam` 保存網站程式與真正可作答的題庫。
- Private `Exam-Record` 保存個人作答資料與 AI curriculum。
- 正式歷屆題保留原卷題序與原始選項。
- 各校段考保留 provenance，再拆回真正對應章節／小節。
- 所有資料以可追溯、可重新核對、可長期維護為優先。

---

# 2. 目前網站主入口

首頁正式品牌：

```text
國中全科學習題庫
章節練習・各校段考・歷屆試題
作者：Chris醫師
版本：YYYY-MM-DD HH:MM
```

首頁版本由 GitHub Pages deployment 以 `Asia/Taipei` 時區產生，用來辨識目前瀏覽器實際載入的部署版本。

主入口：

```text
國中全科學習題庫
│
├─ 國文
├─ 英文
├─ 數學
├─ 自然
├─ 社會
└─ 歷屆考題
```

全站設定：

```text
☁️ GitHub 同步設定
```

章節／課次頁保留：

```text
📊 作答紀錄
📝 錯題複習
```

README 的「最後更新」是文件維護日期；首頁「版本」是 deployment 時間，兩者分開管理。

---

# 3. 題目來源分類

系統題目必須區分來源：

```text
1. practice-generated
   自編題，依教材／講義／canonical curriculum 建立

2. official-past-exam
   基測／教育會考等正式歷屆試題

3. school-exam
   各校段考、模擬考、複習卷等
```

三種來源不可混為一種，也不可因後續整理而丟失 provenance。

---

# 4. 三層資料架構

```text
Google Drive
→ 原始教材照片／PDF／講義
→ 正式試卷來源
→ 各校段考與答案卷
→ canonical 教材知識庫
→ 長期 reference authority

GitHub: chenlijon-dot/Exam
→ 網站程式
→ 自編章節題庫
→ 各校段考拆題後題庫
→ 正式歷屆試題 JSON
→ 網站必要 assets

GitHub Private: chenlijon-dot/Exam-Record
→ 個人作答紀錄
→ 錯題資料
→ AI request/result
→ machine-readable curriculum
```

一句話：

```text
Drive       = 原始證據與教材長期記憶
GitHub Exam = 真正拿來作答的正式題庫
Exam-Record = 個人學習結果與 AI 診斷
```

---

# 5. Authority 與證據優先順序

## 5.1 題目／教材內容

若不同來源內容衝突：

```text
正式官方原始資料／原卷
→ 同來源原始 PDF／影像
→ canonical 整理
→ GitHub 題庫資料
→ 模型記憶
```

如果較舊掃描檔字跡模糊，而可取得更高 authority 的官方原始影像，應以官方原始影像為準。

## 5.2 答案

答案 authority：

```text
官方答案／原校答案卷
→ 教育單位正式答案
→ 同來源正式答案頁
→ 可追溯可靠二手整理
→ 模型自行解題只作最後輔助與 QA
```

模型不得為了讓答案看起來合理而擅自改原題。

## 5.3 已驗證的代表案例

- `94-2` 數學 Q27：詳解 QA 發現原轉錄式與官方選項不一致，最後由清楚原題影像確認分母為 `6、3、2`，再修正題目與詳解。
- `95-1` 數學 Q19：模糊來源曾被判成 `AO＝PQ`；使用者提供大考中心原始試題影像後，確認正式原題為 `AP＝PQ`。目前題庫與詳解皆以此官方原始影像為準。

這兩個案例是後續「遇到矛盾回到原始 evidence」的標準範例。

---

# 6. GitHub-first / Remote-first 工作方式

本專案目前最重要的 repository authority：

```text
GitHub: chenlijon-dot/Exam
branch: main
```

本機工作副本：

```text
E:\Exam
```

**`origin/main` 才是 authority，本機不是 authority。**

一般文字檔優先直接透過 GitHub 修改：

```text
README
JSON
JavaScript
HTML
CSS
其他純文字設定
```

只有下列工作優先回本機：

- PNG / JPG binary asset
- PDF
- 裁圖
- 旋轉／壓縮／格式轉換
- 大量 binary 批次處理
- 需要本機實際預覽的工作
- connector 無法可靠完成的工作

## 6.1 新一批本機 binary 工作的標準開始方式

在沒有未發布 tracked 工作時：

```powershell
git status
git fetch origin main
git checkout main
git reset --hard origin/main
```

再開始處理圖片／PDF。

注意：

- `reset --hard origin/main` 只適合「開始新批次、tracked 工作乾淨」時使用。
- 若本機已經有剛完成但尚未 push 的 commit，不要 reset 掉；應先 `fetch + rebase`。
- 無關的 untracked `.bak`、暫存檔不可順手 commit。

## 6.2 完成一批本機 binary 工作後

```powershell
git add <本批目標檔案>
git commit -m "..."
git fetch origin main
git rebase origin/main
git push origin main
```

由於可能同時有其他對話／工作流更新 GitHub，push 前一定再 fetch + rebase。

如果 push 被拒絕：

```powershell
git fetch origin main
git rebase origin/main
git push origin main
```

最多針對 race condition 自動重試一次；若發生真正 conflict，停止並人工判讀，不亂解 conflict。

## 6.3 Push 後必做 remote read-back

不能只看到 `git push` 成功就結束。

至少確認：

```text
遠端 commit 存在
目標檔案存在
JSON 路徑正確
圖片數量正確
imagePending 等暫存旗標已清除
UI 實際指向最新資料
```

---

# 7. Google Drive 可變更範圍（強制規則）

本專案對 Google Drive 的唯一可寫入／可變更範圍：

```text
D:\我的雲端硬碟\國中教材參考資料
```

只有此資料夾及其子路徑可：

```text
新增
修改
重新命名
移動
整理目錄
刪除
建立／更新 canonical 教材知識庫
```

其他 Google Drive 路徑一律視為唯讀，即使帳號有存取權也不得變更；除非使用者針對特定路徑另有明確指示。

---

# 8. Canonical 教材資料庫規則

教材資料庫統一沿用已驗證的 canonical 模式：

```text
使用者提供教材照片／PDF／講義
        ↓
確認科目、年級學期、單元／課次、小節
        ↓
原始資料分類保存
        ↓
建立／更新該小節唯一 canonical 教材知識庫
        ↓
整理核心概念、考點、迷思、題型、concept ID
        ↓
作為自編題、段考拆題與 AI curriculum 的共同依據
```

同一小節／同一課原則上維持一份主 canonical，不要每收到新資料就建立互相重疊的新文件。

標準目錄：

```text
國中教材參考資料/
└─ <科目>/
   └─ <年級學期>/
      └─ <單元／課次>/
         └─ <小節>/
            ├─ 原始資料/
            └─ 整理資料/
               └─ <科目>_<年級>_<小節>_教材知識庫
```

跨小節綜合資料可另建 `單元X_綜合複習`，不要硬塞進單一小節。

Canonical 至少保存：

```text
基本資料
來源資料
正式教材內容
核心概念
考試重點
常見迷思
題型
concept ID 候選
來源影像
```

---

# 9. 教材與試卷影像規則

原始圖片是 evidence，處理原則是「保留原始內容」。

允許：

```text
旋轉翻正
必要透視校正
裁掉少量無關背景
適度亮度／對比調整
檔名整理
頁碼整理
```

不應：

```text
AI 重新生成整頁教材
AI 改寫圖片中的文字
AI 重畫正式試題圖形取代原圖
刪除原始手寫痕跡後再稱為原始 evidence
```

學生／老師手寫答案只能視為補充線索，不能直接當官方答案。

---

# 10. 各校段考 SOP

各校段考：

```text
題目卷 = 原始 evidence
答案卷 = 答案 authority
```

標準流程：

```text
1. 取得題目卷與答案卷
2. 核對學校／年度／學期／段考次別／年級／科目
3. 整卷 census
4. 一題一題判讀真正章節
5. 建立逐題分類索引
6. 保留原題號與 provenance
7. 圖題保留原始圖像
8. 答案以原校答案卷優先
9. 拆題寫入對應 chapter-bank
10. 網站實際作答測試
11. 更新 README
```

無法確定章節時標記：

```text
unknown
```

不要硬猜。

校內段考拆題後應保留：

```text
sourceType: school-exam
school
year / schoolYear
semester
examName
subject
originalQuestionNumber
sourcePage
sourceFile
chapterTags
conceptIds
answerVerified
```

---

# 11. 正式歷屆考題基本原則

正式基測／會考與各校段考不同：

```text
正式基測／會考
→ 保留整張考卷
→ 保留原始題序
→ 保留原始選項
→ 可整卷作答

各校段考
→ 原卷留 Drive
→ 逐題拆解
→ 掛回 chapter／section／concept
```

歷屆考題路徑：

```text
BCT:
past-exams/bct/<year>/<first|second>/<subject>.json

CAP:
past-exams/cap/<year>/<subject>.json
```

歷屆資料預設：

```json
"preserveOptionOrder": true,
"analysisEligible": false
```

每題原始選項固定：

```json
"fixedOptions": true
```

答案 `a` 採零起算：

```text
0 = A
1 = B
2 = C
3 = D
```

歷史正式考題不得因網站隨機選項功能而改變原始選項順序。

---

# 12. 正式歷屆考題製作流程（現行標準）

這是目前基測數學 90～95 年實作後整理出的正式 SOP。

## 12.1 Stage A：先找 authority 原卷

```text
1. 找原始 PDF／官方影像
2. 確認制度、年度、次別、科目
3. 確認總頁數
4. 確認題目頁與答案頁位置
5. 做整卷 census
```

若有多個版本：

```text
官方原始影像 > 清楚原始 PDF > 二手掃描／轉檔
```

## 12.2 Stage B：先做文字層，不先卡在圖片

第一輪先建立：

```text
題號
題幹
四個原始選項
官方答案
metadata
```

圖題先標：

```json
"imagePending": true
```

必要時使用：

```json
"optionImagePending": true
```

這一輪的目標是先讓整份試卷文字骨架完整，不要因一張圖卡住整批工作。

## 12.3 Stage C：判讀有疑義時立即跳出，不死磕

若遇到：

```text
字太糊
分數／根號／上下標無法確定
圖中文字看不清
題幹與圖不一致
原題與答案表看起來矛盾
算完沒有任何選項符合
```

不要一直反覆猜到逾時。

直接把該題掛起，其他清楚題目繼續。

回報格式建議：

```text
【需要人工判讀】
95-1 Q19
目前讀到：AO＝PQ
問題：圖中沒有 O 點
可能：AP＝PQ
需要使用者確認原始來源
```

使用者可提供更清楚照片／官方版本後再回補。

這是強制工作原則：**單題疑義不得拖垮整批匯入。**

## 12.4 Stage D：答案核對

答案應優先取自原卷正式答案表／官方答案。

建立完成後至少檢查：

```text
題數與答案數相同
每題 a 介於 0～3
原始選項順序未變
答案表題號無錯位
```

## 12.5 Stage E：原卷圖像 assets

圖形題一律優先裁原卷：

```text
幾何圖
座標圖
統計圖
表格
圖形選項
題組共用圖
```

不要用 AI 重畫「看起來差不多」的版本。

建議位置：

```text
past-exams/bct/<year>/<session>/assets/<subject>/
```

單圖：

```json
"image": "past-exams/.../q19-centroid-geometry.png"
```

一題多圖：

```json
"images": [
  "past-exams/.../q32-1.png",
  "past-exams/.../q32-2.png"
]
```

圖片應搭配：

```json
"imageAlt": "..."
```

`95-1 Q32` 已正式驗證 `images:[...]` 多圖格式，可作後續範例。

## 12.6 Stage F：圖片匯入後清理

當圖檔已進 GitHub：

```text
imagePending → 移除
optionImagePending → 移除
sourceNote → 更新為附圖已完成
```

並 remote read-back 驗證：

```text
實際 PNG 數量
JSON 引用路徑
多圖順序
pending marker = 0
```

## 12.7 Stage G：逐題詳解，同時做第二輪 QA

每份完成文字與圖片後建立 companion：

```text
math-explanations.json
```

建議格式：

```json
{
  "schemaVersion": 1,
  "examKey": "bct-95-first-math",
  "sourceType": "derived-explanation",
  "note": "本檔詳解依原題、原卷附圖與答案表逐題推導整理；並非逐字轉錄官方解析。",
  "answerOverrides": {},
  "explanations": {
    "1": "...",
    "2": "..."
  }
}
```

重要：

- 詳解是學習用衍生內容，不冒充官方解析。
- 每題應真的推導，不只寫「答案 A」。
- 詳解製作同時是 QA 層。
- 推導答案若與官方答案／選項不一致，先回頭查原題，不得硬寫成官方答案。
- 若來源真的有疑義，記錄 verification note 或請使用者人工判讀。

`94-2 Q27` 就是靠詳解 QA 抓到轉錄問題；因此「逐題詳解」也是正式品質檢查流程的一部分。

## 12.8 Stage H：UI 掛載

完成一個歷屆批次後，在 `exam-past-exams.js` 接上：

```text
年度
→ 次別
→ 科目卡片
→ math.json
→ math-explanations.json
```

只有真正已建立的資料才標示「已收錄」。

尚未完成的次別／科目保持：

```text
待匯入 / disabled
```

## 12.9 Stage I：最終遠端驗證

至少確認：

```text
GitHub main 有最新 commit
math.json 可讀
explanations 可讀
assets 全部存在
圖片路徑有效
多圖格式有效
UI path 正確
題數正確
pending marker = 0
```

最後才把該批次標為完成並更新 README。

---

# 13. 題組與圖形 JSON 慣例

題組：

```json
"introLabel": "第28～29題題組",
"intro": "..."
```

單張題圖：

```json
"imageAlt": "第19題...",
"image": "past-exams/.../q19-figure.png"
```

多張題圖：

```json
"imageAlt": "第32題...",
"images": [
  "past-exams/.../q32-1.png",
  "past-exams/.../q32-2.png"
]
```

圖形選項可使用既有 option image 欄位；若尚未裁圖，可先保留 pending marker。

`sourceNote` 應記錄：

```text
原始檔名稱
頁面範圍
答案來源
附圖是否完成
特殊人工驗證／來源修正
```

---

# 14. 數學歷屆題命名與品質規則

圖片檔名應盡量有語意，不只使用流水號：

```text
q03-market-share-line-chart.png
q19-centroid-geometry.png
q27-rectangular-paper-arrangement.png
```

若一題拆多圖：

```text
q32-1.png
q32-2.png
```

品質原則：

- 裁圖以原卷可讀性為優先。
- 不要把答案或下一題無關文字一起裁入。
- 表格、座標軸、點名、角度等解題必要資訊不能被切掉。
- 有疑義時先保留較寬範圍，不要裁過頭。
- 圖片不是 decoration，而是題目 evidence 的一部分。

---

# 15. 目前正式基測數學進度

目前 GitHub `main` 已建置：

```text
90-1 數學：32 題
90-2 數學：31 題
91-1 數學：31 題
91-2 數學：31 題
92-1 數學：31 題
92-2 數學：31 題
93-1 數學：32 題
93-2 數學：32 題
94-1 數學：33 題
94-2 數學：33 題
95-1 數學：33 題
95-2 數學：33 題
```

90～95 各年度目前已在歷屆 UI 中建立對應數學入口；95-1、95-2 皆已正式掛載。

95-1 目前完整鏈：

```text
原卷
→ 33 題文字
→ 官方答案
→ 15 題需要附圖
→ 16 張 PNG（Q32 拆兩張）
→ Q19 大考中心原始影像驗證 AP＝PQ
→ 33 題逐題詳解
→ 第二輪 QA
→ UI 掛載
```

95-2 目前完整鏈：

```text
原卷
→ 33 題文字
→ 官方答案
→ 19 個圖題／題組
→ 20 張 PNG（Q5 題圖＋選項圖分開；Q30～31 共用題組圖）
→ imagePending / optionImagePending = 0
→ 33 題逐題詳解
→ 第二輪 QA
→ 詳解 companion schema 校正為網站 loader 可讀格式
→ UI 掛載
```

95 年度第一次、第二次数學科目前皆已完成。

---

# 16. 國文 catalog authority

國文七年級上學期目前以：

```text
115 學年度康軒版國文第一冊
```

作為課次 catalog authority。

主要課次：

```text
第一課　夏夜
第二課　生之歌選
  ├─ 一顆珍珠
  └─ 手的故事
第三課　吃冰的滋味
語文天地一　標點符號使用法
第四課　差不多先生傳
第五課　論語選
第六課　那默默的一群
語文天地二　閱讀策略與資料檢索
第七課　兒時記趣
第八課　紙船印象
第九課　下雨天，真好
第十課　鬧元宵
自學一　善用時間的方法
自學二　拄柺杖的小男孩
自學三　曹操掉下去了
```

出版社版本或學年度改變時，要先核對新實體教材目錄，不直接沿用舊 catalog。

---

# 17. 自然七上 chapter tree

目前 authority 章節樹：

```text
單元 1　生命現象與科學探究
├─ 1-1 生命現象和生物圈
├─ 1-2 科學方法
└─ 1-3 認識實驗室

單元 2　生物體的構造
├─ 2-1 生物體的基本構造
├─ 2-2 細胞的形態和構造
├─ 2-3 有關生命的物質
└─ 2-4 從細胞到生物體

單元 3　生物體內的營養
單元 4　生物體內的運輸作用
單元 5　生物體內的協調作用
單元 6　生物體內的恆定性
跨科主題　尺度的認識與應用
```

尚未提供教材內容的小節可以先建立 catalog，但不自行猜教材內容。

目前 `1-2 科學方法`、`1-3 認識實驗室` 已開始建立 canonical、練習題與各校題庫工作流。

---

# 18. 社會七上 chapter tree

目前 authority 章節樹來自 2026-09-19 使用者提供的國一上學期社會課本第一冊實體目錄照片；出版社／學年度／版次尚待封面或版權頁確認。

網站與教材分類採：

```text
社會
├─ 地理
├─ 歷史
└─ 公民
```

七年級上學期第一冊：

```text
地理｜臺灣的環境（上）
├─ 第1章 認識位置與地圖（p.8）
├─ 第2章 世界中的臺灣（p.22）
├─ 問題探究 立足臺灣、連結世界（p.32）
├─ 第3章 地形（p.34）
├─ 第4章 海岸與島嶼（p.48）
├─ 問題探究 從高山高麗菜看臺灣山地的開發與影響（p.58）
├─ 第5章 天氣與氣候（p.60）
├─ 第6章 水文（p.76）
└─ 問題探究 颱風與生活（p.88）

歷史｜臺灣的歷史（上）
├─ 導言 歷史的基礎概念、歷史熱身操（p.92）
├─ 第1章 史前臺灣與原住民文化（p.96）
├─ 第2章 大航海時代各方勢力的競逐（p.106）
├─ 歷史探查 外國人眼中的臺灣（p.116）
├─ 第3章 大航海時代臺灣原住民與外來者（p.118）
├─ 第4章 清帝國統治政策的變遷（p.126）
├─ 歷史探查 面對臺灣——從被動到積極的清帝國（p.138）
├─ 第5章 清帝國時期農商業的發展（p.140）
├─ 第6章 清帝國時期社會文化的變遷（p.150）
├─ 歷史探查 開港通商前後的臺灣社會（p.160）
└─ 臺灣歷史人物調查（p.162）

公民｜公民身分及社群
├─ 第1章 公民與公民德性（p.166）
├─ 第2章 人性尊嚴與人權保障（p.174）
├─ 第3章 家庭生活（p.184）
├─ 第4章 變遷中的家庭（p.194）
├─ 第5章 學生權利與校園生活（p.204）
├─ 第6章 部落與公民參與（p.216）
├─ 資料活動 如何進行田野觀察（p.226）
└─ 附錄 圖片來源（p.228）
```

冊末另有附件 1「經緯線地球模型組」（p.236）與附件 2「台鐵北迴操作模型組」。附件不列入正式章節樹。

完整 catalog authority：`curriculum-catalog/social-7-1.md`。

尚未提供教材內容的章節可以先建立 catalog，但不自行猜課本內容；收到課本／講義後再依教材整理 SOP 建立 Drive 原始 evidence、教材辨識檔與 canonical 教材知識庫。

目前地理第1章〈認識位置與地圖〉已完成第一輪教材建置：

```text
教材頁次：p.6～21
小節：
├─ 1-1 如何表示位置
├─ 1-2 經緯線網格
├─ 1-3 位置與生活的關聯
└─ 1-4 如何閱讀地圖

已完成：
原始教材照片歸檔
→ 教材辨識檔
→ canonical 教材知識庫
→ 核心概念／考點／迷思／題型
→ concept ID 候選

待完成：
出版社／學年度／版次確認
圖像型題目與地圖判讀題擴充
各校段考 chapter mapping
machine-readable curriculum 同步
```

---

# 19. AI 錯題診斷

Private repository：

```text
Exam-Record
```

資料流：

```text
Google Drive canonical 教材知識庫
        ↓
machine-readable curriculum
        ↓
學生錯題
        ↓
AI 診斷
```

AI 診斷應依教材與實際錯題證據，不可因一題錯誤就擴張成「整章都不熟」。

當 canonical 有足以影響診斷的新內容時，應檢查對應 curriculum 是否需要同步更新。

---

# 20. GitHub 主要結構

```text
Exam/
├─ README.md
├─ EXAM_WORKFLOW.md
├─ CHINESE_SCHOOL_EXAM_WORKFLOW.md
├─ index.html
├─ exam-catalog.js
├─ exam-past-exams.js
├─ exam-runtime-flex.js
├─ exam-option-randomizer.js
├─ exam-records.js
├─ exam-wrong-ui.js
├─ exam-records-clear.js
├─ exam-gpt-analysis.js
├─ exam-navigation-fix.js
├─ exam-science-banks.js
├─ exam-record-layout.js
├─ exam-branding.js
├─ exam-browser-history.js
│
├─ chapter-bank/
│  └─ ...
│
├─ past-exams/
│  └─ bct/
│     ├─ 90/
│     ├─ 91/
│     ├─ 92/
│     ├─ 93/
│     ├─ 94/
│     └─ 95/
│
└─ .github/
   └─ workflows/
      └─ pages.yml
```

歷屆每批通常包含：

```text
math.json
math-explanations.json
assets/math/*.png
```

---

# 21. 版權與 provenance

- 使用者提供的課本／講義可保存私人 Drive 作個人學習參考。
- 原始教材與完整段考卷以私人 Drive 保存為主。
- 「網路上可下載」不代表可無限制公開重製。
- 公開 GitHub 保存網站需要的結構化題庫與必要 assets。
- 來源權利或重製條件不清楚時採保守方式。
- 題目結構化後仍保留 provenance。
- 題意有疑義時回到原卷／原教材，不靠模型記憶自行補字。

---

# 22. 安全規則

## GitHub Token

- 不寫入 repository。
- 不寫入 README。
- 不貼到對話。
- 前端只存於適當 session storage／既有安全流程。

## Gemini API Key

- 不進公開 JavaScript。
- 存 Private `Exam-Record` GitHub Actions Secret。

## Google Drive

- README 不紀錄 Google 帳號、token、私人 folder ID 或分享憑證。
- Drive 教材與段考原始資料預設視為私人參考資料。
- Google Drive 的修改範圍仍受第 7 節強制限制。

---

# 23. 新資料進來時的標準判斷

```text
這是教材？
→ canonical 教材資料庫流程

這是各校段考？
→ 原卷／答案留 Drive
→ census
→ 分類索引
→ 拆題
→ chapter-bank

這是正式基測／會考？
→ 保留整卷
→ past-exams
→ 文字層
→ 原卷圖片
→ 詳解 QA
→ UI

這是學生作答資料？
→ Exam-Record
```

不要把不同資料模型混在一起。

---

# 24. 新對話／接手規則

新的 ChatGPT 對話繼續本專案時：

1. 先讀 `chenlijon-dot/Exam/README.md`。
2. 再讀 GitHub `main` 的實際最新檔案；README 與程式不一致時，以最新程式／資料為準，再修 README。
3. 不要從舊對話印象直接假設 repository 狀態。
4. 涉及教材時，先查 Drive 對應 canonical。
5. 涉及正式歷屆題時，遵守第 11～15 節。
6. 正式題目遇到模糊／矛盾時立即標記並請使用者協助，不要陷入長時間判讀。
7. 對單一疑問題可暫停，但其他清楚題目繼續處理。
8. 文字／JSON／JS／HTML／CSS 預設 GitHub-first。
9. Binary／PDF／裁圖才回本機，且必須 remote-first。
10. 本機工作完成後 push 前再 `fetch + rebase`，防止其他工作同時更新 `main`。
11. Push 後 remote read-back，不能只相信本機。
12. 網站 UI 問題先確認首頁 deployment 時間戳，排除舊快取。
13. 完成新 canonical、新章節、新段考批次、新歷屆試卷或重大網站功能後更新 README。
14. Google Drive 修改只能在 `D:\我的雲端硬碟\國中教材參考資料` 及其子路徑。

---

# 25. 目前工作進度

## 已完成／已建立

- [x] GitHub Pages 題庫網站
- [x] 手機 responsive
- [x] 五科 + 歷屆考題主入口
- [x] deployment 時間戳版本
- [x] 瀏覽器／手機返回鍵逐層導航
- [x] 作答紀錄／錯題複習
- [x] 自編題選項隨機排列
- [x] 各校題／正式歷屆題保留原始選項順序
- [x] 未答與錯答分離
- [x] Private Exam-Record 同步
- [x] AI 錯題診斷架構
- [x] Google Drive canonical 教材架構
- [x] 國文七上 catalog authority
- [x] 自然七上 chapter tree
- [x] 社會七上第一冊 chapter tree（地理／歷史／公民）
- [x] 社會地理第1章〈認識位置與地圖〉教材 canonical（p.6～21）
- [x] 社會地理第1章〈認識位置與地圖〉文字自編題庫：簡易／中等／困難各 10 題，共 30 題
- [x] 自然 1-2／1-3 canonical 與題庫工作流開始實作
- [x] 各校段考拆題 SOP
- [x] 正式歷屆考題 SOP
- [x] GitHub-first / remote-first 工作規則
- [x] 歷屆圖題原卷裁圖規則
- [x] 歷屆逐題詳解作為第二輪 QA
- [x] 基測數學 90-1 ～ 94-2
- [x] 基測數學 95-1：33 題＋答案＋原卷圖＋詳解＋UI
- [x] 基測數學 95-2：33 題＋答案＋20 張原卷圖＋33 題詳解＋UI

## 下一階段

- [ ] 持續人工 QA 既有歷屆題
- [ ] 持續匯入後續基測／教育會考
- [ ] 補建更多教材 canonical
- [ ] 持續各校段考拆題與 concept mapping
- [ ] 讓 Drive canonical → Exam-Record curriculum 同步流程更固定

---

# 26. 目前一句話狀態

截至 2026-09-19：

> 本專案已形成穩定的「Google Drive 原始 evidence／canonical → GitHub Exam 結構化可作答題庫 → Private Exam-Record 學習紀錄與 AI curriculum」三層架構。 社會科已依實體七上第一冊目錄建立地理／歷史／公民三大領域與完整章節 catalog，出版社與版次待封面／版權頁確認。正式歷屆題目前採嚴格 GitHub `origin/main` authority 與 remote-first 工作法：先建立文字與官方答案，再裁原卷圖，最後逐題製作詳解並把詳解當成第二輪 QA；遇到模糊字、圖文衝突或解題無法對應官方選項時，不長時間硬猜，而是立即標記單題並交由使用者協助核對更高 authority 的原始來源。基測數學目前已完成 90-1 至 95-2，且 95 年度第一次、第二次皆已完成題目、官方答案、原卷附圖、逐題詳解與 UI 掛載。
