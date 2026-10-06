# 學校紙本考試紀錄與既有錯題回溯整合設計

日期：2026-10-06

## 1. 目標

將「已完成的學校紙本考試」納入現有 Exam 專案的正式學習歷程，使紙本考試的每一題都能：

- 建立永久 questionId
- 保存學生當時實際作答與正誤
- 累計進既有每題 answeredCount / correctCount / wrongCount
- 出現在既有 question-history 回溯
- 在單元頁提供「學校考試紀錄」入口
- 允許日後重新挑戰同一份考卷，但不改寫原始紙本紀錄

第一份來源為：
- D:\我的雲端硬碟\國中教材參考資料\學校考試卷紀錄\自然科
- 原始影像：七年級第一學期第一單元_1.jpg、七年級第一學期第一單元_2.jpg
- cropped/ 已有題內圖片裁圖與 crop_manifest.txt

本次考試：
- 科目：自然
- 年級學期：7-1
- 範圍：單元 1 生命現象與科學探究
- 總題數：30
- 滿分：100
- 得分：73
- 答對：22
- 答錯：8
- 未答：0

已確認錯題：
- 一-7
- 一-11
- 一-12
- 一-16
- 一-20
- 二-5
- 三-2
- 三-4

配分檢核：
- 基礎題 20 × 3 = 60
- 進階題 5 × 4 = 20
- 素養題 5 × 4 = 20
- 錯題扣分：15 + 4 + 8 = 27
- 100 - 27 = 73

---

## 2. 核心設計原則

### 2.1 紙本考試必須進入既有 question-history authority

紙本考試不建立第二套錯題統計。

所有正式紙本題目仍使用：

- historyDomain: "question"
- 永久 questionId
- questionRevision
- result: "correct" | "incorrect"

既有 ExamQuestionHistoryCore.aggregateQuestionHistory() 繼續作為每題歷史聚合 authority。

同一 questionId 的紙本與網站作答共同累計：

- answeredCount
- correctCount
- wrongCount
- lastAttemptAt
- lastSelectedAnswer
- lastResult

### 2.2 原始紙本紀錄不可被後續題庫修改覆蓋

紙本考試紀錄保存：
- 當時學生答案
- 當時正確答案
- 當時 result
- 當時分數

未來即使題庫詳解、圖片或 revision 更新，原始考試紀錄仍保留當時 snapshot。

### 2.3 Google Sheet 是人工可讀的長期來源，不是 runtime authority

Google Sheet 用於：
- 建檔
- 人工核對
- 題目與 questionId 對應
- 分數 QA
- 匯入狀態追蹤

Runtime authority 仍為 Firebase attempts + GitHub 題庫 JSON。

---

## 3. 三層資料模型

### 3.1 題庫層

責任：
- 題幹
- 選項
- 正解
- 圖片
- mappedSection
- conceptIds
- 永久 questionId / revision

建議路徑：

chapter-bank/science/7-1/unit-01/school-exam-records/
  2026-unit-01-school-exam-01.json
  assets/

每一份紙本考試保留完整原始考卷身份，不強制拆散到 section-01/02/03。

每題另存 mappedSection：
- section-01 → 1-1 生命現象和生物圈
- section-02 → 1-2 科學方法
- section-03 → 1-3 認識實驗室

### 3.2 考試紀錄層

一場紙本考試建立一筆正式 attempt：

- schemaVersion: 3
- historyDomain: "question"
- recordOrigin: "school-paper"
- recordType: "school-exam"
- schoolExamId
- examKey
- subject
- semester
- unitGroup
- submittedAt
- sourceScore
- sourceFullScore
- answers[]

30 個正式作答項目全部進 answers[]，不是只有錯題。

答對：
- answeredCount +1
- correctCount +1

答錯：
- answeredCount +1
- wrongCount +1

### 3.3 回溯層

既有：
- ExamQuestionHistoryCore
- ChrisExamHistoryStore
- exam-question-history.js

不建立新的紙本專用 counter。

聚合條件仍為：
- historyDomain == "question"
- 相同 questionId
- result == correct / incorrect

---

## 4. Google Sheet 設計

建立一份自然科學校考試紀錄 Google Sheet，包含三個工作表：

### 4.1 Exams

一場考試一列。

欄位：

- examId
- subject
- semester
- unitGroup
- examTitle
- schoolName
- className
- examDate
- recordedAt
- fullScore
- earnedScore
- accuracyPercent
- questionCount
- correctCount
- wrongCount
- unansweredCount
- sourceFile1
- sourceFile2
- cropFolder
- attemptId
- historyDomain
- recordOrigin
- firebaseStatus
- githubBankPath
- note

第一筆：

- examId: science-7-1-u01-school-paper-20261006-01
- subject: science
- semester: 7-1
- unitGroup: unit-01
- examTitle: 七年級第一學期第一單元
- fullScore: 100
- earnedScore: 73
- questionCount: 30
- correctCount: 22
- wrongCount: 8
- unansweredCount: 0
- historyDomain: question
- recordOrigin: school-paper
- sourceFile1: 七年級第一學期第一單元_1.jpg
- sourceFile2: 七年級第一學期第一單元_2.jpg

看不出的 schoolName / className / examDate 留空，不推測。

### 4.2 Questions

30 個作答項目 = 30 列。

欄位：

- examId
- itemIndex
- groupCode
- originalNumber
- originalLabel
- questionId
- revision
- mappedSection
- mappedSectionLabel
- conceptIds
- questionType
- question
- optionA
- optionB
- optionC
- optionD
- correctCanonicalIndex
- correctAnswer
- studentCanonicalIndex
- studentAnswer
- result
- points
- earnedPoints
- sourcePage
- sourceFile
- cropImage
- imageRole
- answerVerified
- gradingVerified
- historyEligible
- importStatus
- note

### 4.3 QA

自動檢核項目：

- 總題數 = 30
- 有 questionId = 30
- historyEligible = 30
- correct = 22
- incorrect = 8
- unanswered = 0
- 滿分 = 100
- 計算得分 = 73
- 原卷得分 = 73
- 分數一致 = PASS
- 基礎題配分 = 60
- 進階題配分 = 20
- 素養題配分 = 20
- 總配分 = 100
- duplicate questionId = 0
- missing questionId = 0
- missing result = 0
- missing correct answer = 0
- score mismatch = 0
- invalid mappedSection = 0

只要任何硬性 gate 失敗：
- 不產生正式 school-paper attempt
- 不標記 Firebase 匯入完成

---

## 5. questionId 與題目身份

本考卷正式拆成 30 個永久作答項目：

- 一-1 ～ 一-20
- 二-1 ～ 二-5
- 三-1 ～ 三-5

groupCode + originalNumber 只表示原始考卷位置，不作為永久 identity。

永久 identity：
- questionId
- revision

原始位置：
- originalLabel，例如 "一-7"

一題可以同時保有：
- 原始身份：一-7
- 課程分類：section-02 / 1-2 科學方法

---

## 6. 圖片與 provenance

原始檔：
- 七年級第一學期第一單元_1.jpg
- 七年級第一學期第一單元_2.jpg

cropped 已有：
- q1-1
- q1-2
- q12
- q14
- q15
- q16
- q17
- q18-1
- q18-2
- q20
- q二1
- q二2
- q二3-q二5
- q三3
- q三4-q三5

正式題庫原則：
- 題幹文字化
- 選項文字化
- 真正需要看的圖表才進 assets
- sourceFile 保留原始頁面 provenance
- cropImage 指向題內圖
- 不把整張拍照頁面當作正式題目圖片

---

## 7. school-paper attempt schema

示意：

{
  "schemaVersion": 3,
  "historyDomain": "question",
  "recordOrigin": "school-paper",
  "recordType": "school-exam",
  "schoolExamId": "science-7-1-u01-school-paper-20261006-01",
  "examKey": "science-7-1-u01-school-exam-01",
  "subject": "science",
  "semester": "7-1",
  "unitGroup": "unit-01",
  "sourceScore": 73,
  "sourceFullScore": 100,
  "importedFromSheet": true,
  "answers": []
}

每一題 answer 至少包含：

- questionId
- questionRevision
- questionType
- number
- question
- selectedCanonicalIndex
- correctCanonicalIndex
- selectedDisplayLabel
- selectedText
- correctText
- result
- explanation
- image
- imageAlt

---

## 8. UI 設計

### 8.1 單元頁

在單元 1 頁面：

1-1
1-2
1-3
🏫 學校考試紀錄
核心素養

卡片摘要：

🏫 學校考試紀錄
1 次考試｜最新 73 分｜8 題錯誤

### 8.2 考試列表頁

顯示每場紙本考試：

- 考試名稱
- 分數
- 題數
- 答對
- 答錯
- [查看考卷]

### 8.3 Review mode

查看既有紙本考試時：
- 不建立新 attempt
- 直接顯示當時作答
- 錯題紅框
- 顯示正確答案
- 顯示既有每題歷史統計

錯題示例：

第 7 題
❌ 當時作答：B
✅ 正確答案：D
作答 1 次｜錯題 1 次

答對題：
✅ 當時作答：C

### 8.4 重新挑戰

另提供：
- 重新挑戰這份考卷

只有真正重新作答時才呼叫既有 startExam() 並建立新 attempt。

網站重做：
- recordOrigin: "web"
- schoolExamId: 原紙本考試 ID
- historyDomain: "question"

---

## 9. 與既有各校題庫的邊界

各校題庫：
- 題目來源分類
- 用於練習

學校考試紀錄：
- 特定學生真實考過的結果
- 用於回溯與學習歷程

兩者不合併為同一入口。

---

## 10. 匯入與 QA 流程

建議流程：

紙本原卷
→ 原圖 / cropped / crop_manifest
→ Google Sheet Exams / Questions
→ 題目文字化與答案核對
→ 建立 questionId / revision
→ mappedSection / conceptIds
→ QA PASS
→ 產生 GitHub 題庫 JSON
→ 產生 school-paper attempt
→ 寫入 Firebase users/{uid}/attempts
→ 既有 question-history 聚合
→ 單元頁可查看學校考試紀錄與錯題

---

## 11. 不在本次範圍

本次不做：
- 重新設計 Firebase authority
- 建立 questionProgress counter collection
- 以 Google Sheet 作 runtime 查詢來源
- 將紙本錯題另建第二套 wrong-answer 系統
- 改變既有 ExamQuestionHistoryCore 聚合語意
- 把紙本考試拆散成 1-1/1-2/1-3 三份獨立考卷

---

## 12. 驗收條件

完成後必須滿足：

1. Google Sheet 有完整 30 題紀錄。
2. QA 可反算 73 / 100。
3. 8 個錯題與原卷一致。
4. 所有 30 題都有永久 questionId。
5. 所有 30 題都有 mappedSection。
6. GitHub 題庫可獨立開啟與重做。
7. Firebase 有一筆 recordOrigin = school-paper 的 schema-v3 attempt。
8. 既有 question-history 能將紙本正誤納入 answeredCount / wrongCount。
9. 單元 1 頁面出現「學校考試紀錄」入口。
10. 查看紙本考試不建立新 attempt。
11. 重新挑戰才建立新的 web attempt。
12. 紙本與 web attempt 的相同 questionId 能共同累計錯題次數。
