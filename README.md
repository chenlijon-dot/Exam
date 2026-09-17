# 國中線上題庫 Exam

> 專案狀態、資料架構、教材資料庫、題庫與工作流程的主要索引。
>
> 後續新增科目、學期、單元、小節、教材照片、canonical 教材知識庫、自編題、各校段考、歷屆試題、AI curriculum 或網站功能時，請同步更新本 README。
>
> 最後更新：2026-09-17

---

# 1. 專案定位

本專案不是單純收藏考卷，而是逐步建立一套可以長期擴充的「國中教材知識庫 + 線上題庫 + 學習診斷系統」。

```text
原始教材／講義／課堂補充
        ↓
Google Drive canonical 教材知識庫
        ↓
章節／課次 concept mapping
        ↓
自編題 + 各校段考題 + 正式歷屆題
        ↓
GitHub Pages 線上作答
        ↓
作答紀錄／錯題
        ↓
AI 弱點診斷
```

核心原則：

- 一般教材與題庫依「科目 → 年級／學期 → 單元／課次 → 小節 → concept」管理。
- Google Drive 保存教材證據、原始參考資料與 canonical 教材知識庫。
- GitHub `Exam` 保存網站程式與真正可直接作答的題庫資料。
- Private `Exam-Record` 保存個人作答資料、錯題資料與 AI 使用的 machine-readable curriculum。
- 正式歷屆題保留原卷結構與原始題序。
- 各校段考原卷保留於 Drive，再逐題拆解並歸入真正對應的章節／小節。
- 所有題目盡可能保留 provenance，不讓來源在整理過程中消失。

---

# 2. 目前網站主入口

目前首頁正式品牌：

```text
國中全科學習題庫
章節練習・各校段考・歷屆試題
作者：Chris醫師
版本：YYYY-MM-DD HH:MM
```

首頁的「版本」由 GitHub Pages 每次部署時，以 `Asia/Taipei` 時區自動產生部署時間戳記，用來確認手機或電腦目前載入的是哪一次網站版本。

主入口樹：

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

主選單另外提供：

```text
☁️ GitHub 同步設定
```

章節／課次題庫頁則保留學習相關功能：

```text
📊 作答紀錄
📝 錯題複習
```

GitHub 同步屬於全站設定，不重複放在每一個章節。

## 2.1 首頁品牌與版本管理

首頁品牌由 `exam-branding.js` 負責，目前固定顯示：

```text
名稱：國中全科學習題庫
副標：章節練習・各校段考・歷屆試題
作者：Chris醫師
```

版本由 `.github/workflows/pages.yml` 在 GitHub Pages deployment 時自動將 `__BUILD_TIMESTAMP__` 替換成：

```text
YYYY-MM-DD HH:MM
```

時區固定為：

```text
Asia/Taipei
```

版本管理規則：

- 每一次 GitHub Pages deployment 都產生新的版本時間戳。
- 網站 UI 或手機顯示問題回報時，優先確認首頁版本時間，判斷是否仍在看舊快取／舊 deployment。
- README 的「最後更新」是文件維護日期；首頁「版本」是網站部署時間，兩者不要混為同一版本號。
- 目前採部署時間戳作為輕量版本識別；未來若需要正式 release，可再增加 semantic version / Git tag，但不取代部署時間戳。
- 修改首頁品牌、版本格式、部署規則或版本顯示方式後，必須同步更新 README。

---

# 3. 題目來源分類

系統中的題目必須區分來源：

```text
題庫來源
│
├─ 1. 自編題 practice-generated
│     └─ 依實際教材、講義與 canonical curriculum 建立
│
├─ 2. 正式歷屆題 official-past-exam
│     └─ 基測／教育會考等正式考試
│
└─ 3. 各校段考／公開題庫 school-exam
      └─ 各校公開段考、模擬考、複習卷等
```

三者不可混為同一種資料來源。

---

# 4. 資料儲存三層架構

```text
Google Drive
→ 原始教材照片／PDF／講義
→ 各校段考與答案卷原檔
→ canonical 教材知識庫
→ 教材長期 reference authority

GitHub: chenlijon-dot/Exam
→ 網站程式
→ 自編章節題庫
→ 各校段考拆題後的可作答題目
→ 正式歷屆考題 JSON
→ 題目必要 assets

GitHub Private: chenlijon-dot/Exam-Record
→ 個人作答紀錄
→ 錯題資料
→ AI request/result
→ machine-readable curriculum
```

一句話：

```text
Drive       = 教材證據與長期記憶
GitHub Exam = 真正拿來考的題庫
Exam-Record = 個人學習結果與 AI 診斷
```

---

# 5. GitHub-first 工作方式

日常網站與題庫修改的 authority：

```text
GitHub: chenlijon-dot/Exam
branch: main
```

本機工作副本：

```text
E:\Exam
```

一般文字檔、JSON、JavaScript、HTML、CSS、README 優先直接由 GitHub connector 修改。

只有下列工作才優先回本機：

- PNG / JPG 等 binary asset
- PDF 或大型檔案
- 裁圖、旋轉、壓縮、格式轉換
- 大量檔案批次處理
- 需要實際本機預覽的工作
- connector 無法可靠完成的工作

若回本機工作，開始前先確認 `E:\Exam` 已同步最新 `origin/main`。

---

# 6. 教材資料庫正式建立方式

從 2026-09-14 起，教材資料庫統一採用「國文〈夏夜〉已實作成功的 canonical 模式」。

往後所有科目原則相同：

```text
使用者提供教材照片／PDF／講義
        ↓
確認科目、年級學期、單元／課次、小節
        ↓
原始資料分類保存
        ↓
建立或更新該小節唯一一份 canonical 教材知識庫
        ↓
整理核心概念、考點、迷思、題型、concept ID
        ↓
作為自編題、段考拆題與 AI curriculum 的共同依據
```

## 6.1 一小節／一課一份 canonical

原則：

```text
同一小節／同一課
→ 維持一份主 canonical Google Doc
```

後續有新照片、新講義、老師補充資料時：

```text
新資料
→ 閱讀
→ 判斷新增／重複／衝突
→ 整併進既有 canonical
→ 保留來源註記
```

不要每收到一次資料就另外建立一份互相重疊的整理文件。

## 6.2 Google Drive 標準目錄

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

若數張資料屬於跨小節、單元綜合題，可另外建立：

```text
單元X_綜合複習/
├─ 原始資料/
└─ 整理資料/
   └─ 單元X_綜合複習_教材知識庫
```

不要為了方便而把跨章資料硬塞進單一小節。

## 6.3 Google Drive 可變更範圍（強制規則）

本專案對 Google Drive 的**唯一可寫入／可變更範圍**固定為：

```text
D:\我的雲端硬碟\國中教材參考資料
```

只有上述資料夾本身及其子資料夾／檔案，才允許進行下列變動：

```text
新增資料夾或檔案
修改檔案內容
重新命名
移動
整理目錄
刪除
建立或更新 canonical 教材知識庫
```

Google Drive 其他任何路徑，即使目前帳號具有存取權限，也一律視為**唯讀區域**：

```text
不得新增
不得修改
不得重新命名
不得移動
不得刪除
不得重新整理其他資料夾的結構
```

若任務需要對 `D:\我的雲端硬碟\國中教材參考資料` 以外的 Google Drive 資料進行變更，必須停止該變更，不可自行擴張操作範圍；除非使用者之後另有明確、針對特定路徑的新指示。

---

# 7. 教材影像處理規則

教材照片本身是 evidence，因此影像處理以「保留原始內容」為最高原則。

允許的處理：

```text
旋轉翻正
必要的透視校正
裁掉少量無關背景
適度亮度／對比調整
檔名與頁碼整理
```

不應做的事：

```text
AI 重新生成整頁教材
AI 改寫圖片中的文字
刪除原本的手寫註記
重畫教材圖而取代原圖作為證據
```

正式 archival/reference 版本應使用「原始像素旋轉／裁切」等 deterministic 處理，而不是生成式重繪。

學生／老師手寫的 A、B、C、D、圈選、訂正與筆記：

```text
可以保留
但只能視為學習痕跡／補充線索
不能直接視為官方答案
```

答案仍須由課本解答、教師版、正式答案卷或可核對來源確認。

---

# 8. canonical 教材知識庫標準內容

每一份 canonical 文件依科目調整細節，但至少包含：

```text
【基本資料】
科目
年級／學期
單元／課次
小節／課名
版本／來源範圍
資料狀態

【來源資料】
照片／PDF／講義名稱
教材頁碼
新增日期
來源說明

【核心教材內容】
正式定義
流程
重要知識
圖表／實驗／例子

【考試重點】
常考概念
判讀規則
常見題型
資料題／圖表題能力

【常見迷思】
學生容易混淆的概念
錯誤推論
常見陷阱

【題庫建置】
concept ID 候選
已有題型
待補題型
各校段考可對應概念

【來源影像】
翻正後的教材頁面
```

canonical 文件的用途不是只供人閱讀，它還是後續：

```text
出題
題目校對
chapter mapping
concept mapping
AI curriculum 萃取
錯題診斷
```

的主要 reference authority。

## 8.1 115 學年度康軒版國文第一冊課文目錄

目前國文七年級上學期採用的課程目錄 authority 為「115 學年度康軒版國文第一冊」。網站 catalog、Google Drive 教材歸檔、canonical 教材知識庫與各校段考課次 mapping，均以此課次樹為準。

```text
國文 第一冊｜七年級上學期｜康軒版（115 學年度）
│
├─ 第一課　夏夜　　　　　　　　　楊喚　　　　　　　　　p.6
│
├─ 第二課　生之歌選　　　　　　　杏林子　　　　　　　　p.18
│  ├─ （一）一顆珍珠　　　　　　　　　　　　　　　　　p.20
│  └─ （二）手的故事　　　　　　　　　　　　　　　　　p.22
│
├─ 第三課　吃冰的滋味　　　　　　古蒙仁　　　　　　　　p.30
│
├─ 語文天地一　標點符號使用法　　　　　　　　　　　　　p.46
│
├─ 第四課　差不多先生傳　　　　　胡適　　　　　　　　　p.58
│
├─ 第五課　論語選　　　　　　　　孔子弟子及再傳弟子　　p.70
│
├─ 第六課　那默默的一群　　　　　張騰蛟　　　　　　　　p.80
│
├─ 語文天地二　閱讀策略與資料檢索　　　　　　　　　　　p.94
│
├─ 第七課　兒時記趣　　　　　　　沈復　　　　　　　　　p.110
│
├─ 第八課　紙船印象　　　　　　　洪醒夫　　　　　　　　p.122
│
├─ 第九課　下雨天，真好　　　　　琦君　　　　　　　　　p.134
│
├─ 第十課　鬧元宵　　　　　　　　朱天衣　　　　　　　　p.148
│
├─ 自學一　善用時間的方法　　　　李偉文　　　　　　　　p.162
│
├─ 自學二　拄柺杖的小男孩　　　　簡媜　　　　　　　　　p.172
│
└─ 自學三　曹操掉下去了　　　　　王文華　　　　　　　　p.184
```

目錄使用規則：

- `第一課～第十課`、`語文天地一／二`、`自學一～三` 都保留為獨立 catalog 節點，不互相硬併。
- 第二課正式課名為 `生之歌選`，內含（一）`一顆珍珠`、（二）`手的故事`，段考題可依實際內容再標到子篇。
- 各校段考逐題分類時，先依此目錄判斷課次；無法可靠判斷時維持 `unknown`。
- 教材照片、課文頁面、注釋、作者介紹、課後賞析等資料，皆歸回對應課次的 `原始資料／整理資料`，不另創平行課名。
- 後續若出版社版本或學年度改變，必須先核對新實體教材目錄，再另行更新 catalog authority，不能直接沿用舊版。

---

# 9. 自然科教材資料庫目前實作

Google Drive 已建立：

```text
國中教材參考資料/
└─ 自然/
   └─ 七年級上/
      └─ 單元1_生命現象與科學探究/
         ├─ 1-2_科學方法/
         │  ├─ 原始資料/
         │  └─ 整理資料/
         │     └─ 自然_七上_1-2_科學方法_教材知識庫
         │
         ├─ 1-3_認識實驗室/
         │  ├─ 原始資料/
         │  └─ 整理資料/
         │     └─ 自然_七上_1-3_認識實驗室_教材知識庫
         │
         └─ 單元1_綜合複習/
            ├─ 原始資料/
            └─ 整理資料/
               └─ 自然_七上_單元1_綜合複習_教材知識庫
```

## 9.1 1-2 科學方法 canonical

目前已整理：

- 科學探究流程
- 觀察／提出問題／假說／實驗／分析／結論
- 操縱變因
- 應變變因
- 控制變因
- 實驗組與對照組
- 公平實驗設計
- 實驗結果與結論
- 山崩模型題
- 水草氧氣實驗
- 種子發芽實驗
- 大白鼠資料分析
- 常見迷思
- 考試重點
- concept ID 候選

## 9.2 1-3 認識實驗室 canonical

目前已整理：

- 酒精燈
- 試管／試管架
- 燒杯
- 錐形瓶
- 陶瓷纖維網／三腳架
- 量筒
- 培養皿
- 滴管
- 載玻片／蓋玻片
- 複式顯微鏡
- 解剖顯微鏡
- 目鏡／物鏡／總放大倍率
- 高倍／低倍觀察
- 粗調節輪／細調節輪
- 光圈與光源
- 複式顯微鏡成像方向
- 玻片移動方向
- 複式與解剖顯微鏡比較

## 9.3 單元 1 綜合複習

跨 1-1～1-3 的混合資料不要強制塞回單一小節。

目前綜合複習資料包含：

- 生命現象
- 生物與環境
- 科學方法
- 實驗變因
- 實驗資料判讀
- 顯微鏡
- 實驗室操作
- 綜合應用題

---

# 10. 自然七上教材章節樹

依使用者提供的實際教材目錄：

```text
自然 七年級上學期
│
├─ 單元 1　生命現象與科學探究
│  ├─ 1-1　生命現象和生物圈
│  ├─ 1-2　科學方法
│  ├─ 1-3　認識實驗室
│  └─ 核心素養　生活在沙漠中的生物
│
├─ 單元 2　生物體的構造
│  ├─ 2-1　生物體的基本構造
│  ├─ 2-2　細胞的形態和構造
│  ├─ 2-3　有關生命的物質
│  ├─ 2-4　從細胞到生物體
│  └─ 核心素養　生命的起源
│
├─ 單元 3　生物體內的營養
│  ├─ 3-1　食物和養分
│  ├─ 3-2　酵素的作用
│  ├─ 3-3　光合作用
│  ├─ 3-4　人體的消化系統
│  └─ 核心素養　養分的消化與吸收
│
├─ 單元 4　生物體內的運輸作用
│  ├─ 4-1　植物的維管束
│  ├─ 4-2　蒸散作用與養分運輸
│  ├─ 4-3　人體的血液循環
│  ├─ 4-4　人體的循環系統
│  └─ 核心素養　人體的專一性防禦作用
│
├─ 單元 5　生物體內的協調作用
│  ├─ 5-1　刺激與反應
│  ├─ 5-2　神經系統
│  ├─ 5-3　內分泌系統
│  ├─ 5-4　行為與感應
│  └─ 核心素養　動物印痕
│
├─ 單元 6　生物體內的恆定性
│  ├─ 6-1　呼吸運動與氣體恆定
│  ├─ 6-2　排泄作用與水分恆定
│  ├─ 6-3　體溫恆定與血糖恆定
│  └─ 核心素養　糖尿病
│
└─ 跨科主題　尺度的認識與應用
```

尚未提供教材內容的小節先建立 catalog 位置即可，不自行猜教材內容或題目。

---

# 11. 自然科網站目前狀態

目前正式可作答：

```text
自然
└─ 七年級上學期
   └─ 單元 1 生命現象與科學探究
      └─ 1-2 科學方法
         ├─ 🌱 簡易：20 題
         ├─ 🌿 中等：20 題
         ├─ 🌳 困難：20 題
         └─ 🏫 各校題庫：已開始匯入
```

章節頁保留：

```text
📊 作答紀錄
📝 錯題複習
```

其他自然七上單元與小節已先建立 catalog 骨架，題目後續逐步建置。

---

# 12. 各校段考資料來源與 SOP

各校段考的共同精神以：

```text
EXAM_WORKFLOW.md
CHINESE_SCHOOL_EXAM_WORKFLOW.md
```

為基礎，再依科目調整。

## 12.1 Drive authority

自然科目前的原始段考來源位置：

```text
國中教材參考資料/各校段考題/自然科
國中教材參考資料/各校段考題/自然科/答案卷
```

第一層原則：

```text
題目卷 = 原始 evidence
答案卷 = 答案 authority
```

## 12.2 標準流程

```text
1. 取得題目卷與答案卷
2. 核對學校／年度／學期／段考次別／年級／科目
3. 整卷 census
4. 一題一題判讀真正章節
5. 建立 Google Sheet 逐題分類索引
6. 保留原題號與 provenance
7. 圖題保留原始圖像
8. 答案以原校答案卷優先
9. 拆題寫入對應 chapter-bank
10. 網站實際作答測試
11. 更新 README
```

無法確定章節時：

```text
unknown
```

不要硬猜。

---

# 13. 第一份自然科各校段考實作

已取得並整理：

```text
高雄市立大灣國中
114 學年度第一學期
七年級
第一次段考
自然科
```

整份試卷：

```text
40 題單選
官方答案卷已配對
```

Google Sheet 已建立：

```text
自然科_各校段考題章節索引
```

用途：逐題記錄：

```text
年度
學校
考試次別
原題號
對應單元／小節
後續 concept mapping
```

目前明確歸入 `1-2 科學方法` 的 4 題：

```text
原第 3 題  → 實驗設計／變因
原第 8 題  → 科學探究步驟
原第 37 題 → 水分與黴菌的控制實驗
原第 40 題 → 實驗反駁／結論有效性
```

正式 GitHub 題庫：

```text
chapter-bank/science/7-1/unit-01/section-02/school-exams.json
```

目前：

```text
4 題已收錄
preserveOptionOrder: true
answerVerified: true
```

各校題庫不隨機排列原始選項。

---

# 14. 校內段考 provenance

校內段考拆題後仍要保留：

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

若兩校使用完全相同題目，可考慮保留多個 provenance，而不是無限複製重複題。

---

# 15. 正式歷屆考題

正式基測／會考與各校段考不同：

```text
正式基測／會考
→ 保留整張考卷
→ 保留原始題序
→ 保留原始選項
→ 可整卷作答

各校段考
→ 原卷保存 Drive
→ 逐題拆解
→ 重新掛到 chapter／section／concept
→ 主要提供章節式練習
```

目前正式歷屆題：

```text
90 年第一次基測
├─ 國文：46 題
└─ 數學：32 題

90 年第二次基測
└─ 國文：47 題

總計：125 題
```

歷屆評量使用：

```text
答對題數 / 總題數
正確率 %
答錯題數
未答題數
```

固定選項：

```text
preserveOptionOrder: true
fixedOptions: true
```

---

# 16. 正式歷屆考題匯入規則

```text
1. 接收原始 PDF／圖片
2. 確認制度／年度／次別／科目
3. 建立試卷 census
4. 逐題還原題幹與原始選項
5. 題組保存 intro／introLabel
6. 圖題保存原卷圖像 assets
7. 找可靠答案來源核對
8. 第二輪逐題比對原卷
9. 建立 past-exams/... JSON
10. 接入歷屆考試 UI
11. 測試正確率／未答／錯題
12. GitHub Pages 部署後抽查
13. 更新 README
```

圖形題原則：

```text
原卷可裁圖
→ 優先使用原卷裁圖
```

不要用 AI 生成「看起來差不多」的幾何圖、座標圖、統計圖或圖形選項取代原卷。

---

# 17. 題目答案與證據優先順序

答案來源優先：

```text
官方答案／原校答案卷
→ 教育單位答案
→ 同來源正式答案頁
→ 可追溯可靠二手整理
→ 模型自行解題只作最後輔助
```

教材／題目內容衝突時：

```text
原始教材／原卷
→ canonical 整理
→ 題庫資料
→ 模型記憶
```

模型不能因為「印象中應該是這樣」就覆蓋可核對的教材證據。

---

# 18. AI 錯題診斷

目前自然 `1-2 科學方法` 已啟用 curriculum-based Gemini 診斷。

Private repository：

```text
Exam-Record/curriculum/science-method.json
```

模型：

```text
gemini-3.5-flash-lite
```

資料關係：

```text
Google Drive canonical 教材知識庫
        ↓
萃取／校正 machine-readable curriculum
        ↓
Exam-Record/curriculum/<chapter-id>.json
        ↓
學生錯題
        ↓
Gemini 診斷
```

AI 必須依該章教材與錯題證據判斷，不可因一題錯誤就擴張成「整章都不熟」。

當 Drive canonical 有足以影響診斷的新內容時，應同步檢查並更新對應 `Exam-Record/curriculum`。

---

# 19. chapter / section / concept 規則

題庫長期目標不是只有「這題屬於哪張考卷」，而是能回答：

```text
這題屬於哪一科？
哪個學期？
哪個單元？
哪個小節？
哪個 concept？
來源是哪裡？
```

自然科例如：

```text
science
→ 7-1
→ unit-01
→ section-02
→ controlled-variable
```

建議 concept ID：

```text
science-7-1-u01-s02-observation
science-7-1-u01-s02-question
science-7-1-u01-s02-hypothesis
science-7-1-u01-s02-experiment-design
science-7-1-u01-s02-independent-variable
science-7-1-u01-s02-dependent-variable
science-7-1-u01-s02-controlled-variable
science-7-1-u01-s02-control-group
science-7-1-u01-s02-data-analysis
science-7-1-u01-s02-conclusion
science-7-1-u01-s02-fair-test
science-7-1-u01-s02-evidence-inference
```

concept mapping 後，未來才能真正做到跨來源的弱點統計。

---

# 20. GitHub 目前主要結構

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
│  └─ 首頁名稱、作者與 deployment 版本時間戳
├─ exam-browser-history.js
│  └─ 手機／瀏覽器返回鍵的站內逐層導航
│
├─ chapter-bank/
│  └─ science/
│     └─ 7-1/
│        └─ unit-01/
│           └─ section-02/
│              └─ school-exams.json
│
├─ past-exams/
│  └─ bct/
│     └─ 90/
│        ├─ first/
│        │  ├─ chinese.json
│        │  └─ math.json
│        └─ second/
│           └─ chinese.json
│
└─ .github/
   └─ workflows/
      └─ pages.yml
```

Private：

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

# 21. 版權與 provenance

- 使用者提供的課本／講義可保存私人 Drive 作個人學習參考。
- 原始教材與完整段考卷以私人 Drive 保存為主。
- 「網路上可下載」不代表可以無限制公開重製。
- 公開 GitHub 主要保存網站需要的結構化題庫與必要 assets。
- 若來源權利或重製條件不清楚，採保守方式處理。
- 題目結構化後仍保存 provenance。
- 題意有疑義時回到原卷／原教材，不靠模型記憶自行補字。

---

# 22. 安全規則

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
- 對 Google Drive 的新增、修改、重新命名、移動、刪除與目錄整理，只允許發生在 `D:\我的雲端硬碟\國中教材參考資料` 及其子路徑。
- `D:\我的雲端硬碟\國中教材參考資料` 以外的 Google Drive 路徑一律視為唯讀，不可進行任何變更。

---

# 23. 目前工作進度

## 已完成

- [x] GitHub Pages 題庫網站
- [x] 手機版 responsive
- [x] 五科 + 歷屆考題主入口
- [x] 首頁品牌更新為「國中全科學習題庫」
- [x] 首頁顯示作者 `Chris醫師`
- [x] 首頁顯示 GitHub Pages deployment 時間戳版本（Asia/Taipei）
- [x] 手機／瀏覽器系統返回鍵支援站內逐層返回
- [x] GitHub 同步設定移到全站主選單
- [x] 作答紀錄／錯題複習保留於章節題庫
- [x] 115 學年度康軒版國文第一冊完整課次目錄與頁碼已確認
- [x] 自然七上完整教材章節 catalog 骨架
- [x] 自然 `1-2 科學方法` 簡易／中等／困難各 20 題
- [x] `1-2 科學方法` 各校題庫入口
- [x] 第一份自然各校段考：114 大灣國中七上第一次段考
- [x] 大灣國中整卷 40 題 census／章節索引
- [x] 大灣國中 4 題正式歸入 `1-2 科學方法` 各校題庫
- [x] 自然科各校段考 Google Sheet 索引
- [x] 作答／交卷／詳解
- [x] 選項隨機排列（自編題）
- [x] 各校／正式考題保留原始選項順序
- [x] 作答紀錄／錯題紀錄
- [x] 未答與錯答分離
- [x] Private Exam-Record 同步
- [x] Gemini 錯題診斷
- [x] `1-2 科學方法` machine-readable curriculum
- [x] Google Drive 教材 reference 架構
- [x] 國文 canonical 教材知識庫實作模式
- [x] 自然科 canonical 資料庫開始實作
- [x] 自然 `1-2 科學方法` canonical 教材知識庫
- [x] 自然 `1-3 認識實驗室` canonical 教材知識庫
- [x] 自然「單元 1 綜合複習」canonical 教材知識庫
- [x] 教材圖片翻正／保留原始註記的規則文件化
- [x] 90 年第一次基測國文 46 題
- [x] 90 年第二次基測國文 47 題
- [x] 90 年第一次基測數學 32 題
- [x] 正式歷屆考題匯入 SOP
- [x] 校內段考拆題 SOP
- [x] GitHub-first 修改流程

## 下一階段

- [ ] 補建自然 `1-1 生命現象和生物圈` canonical 教材知識庫
- [ ] 持續將使用者提供的自然教材依小節歸檔
- [ ] 將教材原始頁面逐步完整放入對應「原始資料」資料夾
- [ ] 將 `1-2` 各題逐步加入正式 concept ID
- [ ] 將大灣國中其餘題目依 1-1／1-3／2-1～2-4 拆入各校題庫
- [ ] 為 `1-1`、`1-3` 建立網站題庫入口與各校題庫
- [ ] 建立自然單元 2 canonical 教材知識庫
- [ ] 持續匯入其他學校自然段考
- [ ] 讓 Drive canonical → Exam-Record curriculum 的同步流程更固定
- [ ] 對目前基測題持續人工校對
- [ ] 匯入後續基測／教育會考
- [ ] 建立更多科目的 canonical 教材知識庫

---

# 24. 新資料進來時的標準判斷

新的 ChatGPT 對話或新的教材批次，依序判斷：

```text
這是教材？
→ 走 canonical 教材資料庫流程

這是各校段考？
→ 原卷／答案留 Drive
→ census
→ Sheet 索引
→ 拆題
→ chapter-bank

這是正式基測／會考？
→ 保留整卷
→ past-exams

這是學生作答資料？
→ Exam-Record
```

不要把四種資料混在同一個儲存模型。

---

# 25. README 接手規則

新的 ChatGPT 對話要繼續本專案時：

1. 先讀 `chenlijon-dot/Exam/README.md`。
2. 再讀 GitHub `main` 的實際最新檔案；README 與程式不一致時，以最新程式為準並修正 README。
3. 涉及教材時，先查 Google Drive 對應科目／章節的 canonical 教材知識庫。
4. 不要只依模型既有知識重新猜教材內容。
5. 使用者新增教材照片時，依第 6～8 節建立／更新 canonical，不另生重複資料庫。
6. 教材影像只做翻正、裁切、必要校正；不要生成式重畫作為 evidence。
7. 涉及國文七上時，以第 8.1 節的「115 學年度康軒版國文第一冊課文目錄」為 catalog authority。
8. 涉及自然七上時，以第 10 節教材章節樹為準。
9. 涉及校內段考時，依第 12～14 節與 `EXAM_WORKFLOW.md` 的精神處理。
10. 涉及正式歷屆考題時，依第 15～17 節處理。
11. 無法確定章節、答案或來源時標記待確認／unknown，不硬猜。
12. 預設直接使用 GitHub connector 修改文字檔；binary／批次處理才回 `E:\Exam`。
13. 若使用者回報網站 UI／手機顯示問題，先確認首頁顯示的「版本時間戳」，判斷是否為舊快取或舊 deployment。
14. 首頁版本時間戳代表網站 deployment；README 最後更新日期代表文件維護日期，兩者分開管理。
15. 每完成新教材 canonical、新章節、新段考批次、新歷屆試卷、網站重大功能或首頁／版本規則調整，都更新 README。
16. 任何 Google Drive 的新增、修改、重新命名、移動、刪除或目錄整理，**只能**在 `D:\我的雲端硬碟\國中教材參考資料` 及其子路徑內進行；其他 Google Drive 路徑即使可以存取，也一律視為唯讀，不可變更。

---

# 26. 目前一句話狀態

截至 2026-09-17：

> 本專案已正式採用「Google Drive 原始教材與 canonical 教材知識庫 → GitHub Exam 結構化可作答題庫 → Private Exam-Record 學習紀錄與 AI curriculum」三層架構。網站首頁現使用「國中全科學習題庫」品牌，顯示作者 Chris醫師，並以每次 GitHub Pages deployment 的台灣時間戳作為目前網站版本識別；手機／瀏覽器返回鍵也已納入站內逐層導航。國文七年級上學期目前以「115 學年度康軒版國文第一冊」實體課本目錄作為 catalog authority；教材、題庫與各校段考課次 mapping 依同一棵課次樹管理。教材資料庫今後統一沿用國文〈夏夜〉已驗證的模式：依科目、學期、單元／課次、小節建立 `原始資料 + 整理資料 + 唯一 canonical Doc`，新教材持續整併而不是重複建檔。Google Drive 的可變更範圍固定限制在 `D:\我的雲端硬碟\國中教材參考資料` 及其子路徑，其他 Drive 路徑一律唯讀。自然七上已完成正式章節樹，`1-2 科學方法` 與 `1-3 認識實驗室` 已開始建立 canonical 教材知識庫；`1-2` 目前另有自編題 60 題及大灣國中各校題庫 4 題。之後所有自然教材與其他科目資料，都沿用同一套資料庫建立方式持續累積。