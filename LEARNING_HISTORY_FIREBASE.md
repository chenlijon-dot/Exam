# Firebase 學習歷程資料與管理設定

更新日期：2026-09-16

本文件記錄 `chenlijon-dot/Exam` 目前的 Firebase 學習歷程架構、資料格式、登入與權限設計、學生端與管理者端功能，以及後續維護時應注意的事項。

---

## 1. 架構總覽

目前學習歷程已由瀏覽器本機紀錄延伸到 Firebase Firestore 雲端同步。

基本流程：

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

目前 GitHub Token 不再是學習歷程雲端同步的必要條件。

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

本機歷程仍使用：

```text
localStorage key: examRecords.v1
```

主要由 `exam-records.js` 建立。

目前紀錄 schema 約為 `schemaVersion: 2`，常見欄位包含：

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
metadata
```

學習歷程的 Firestore 同步來源，就是此本機紀錄。

---

## 5. Firestore 資料結構

每位使用者的學習歷程獨立放在自己的 UID 下：

```text
users
└── {firebaseUid}
    └── attempts
        ├── {autoId}
        ├── {autoId}
        └── ...
```

完整路徑：

```text
users/{uid}/attempts/{autoId}
```

這樣可以保留每位學生獨立的學習歷程，同時讓管理者透過 collection group 查詢全部 `attempts`。

---

## 6. 雲端 attempt 文件內容

`firebase-firestore-sync.js` 會將本機 attempt 清理後寫入 Firestore，並額外加入：

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
```

用於識別學生 UID。

```text
userEmail
```

讓管理介面可直接顯示學員 Email。

```text
cloudSchemaVersion: 1
```

為目前 Firestore 雲端 schema 版本。

```text
syncedAtClient
```

為前端同步時間。

```text
syncedAt
```

使用 Firestore `serverTimestamp()`。

---

## 7. Firestore 同步模組

檔案：

```text
firebase-firestore-sync.js
```

主要行為：

1. 攔截 `localStorage.setItem()`。
2. 監看 `examRecords.v1`。
3. 當有新的作答紀錄時擷取最新一筆。
4. 使用目前登入的 Firebase UID。
5. 寫入：

```text
users/{uid}/attempts/{autoId}
```

6. 成功後顯示：

```text
✓ 學習歷程已同步到 Firebase
```

為避免重複同步，程式使用 fingerprint 判定最近一筆資料是否已上傳。

---

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

建議 Rules 如下：

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

---

## 12. 目前主選單相關模組

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
```

學習歷程相關主要檔案：

```text
exam-records.js
firebase-auth.js
firebase-firestore-sync.js
firebase-learning-dashboard.js
firebase-admin-learning.js
firebase-account-ui.js
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

---

## 16. 建議後續擴充

後續可逐步增加：

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

這樣管理介面就不需要只依 Email 與 UID 識別學生。

---

## 17. 目前已確認可運作的流程

### 學生

```text
Google 登入
→ 完成測驗
→ 本機 examRecords.v1
→ Firebase 自動同步
→ 📊 我的學習歷程
```

### 管理者

```text
chenlijon@gmail.com 登入
→ 🧑‍🏫 管理學員歷程
→ collectionGroup('attempts')
→ 讀取所有學員紀錄
→ 前端依 submittedAt 排序
→ 選擇學員查看詳細歷程
```

目前此流程已實測可正常運作。

---

## 18. 相關重要 Commit

學習歷程與管理功能的重要變更包含：

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

---

## 19. 核心設計原則

本系統目前的學習歷程設計可簡化為：

```text
Authentication 決定「你是誰」
Firestore Rules 決定「你可以看誰的資料」
users/{uid}/attempts 決定「資料屬於誰」
firebase-firestore-sync.js 負責「如何寫入」
firebase-learning-dashboard.js 負責「學生怎麼看」
firebase-admin-learning.js 負責「管理者怎麼看」
```

後續擴充時，應盡量維持這個責任分離方式。
