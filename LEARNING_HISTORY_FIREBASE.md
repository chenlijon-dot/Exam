# Firebase 學習歷程資料與管理設定

更新日期：2026-09-21

本文件記錄 `chenlijon-dot/Exam` 目前的 Firebase 學習歷程架構、資料格式、登入與權限設計、學生端與管理者端功能，以及 GEPT 初級字庫記憶系統的學習狀態、出題流程與維護注意事項。

---

## 1. 架構總覽

目前系統有兩類學習歷程：

1. 一般測驗的「整份作答紀錄」：`attempts`
2. 英文單字記憶的「單字層級狀態」：`vocabularyProgress` + `vocabularyState`

一般測驗流程：

```text
學生登入 Google
    ↓
Firebase Authentication
    ↓
完成測驗 / 交卷
    ↓
localStorage: examRecords.v1
    ↓
firebase-firestore-sync.js
    ↓
Firestore
users/{uid}/attempts/{autoId}
    ↓
學生：我的學習歷程
管理者：管理學員歷程
```

英文單字記憶流程：

```text
學生登入 Google
    ↓
讀取自己的 vocabularyProgress / vocabularyState
    ↓
前端送出歷史狀態
    ↓
字庫出題服務產生本次試卷
    ↓
學生作答 / 交卷
    ↓
更新本機單字狀態
    ↓
Firestore batch 寫入
users/{uid}/vocabularyProgress/*
users/{uid}/vocabularyState/gept-elementary-markov
```

目前 GitHub Token 不再是 Firebase 學習歷程同步的必要條件。

---

## 2. Firebase 專案

Firebase Project：

```text
ChrisExamPlatform
```

Project ID：

```text
chrisexamplatform
```

Web App：

```text
ChrisExamPlatform-Web
```

主要 Firebase 功能：

- Firebase Authentication
- Cloud Firestore
- Firebase App Check
- Firebase AI Logic

---

## 3. Google 登入與帳號識別

網站使用 Firebase Authentication 的 Google 登入。

目前前端主要透過：

```js
window.ChrisExamAuth
```

取得登入狀態。

常用欄位：

```js
window.ChrisExamAuth.user
window.ChrisExamAuth.uid
window.ChrisExamAuth.email
window.ChrisExamAuth.authorized
```

目前允許進入系統的帳號由 `firebase-auth.js` 控制。

已知帳號白名單包含：

```text
chenlijon@gmail.com
chenrody0320@gmail.com
```

其中管理者帳號為：

```text
chenlijon@gmail.com
```

---

## 4. 本機學習紀錄

### 4.1 一般測驗

本機歷程使用：

```text
localStorage key: examRecords.v1
```

主要由 `exam-records.js` 建立。2026-09-21 起，新完成的正式 attempt 使用：

```text
schemaVersion: 3
historyDomain: "question" | "vocabulary" | "none"
```

目前正式固定題使用：

```text
historyDomain: "question"
```

GEPT Vocabulary 的整份 attempt 標記為：

```text
historyDomain: "vocabulary"
```

`none` 保留給未來明確不參與任何縱向題目歷史的 attempt；目前一般正式題與 GEPT Vocabulary 不使用它。

一般 attempt 常見 exam-level 欄位包含：

```text
recordType
metricType
examKey
subject
subjectLabel
unit
difficulty
submittedAt
durationSeconds
score
accuracyPercent
correct
incorrect
unanswered
total
manualStudyCount
answers
wrongAnswers
```

對 `historyDomain: "question"`，`answers[]` 只保存「真的有作答，而且可以可靠判定 correct / incorrect」的題目歷史。每筆有效固定題答案至少保存：

```text
questionId
questionRevision
questionType
selectedDisplayIndex
selectedDisplayLabel
selectedCanonicalIndex
correctCanonicalIndex
selectedText
result: "correct" | "incorrect"
```

其中：

```text
questionId / questionRevision
→ 永久題目身份

selectedCanonicalIndex / correctCanonicalIndex
→ 選項洗牌後仍維持語意身份

selectedDisplayIndex / selectedDisplayLabel
→ 保留學生當時畫面真正看到、真正選到的選項位置與字母
```

下列狀態不進固定題的 per-question history：

```text
blank MCQ
manual-study
handwriting blank
handwriting unclear
```

數學 handwriting 只有：

```text
correct
incorrect
```

會進 `answers[]`。空白 handwriting 使用 `unanswered`，AI 無法可靠判讀使用 `unclear`，兩者都不增加題目層 `answeredCount` / `wrongCount`。

一般固定題的題目層 authority 仍是：

```text
users/{uid}/attempts/{attemptId}
```

Release 1 不建立：

```text
users/{uid}/questionProgress/{questionId}
```

避免 attempts 與 counter 文件形成雙 authority。

正式 attempt 的完成邊界是：

```text
MCQ grading
→ 等待所有適用的 handwriting grading 完成
→ exam:submitted
→ capture schema-v3 attempt
→ localStorage / Firebase sync
```

按「重新做題」會建立新的 attempt session，重設作答計時與 duplicate guard；同一個已完成 session 不允許再次正式 submit。

一般測驗的 Firestore 同步來源，就是此本機紀錄。

### 4.2 英文單字記憶

字庫記憶另外使用兩個本機 key：

```text
englishVocabularyProgress.v1
englishVocabularyMarkovState.v1
```

用途：

```text
englishVocabularyProgress.v1
→ 單字正式作答後的複習 / 正誤狀態

englishVocabularyMarkovState.v1
→ exposure、targetCount、frontier、recentTargets
```

本機狀態的目的，是在 Firestore 暫時不可用時仍能維持基本學習進度，並在重新取得雲端資料後合併。

---

## 5. Firestore 資料結構

目前每位使用者的資料均放在自己的 UID 下：

```text
users
└── {firebaseUid}
    ├── attempts
    │   ├── {autoId}
    │   └── ...
    │
    ├── vocabularyProgress
    │   ├── gept-elementary:{vocabId}
    │   └── ...
    │
    └── vocabularyState
        └── gept-elementary-markov
```

三類資料用途不同：

```text
attempts
→ 一整份測驗的作答紀錄

vocabularyProgress
→ 某個正式被考過的單字之作答統計

vocabularyState
→ 整個字庫的曝光次數、正式出題次數與跨考卷延續狀態
```

---

## 6. 雲端 attempt 文件內容

`firebase-firestore-sync.js` 會將本機 attempt 清理後寫入：

```text
users/{uid}/attempts/{autoId}
```

attempt 本體保留本機的 `schemaVersion: 3` 與 `historyDomain`，並額外加入：

```text
firebaseUid
userEmail
cloudSchemaVersion
syncedAtClient
syncedAt
```

其中：

```text
firebaseUid
→ 學生 Firebase UID

userEmail
→ 管理介面顯示學員 Email

cloudSchemaVersion: 1
→ Firestore transport / cloud wrapper 版本；不取代 attempt.schemaVersion

syncedAtClient
→ 前端同步時間

syncedAt
→ Firestore serverTimestamp()
```

因此要判斷 attempt 的題目歷史語意，應看：

```text
attempt.schemaVersion
attempt.historyDomain
attempt.answers[]
```

不是只看 `cloudSchemaVersion`。

對固定題：

```text
schemaVersion = 3
historyDomain = "question"
answers[] = 有 permanent questionId 且有明確 grading 的有效作答
```

對 GEPT Vocabulary：

```text
historyDomain = "vocabulary"
單字層 authority 仍是 vocabularyProgress / vocabularyState
```

另外，為了讓動態字庫考卷可以回看「當時那一整份題組」，新版 vocabulary attempt 會額外保存：

```text
vocabularySource
vocabularyItems[]
```

其中每個 `vocabularyItems[]` 至少保留：

```text
vocabId
number
question / chinese
word / wordNorm
options[]
selectedIndex
selectedDisplayLabel
correctIndex
correctDisplayLabel
selectedText
correctText
result
explanation
```

這個 session snapshot 只用來重建歷史考卷畫面，不取代 `vocabId` 的單字 identity，也不取代 `vocabularyProgress` / `vocabularyState` 的長期學習 authority。

## 7. 一般測驗 Firestore 同步與題目歷史讀取模組

檔案：

```text
firebase-firestore-sync.js
```

### 7.1 Attempt 同步

主要行為：

1. 攔截 `localStorage.setItem()`。
2. 監看 `examRecords.v1`。
3. 當有新的 completed attempt 時擷取最新一筆。
4. 使用目前登入的 Firebase UID。
5. 寫入：

```text
users/{uid}/attempts/{autoId}
```

6. 成功後顯示：

```text
✓ 學習歷程已同步到 Firebase
```

為避免同一 completed attempt 重複同步，程式使用 fingerprint 防重複；新的「重新做題」session 仍可產生新的合法 attempt。

### 7.2 History readers

瀏覽器另外公開：

```js
window.ChrisExamHistoryStore = {
  loadRecentQuestionAttempts(limit = 50),
  loadExamAttempts(examKey, limit = 50),
  loadVocabularyAttempts(limit = 50)
}
```

其中前兩個屬於固定題；`loadVocabularyAttempts()` 只讀 `historyDomain == "vocabulary"`，供 GEPT Vocabulary session recall 使用。

用途分成兩種。

每題跨考卷聚合：

```text
users/{uid}/attempts
where historyDomain == "question"
```

reader 會把 Firestore 與同裝置 `localStorage` 的 attempts 合併、去重，再由前端依 `submittedAt` 排序並裁切最多 50 筆。

這 50 份可以來自不同 `examKey`，再以永久 `questionId` 聚合：

```text
answeredCount
correctCount
wrongCount
lastAttemptAt
lastSelectedAnswer
lastResult
```

其中 invariant：

```text
answeredCount = correctCount + wrongCount
```

同一份考卷回溯：

```text
Firestore:
where examKey == current examKey

local fallback:
historyDomain == "question"
+
examKey == current examKey
```

兩邊結果合併後再確認 `historyDomain == "question"`、依 `submittedAt` 排序並裁切最多 50 筆。

現在剛交卷且正在畫面上顯示的 submission 會從歷史回溯清單排除，所以「前一次」指真正上一回。

若 Firebase 尚未 ready、尚未登入或 query 失敗：

```text
return []
```

history 功能不得阻塞考試本體。

Firebase 初始化完成後會送出：

```text
chrisexam-firestore-ready
```

讓 history UI 重新讀取。

### 7.3 Index-free recall reader

2026-09-21 實機驗收時，為避免把 Firestore query failure 誤顯示成「沒有更早的作答紀錄」，history reader 已改成單欄位 query + local fallback：

```text
Firestore 單欄位查詢
+
localStorage attempts
↓
merge / dedupe
↓
client-side submittedAt sort
↓
slice(0, 50)
```

因此目前固定題與 GEPT session recall 都不依賴 `historyDomain + examKey + submittedAt` 這類 composite index。

如果未來為效能重新導入 server-side `orderBy / limit`，才依 Firebase 實際回報建立最小必要 index。

本版仍不建立第二份 `questionProgress` authority。

## 8. 學生端「我的學習歷程」

檔案：

```text
firebase-learning-dashboard.js
```

主選單會顯示：

```text
📊 我的學習歷程
```

學生只能查詢自己的：

```text
users/{自己的 uid}/attempts
```

目前會顯示：

- 今天完成次數
- 累積作答次數
- 平均正確率
- 累積答錯題數
- 各科學習概況
- 最近 10 次作答

目前單次讀取上限：

```text
100 筆
```

並使用：

```js
orderBy('submittedAt', 'desc')
```

因為這是單一使用者子集合查詢，現行配置可正常使用。

---

## 9. 管理者「管理學員歷程」

檔案：

```text
firebase-admin-learning.js
```

只有：

```text
chenlijon@gmail.com
```

登入時，主選單才會出現：

```text
🧑‍🏫 管理學員歷程
```

一般學生不會看到此按鈕。

管理介面目前會顯示：

- 學員 Email
- 學員 Firebase UID
- 累積作答次數
- 平均正確率
- 累積答錯題數
- 最近作答時間
- 各科作答次數與平均正確率
- 最近 50 次作答

左側為學員清單，右側為所選學員詳細資料。

目前管理頁主要針對 `attempts`；單字層級統計尚未做成管理者專用介面。

---

## 10. 管理者跨學員查詢方式

管理端使用：

```js
collectionGroup(db, 'attempts')
```

用來一次讀取：

```text
users/*/attempts/*
```

目前設定：

```js
query(
  collectionGroup(db, 'attempts'),
  limit(500)
)
```

目前不在 Firestore 查詢層使用：

```js
orderBy('submittedAt', 'desc')
```

原因是該查詢會要求 `COLLECTION_GROUP_DESC` 單一欄位索引，而 Firebase Console 介面建立此索引不方便。

因此目前策略為：

```text
Firestore 先抓最多 500 筆
    ↓
前端 JavaScript
    ↓
依 submittedAt 自行排序
```

這樣可避免額外建立 collection-group descending index。

---

## 11. Firestore Security Rules

目前安全設計原則：

```text
一般學生
→ 只能讀自己的 users/{uid}/...
→ 只能寫自己的 users/{uid}/...

管理者 chenlijon@gmail.com
→ 可讀取所有 users/*/attempts/*
→ 不可修改其他學員資料
```

建議 Rules：

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function signedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return signedIn()
        && request.auth.token.email == 'chenlijon@gmail.com'
        && request.auth.token.email_verified == true;
    }

    match /users/{userId} {
      allow read: if signedIn()
                  && (request.auth.uid == userId || isAdmin());

      allow write: if signedIn()
                   && request.auth.uid == userId;

      match /{document=**} {
        allow read: if signedIn()
                    && (request.auth.uid == userId || isAdmin());

        allow write: if signedIn()
                     && request.auth.uid == userId;
      }
    }

    match /{path=**}/attempts/{attemptId} {
      allow read: if isAdmin();
    }
  }
}
```

注意：前端隱藏按鈕不是安全機制，真正的管理者權限必須由 Firestore Rules 保護。

字庫記憶目前寫入：

```text
users/{uid}/vocabularyProgress/*
users/{uid}/vocabularyState/*
```

因為仍位於自己的 `users/{uid}` 下，沿用相同 UID 隔離原則即可。

---

## 12. 目前主選單與學習歷程相關模組

主要 loader：

```text
exam-navigation-fix.js
```

目前會載入：

```text
firebase-auth.js
firebase-firestore-sync.js
firebase-learning-dashboard.js
firebase-account-ui.js
firebase-ai-direct.js
firebase-english-ai-direct.js
firebase-admin-learning.js
exam-english-vocabulary-simple.js
exam-vocabulary-layout-fix.js
```

學習歷程相關主要檔案：

```text
exam-records.js
firebase-auth.js
firebase-firestore-sync.js
firebase-learning-dashboard.js
firebase-admin-learning.js
firebase-account-ui.js
exam-english-vocabulary-simple.js
exam-vocabulary-layout-fix.js
exam-navigation-fix.js
```

---

## 13. 帳號資訊

目前首頁有：

```text
👤 帳號資訊
```

相關檔案：

```text
firebase-account-ui.js
```

可顯示：

- Google Email
- Firebase UID
- 授權狀態
- Firebase 學習歷程狀態
- GitHub Token 狀態
- 登出

GitHub Token 現在主要屬於舊同步／相容用途，不應再作為 Firebase 學習歷程或 Firebase AI Logic 的必要條件。

---

## 14. App Check

Web App 已在 Firebase App Check 註冊：

```text
ChrisExamPlatform-Web
```

Provider：

```text
reCAPTCHA Enterprise
```

主要目的：

- 保護 Firebase AI Logic
- 防止未授權來源濫用 Firebase 後端資源

App Check Site Key 屬於前端公開設定，不是後端 secret。

---

## 15. 維護注意事項

### 15.1 不要解除一般學生的 UID 隔離

一般學生仍應維持：

```text
request.auth.uid == userId
```

避免讀取其他學員紀錄。

### 15.2 管理員權限不可只做在 JavaScript

`firebase-admin-learning.js` 的 Email 判斷只負責 UI 顯示；真正的資料讀取權限必須由 Firestore Rules 控制。

### 15.3 管理者目前只讀

目前設計刻意讓管理者只能讀其他學員資料，不直接修改或刪除學生歷程。

若日後需要管理者編輯功能，應另外建立更嚴格的規則，不要直接把 `allow write` 開給管理員整個 `users/**`。

### 15.4 目前管理頁最多抓 500 筆

管理頁目前：

```text
limit(500)
```

如果未來學員與作答量增加，應改成：

- 分頁
- 日期範圍查詢
- 指定學生查詢
- 彙總統計文件

避免每次開管理介面就讀取大量文件。

### 15.5 submittedAt 格式

目前主要排序依據：

```text
submittedAt
```

若未來 schema 改變，應確保所有新紀錄仍保留可排序的 ISO 日期時間值，或統一改成 Firestore Timestamp。

### 15.6 不要把 exposure、target 與有效作答混為一談

英文單字記憶至少有三個不同概念：

```text
exposureCount
→ 這個英文曾在 A/B/C/D 任一選項出現幾次

targetCount
→ 這個英文正式被選成題目答案幾次

reviewCount
→ 新版語意：這個英文作為 target 且學生真的有選答案、完成有效作答幾次
```

2026-09-21 起，字彙題空白時會在 persistent progress increment 前直接退出，因此不再增加：

```text
reviewCount
correctCount
wrongCount
lastReviewedAt
```

也不建立該題新的 `vocabularyProgress` Firestore update。

但舊資料的 `reviewCount` 可能曾包含 unanswered，因此學生可見的可靠作答次數 authority 一律使用：

```text
answeredCount = correctCount + wrongCount
```

不要用 legacy `reviewCount` 反推 answeredCount。

### 15.7 固定題 history query 與 index

固定題 history Release 1 只讀：

```text
最近最多 50 份 historyDomain == "question" attempts
同 examKey 回溯最近最多 50 份 attempts
```

若 production browser 沒有回報 index error，就不要先建立 speculative composite index。

若 Firestore 明確回報：

```text
failed-precondition
index required
```

只建立 Firebase 指定的 index，並把實際建立內容補回本文件。

## 16. 建議後續擴充

一般學習歷程可逐步增加：

```text
管理者依科目篩選
管理者依日期範圍篩選
最近 7 天 / 30 天學習量
單元正確率趨勢
錯題主題統計
常錯題排行
學員最近登入 / 最近作答
個別學員 AI 學習診斷
管理者備註
學生暱稱 / 班級 / 年級
```

字庫記憶可逐步增加：

```text
學生查詢單字學習紀錄
已看過 X 次 / 考過 Y 次
依錯誤率查詢常錯字
尚未曝光單字數
全字庫覆蓋率
管理者查看學生字庫覆蓋進度
```

若學員數量增加，建議新增 profile：

```text
users/{uid}/profile
```

或：

```text
users/{uid}
```

儲存：

```text
displayName
email
role
className
grade
createdAt
lastActiveAt
```

---

## 17. 目前已確認可運作的流程

### 17.1 一般學生測驗

```text
Google 登入
→ 完成測驗
→ 本機 examRecords.v1
→ Firebase 自動同步
→ 📊 我的學習歷程
```

### 17.2 管理者

```text
chenlijon@gmail.com 登入
→ 🧑‍🏫 管理學員歷程
→ collectionGroup('attempts')
→ 讀取所有學員紀錄
→ 前端依 submittedAt 排序
→ 選擇學員查看詳細歷程
```

### 17.3 英文單字記憶

```text
Google 登入
→ 字庫記憶
→ 選 10 / 20 / 50 / 100 題
→ 讀取本機 + Firestore 學習狀態
→ 產生本次試卷
→ 作答 / 交卷
→ 更新 exposure / target / 正誤統計
→ 寫回 vocabularyProgress + vocabularyState
→ 下一次測驗延續上一張考卷留下的狀態
```

以上流程均已實際驗證可運作。

---

## 18. 相關重要 Commit

既有學習歷程與管理功能的重要變更：

```text
070d64ef611b9714c6c41dfbff3b0e932f7203e7
Firebase Firestore learning-history sync

280a9222d1f1d20a588128de44b9aae5eab9dac7
Learning dashboard loader

61c3d880c2fdc7b593c5387f7e344a196ecfae1c
Add admin learner history dashboard

ccbf1556ba5cd13851980bd5fb1764af56b958f1
Load admin learner history module

a309d2ada198940749d24b55dfef82b896c244ff
Avoid Firestore collection-group sort index in admin dashboard
```

字庫記憶近期重要變更：

```text
be79cd425af13b60f02286e29cc90fc2369d1b4c
Connect vocabulary memory to Markov Apps Script and Firebase state

3f9aae08c12802cbb5176b369a47a9e8b88ea3dc
Hide vocabulary implementation details from learner UI

f467b24ffc8604f6266b9bbee80b8e7b9e757c4d
Render vocabulary explanations as plain multiline text

78f07216107a9aa297099e111b8b572c32e220e5
Add compact inline layout for vocabulary choices

a67c020cffcf688740b42279313b20a82b5e4637
Load compact vocabulary option layout
```

---

## 19. 核心設計原則

整體學習歷程責任分離：

```text
Authentication 決定「你是誰」
Firestore Rules 決定「你可以看誰的資料」
users/{uid}/attempts 決定「整份測驗資料屬於誰」
users/{uid}/vocabularyProgress 決定「單字正式作答紀錄」
users/{uid}/vocabularyState 決定「整個字庫長期學習狀態」
firebase-firestore-sync.js 負責「一般測驗如何寫入」
exam-english-vocabulary-simple.js 負責「字庫記憶如何讀寫與出題」
firebase-learning-dashboard.js 負責「學生怎麼看一般歷程」
firebase-admin-learning.js 負責「管理者怎麼看一般歷程」
```

後續擴充時，應盡量維持這個責任分離方式。

---

# 20. GEPT 初級字庫記憶系統

## 20.1 字庫資料來源

Google Sheet：

```text
GEPT_beginner_vocabulary_master
```

Spreadsheet ID：

```text
1ontnUCuHdV68ngqNi6D1HXJOj3vmxiegsFGjfKVLSrE
```

工作表：

```text
Vocabulary
```

欄位：

```text
id
word
word_norm
part_of_speech
chinese
note
level
academic_vocab
source_page
```

目前來源約：

```text
2397 source rows
2216 distinct word_norm
```

出題與長期學習狀態以 `wordNorm` 作為單字語意層級的統計單位；既有 `vocabularyProgress` 文件識別仍維持：

```text
gept-elementary:{vocabId}
```

不要在未規劃資料遷移前，直接把 Firestore 文件 ID 改成 `wordNorm`。

---

## 20.2 前端入口

主要檔案：

```text
exam-english-vocabulary-simple.js
```

由：

```text
exam-navigation-fix.js
```

動態載入。

目前學生端入口：

```text
英文
→ 全民英檢（GEPT）
→ 字庫記憶
→ 全民英檢初級
```

可選題數：

```text
10
20
50
100
```

學生端不顯示內部演算法名稱、資料來源服務、Firebase、Apps Script 等開發資訊；學生只看到題目、學習進度與詳解。

---

## 20.3 出題服務

目前出題服務 Web App `/exec`：

```text
https://script.google.com/macros/s/AKfycbwXgNBgVNM-N0JR8KsXeOr8DeregYbmKnT78Ru1cYZXYLor_3moTUdg_0_IydRiXQPTHg/exec
```

前端使用：

```text
POST
Content-Type: text/plain;charset=utf-8
```

送出：

```json
{
  "count": 20,
  "mode": "unique-sweep",
  "history": {
    "exposure": {},
    "targetCount": {},
    "frontier": [],
    "recentTargets": []
  }
}
```

回傳主要欄位：

```text
questions
sessionDelta
continuation
stats
```

每題另外包含：

```text
question
options
answer
answerIndex
wordNorm
vocabId
sourceIds
optionDetails
```

`optionDetails` 用於「顯示詳解」時列出 A/B/C/D 每一個英文單字的中文解釋與詞性。

---

## 20.4 同一張考卷的 Unique 規則

同一張考卷中，所有選項使用的 `wordNorm` 都必須不同。

因此：

```text
10 題  = 40 個不同單字
20 題  = 80 個不同單字
50 題  = 200 個不同單字
100 題 = 400 個不同單字
```

同一張考卷內：

```text
一個 wordNorm 最多只能出現一次
```

這個規則同時套用在：

```text
正式答案 target
干擾選項 B/C/D
```

目的：盡量提高每張考卷的字庫覆蓋率，避免一張考卷內反覆看到同一批字。

已實測：

```text
20 題
總使用字數 = 80
不同字數   = 80
maxSessionExposure = 1
uniqueConstraintPassed = True
```

以及：

```text
100 題
總使用字數 = 400
不同字數   = 400
maxSessionExposure = 1
uniqueConstraintPassed = True
```

---

## 20.5 跨考卷延續規則

目前的 Markov 概念只用在「考卷與考卷之間」，不在同一張考卷內重複使用上一題選項。

規則：

```text
第 N 張考卷最後一題的 B/C/D
        ↓
保存成 continuation.frontier
        ↓
第 N+1 張考卷第一題
        ↓
優先從上一張 B/C/D 中挑一個升格成正式 target
```

之後同一張新考卷其餘題目，仍走全域低曝光 Unique Sweep，不再使用本張上一題的 B/C/D 立即接龍。

已實測跨考卷行為：

```text
上一張 frontier：
serious
general
marvelous

下一張第一題：
general

fromPreviousFrontier = True
```

這代表跨考卷延續已正常工作。

---

## 20.6 低曝光優先

除下一張第一題可能由前一張 frontier 升格外，其餘題目優先選：

```text
1. 本張考卷尚未使用
2. exposureCount 較低
3. targetCount 較低
4. 同分才隨機
```

這樣可讓 2216 個不同 `wordNorm` 更快被完整掃過。

以 100 題模式估算，一張可曝光 400 個不同單字；大約 5～6 張考卷即可把整個初級字庫至少曝光一輪，實際順序仍受既有學習狀態影響。

---

# 21. 字庫學習狀態定義

## 21.1 exposureCount

定義：

```text
某英文單字在任一選項 A/B/C/D 出現一次
→ exposureCount +1
```

這是「看過幾次」的概念。

例如：

```text
revise
exposureCount = 2
```

代表學生在測驗中總共看到 `revise` 兩次，不論它當時是答案或干擾選項。

## 21.2 targetCount

定義：

```text
某英文單字正式成為該題答案一次
→ targetCount +1
```

這是「正式考過幾次」的概念。

## 21.3 reviewCount

新版定義：

```text
該單字成為正式 target
+
學生真的選了 A/B/C/D
+
完成交卷
→ reviewCount +1
```

空白題不再增加 `reviewCount`。

`targetCount` 與 `reviewCount` 概念不同：

```text
targetCount
→ 出題系統正式選它當答案幾次

reviewCount
→ 學生對這個 target 完成有效作答幾次
```

所以學生留白時：

```text
targetCount 可增加
reviewCount 不增加
```

舊版資料的 `reviewCount` 可能包含 unanswered，不能當作可靠的 answeredCount authority。

## 21.4 correctCount / wrongCount / unansweredCount

```text
correctCount
→ 正式 target 有效作答且答對幾次

wrongCount
→ 正式 target 有效作答且答錯幾次
```

學生可見的可靠作答次數：

```text
answeredCount = correctCount + wrongCount
```

`unansweredCount` 是 legacy compatibility 欄位。2026-09-21 起的新字彙作答流程：

```text
blank
→ 不增加 correctCount
→ 不增加 wrongCount
→ 不增加 reviewCount
→ 不增加 unansweredCount
→ 不更新 lastReviewedAt
→ 不建立該題 vocabularyProgress Firestore update
```

# 22. vocabularyProgress 文件

路徑：

```text
users/{uid}/vocabularyProgress/gept-elementary:{vocabId}
```

永久 identity：

```text
vocabId
```

目前 GEPT 初級 authority 字庫為 Google Sheet `GEPT_beginner_vocabulary_master`；`Vocabulary` tab 的正式 source row 以 `id` 作為 vocab identity。前端進入題庫後使用：

```text
progressKey = gept-elementary:{vocabId}
```

不要把動態生成的生字題硬轉成一般固定題 `questionId`。

目前常見欄位：

```text
source
sourceLabel
vocabId
word
wordNorm
chinese
reviewCount
wrongCount
correctCount
unansweredCount        # legacy compatibility
exposureCount
targetCount
lastSelectedLabel
lastResult
lastReviewedAt
userEmail
```

例如：

```text
word               revise
correctCount       1
wrongCount         0
reviewCount        1
targetCount        1
lastSelectedLabel  B
lastResult         correct
```

學生顯示的「作答幾次」必須用：

```text
correctCount + wrongCount
```

不能直接使用 legacy `reviewCount`。

### 重要限制

`vocabularyProgress` 只會在單字成為正式 target 且學生有有效選答後建立 / 更新。

因此：

```text
只曾當過 distractor
或
曾當 target 但那次完全空白
```

都可能還沒有自己的新 `vocabularyProgress` update。

所以若要回答：

```text
整個字庫目前到底有哪些字曾經看過？
```

不能只掃 `vocabularyProgress`，必須以 `vocabularyState` 裡的完整 `exposure` map 為準。

## 22.1 GEPT Vocabulary session recall

GEPT Vocabulary 的題目是動態生成，不能用一般固定題的 `questionId + same examKey` 模式回溯。

因此 session recall 使用：

```text
attempt.historyDomain = "vocabulary"
attempt.vocabularyItems[]
```

每次新版本交卷會保存當次實際出現的整份題組 snapshot。之後學生按「回溯」時，系統讀取最近最多 50 份 vocabulary attempts，排除目前這一份，並重建較早的整份動態考卷。

UI 規則：

```text
錯題卡 → 紅色
正確答案 → 綠色
顯示「當時：選 X｜正確 / 錯誤」
上下各一組「前一次｜第 N / M 次｜時間｜後一次」
```

隔離規則：

```text
GEPT recall 只允許在 examType == gept-vocabulary-memory 執行
任何非 GEPT exam:started
→ 立即清除 vocabulary recall button / controls / state
```

因此 GEPT session recall 不得覆寫 Lesson、GEPT Reading 或其他固定題考卷。

舊版 vocabulary attempts 因沒有保存 `vocabularyItems[]`，不能可靠重建整份歷史題組；只保留其既有單字層統計，不做猜測式回溯。

# 23. vocabularyState 文件

路徑：

```text
users/{uid}/vocabularyState/gept-elementary-markov
```

目前欄位：

```text
source
sourceLabel
exposure
targetCount
frontier
recentTargets
updatedAtClient
updatedAt
userEmail
```

其中：

```text
exposure
```

是完整的：

```text
wordNorm → 累積曝光次數
```

例如：

```json
{
  "happy": 4,
  "rapid": 2,
  "revise": 2
}
```

`targetCount` 是完整的：

```text
wordNorm → 累積正式出題次數
```

`frontier`：

```text
上一張考卷最後一題的三個 distractor
```

供下一張考卷第一題優先使用。

`recentTargets`：

```text
最近正式考過的 target
```

用來降低連續考卷過快重複正式 target 的機率。

---

# 24. sessionDelta 與交卷寫回

出題服務不直接修改 Firebase。

它只回傳本次考卷造成的增量：

```text
sessionDelta.exposure
sessionDelta.targetCount
```

以及下一張考卷需要的：

```text
continuation.frontier
continuation.recentTargets
```

交卷後由前端：

```text
exam-english-vocabulary-simple.js
```

進行：

```text
historyBefore + sessionDelta
        ↓
新的 exposure / targetCount
        ↓
更新 localStorage
        ↓
Firestore writeBatch
        ↓
vocabularyProgress
vocabularyState
```

這樣出題服務只負責計算，不持有學生帳號，也不直接寫 Firestore。

---

# 25. 詳解資料

目前每題 API 會回傳：

```text
optionDetails
```

包含 A/B/C/D 四個英文單字各自的：

```text
word
wordNorm
meanings[]
  chinese
  partOfSpeech
```

前端「顯示詳解」目前會列出四個選項，例如：

```text
答案：B

(A) tall：adj. 高的
(B) happy：adj. 快樂的
(C) rapid：adj. 快速的
(D) old：adj. 老的
```

詳解以純文字換行顯示，不把 HTML 字串直接塞入舊考試引擎，避免 `<div>` / `<b>` 標籤被顯示成文字。

---

# 26. 字庫測驗 UI 原則

學生端只呈現學習需要的內容，不顯示內部開發資訊。

學生可看到：

```text
字庫記憶
全民英檢初級
題數
中翻英四選一
個人學習進度
詳解
```

學生端不顯示：

```text
Markov
Unique Sweep
Apps Script
Google Sheet
Firebase
內部演算法名稱
```

這些屬於開發與維護資訊，只保留在程式碼與本文件。

選項版面由：

```text
exam-vocabulary-layout-fix.js
```

做字庫專用調整，目前 radio 與英文選項保持同一行，減少垂直空間：

```text
○ (A) tall
○ (B) happy
○ (C) rapid
○ (D) old
```

不影響其他科目的考卷版面。

---

# 27. 查詢字庫學習歷程時的資料來源

若只查單一已正式有效作答過的單字，可直接查看：

```text
users/{uid}/vocabularyProgress/gept-elementary:{vocabId}
```

若要完整統計：

```text
看過多少不同單字
哪些字只當過 distractor
哪些字尚未正式考過
全字庫曝光率
```

應讀：

```text
users/{uid}/vocabularyState/gept-elementary-markov
```

並以：

```text
exposure
targetCount
```

為主。

若需要有效作答統計，再與：

```text
vocabularyProgress
```

合併，且使用：

```text
answeredCount = correctCount + wrongCount
```

不要以 legacy `reviewCount` 或 `unansweredCount` 當作學生真正作答次數。

因此完整查詢概念是：

```text
vocabularyState
→ 告訴我們「看過 / 正式被出成 target」

vocabularyProgress
→ 告訴我們「有效作答結果」
```

# 28. 後續維護規則

1. 不要把同一張考卷重新改回卷內接龍，否則會破壞「4N 個不同單字」的覆蓋設計。
2. `frontier` 只跨考卷使用。
3. 同一張考卷所有 target + distractor 必須共用同一個 `sessionUsed` 概念。
4. 修改出題演算法後，至少重新驗證 20 題與 100 題的 unique constraint。
5. `maxSessionExposure` 正常應為 `1`。
6. `uniqueConstraintPassed` 正常應為 `True`。
7. 完整 exposure authority 是 `vocabularyState.exposure`，不是只看 `vocabularyProgress.exposureCount`。
8. 不要直接改變既有 `progressKey = gept-elementary:{vocabId}`，除非先規劃 Firestore 資料遷移。
9. 新增學生端 UI 時，避免暴露內部服務與演算法字眼。
10. 修改 Firebase 資料 schema 前，先更新本文件並確認舊資料相容性。
