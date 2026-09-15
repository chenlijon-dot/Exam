# Android 學生機設計

## 1. 專案目標

本專案的目標，是將一般 Android 平板改造成一台「專用學生機」，讓學生開機後即可直接進入題庫與學習網站，並盡量限制離開學習環境、進入系統設定或其他 App 的機會。

目前主要裝置為：

- Samsung Galaxy Tab A7 Lite Wi-Fi
- 型號：SM-T220
- Android 14 / One UI 6.1
- 專用 App：`Student Exam`
- Package：`com.chenlijon.studentexam`
- 題庫網站：`https://chenlijon-dot.github.io/Exam/`

整體設計原則：

1. 學生端操作越簡單越好。
2. 重要設定盡量留在 App 內，不開放 Android 系統設定。
3. 網站負責教材、題庫與學習歷程；Android App 負責裝置控制、Kiosk 與硬體功能。
4. 平板即使沒有一般瀏覽器操作能力，仍可完成題庫作答、資料同步與基本維護。

---

## 2. 整體架構

```text
Samsung SM-T220
    │
    ├─ Android 專用 App：Student Exam
    │     ├─ WebView
    │     ├─ Kiosk / Lock Task
    │     ├─ 開機自動進入
    │     ├─ 沉浸式全螢幕
    │     ├─ 下拉重新整理
    │     ├─ App 內亮度控制
    │     └─ QR Code 掃描 GitHub Token
    │
    └─ GitHub Pages
          └─ chenlijon-dot/Exam
                ├─ 題庫首頁
                ├─ 各科考卷
                ├─ 作答紀錄
                ├─ 錯題紀錄
                ├─ GitHub 同步
                └─ 未來：完整學習歷程
```

Android 與網站之間刻意分工：

- **Android App**：處理平板硬體、權限、相機、亮度、Kiosk。
- **Web App**：處理教材、題目、分數、錯題、學習資料與畫面。

這樣未來新增題目或修改學習介面時，只需要更新 GitHub Pages，不必每次重新編譯 APK。

---

## 3. Android App 現況

### 3.1 WebView 題庫入口

App 啟動後直接載入：

```text
https://chenlijon-dot.github.io/Exam/
```

WebView 已啟用：

- JavaScript
- DOM Storage
- Database
- WebChromeClient

因此網站端可以正常執行互動式題庫、Local Storage / Session Storage 與 JavaScript 功能。

---

### 3.2 Kiosk / Device Owner

本機已將 `Student Exam` 設為 Android Device Owner。

主要用途：

- Lock Task Mode
- 限制離開 Student Exam
- 避免學生切換其他 App
- 避免學生從一般操作路徑離開學習環境

目前 Device Owner：

```text
com.chenlijon.studentexam/.StudentDeviceAdminReceiver
```

因此 **不要直接 uninstall App**，更新版本時使用：

```powershell
adb install -r app-debug.apk
```

若要完全解除 Device Owner，最可靠方式仍是恢復原廠設定。

---

### 3.3 開機自動啟動

App 具備 `BOOT_COMPLETED` Receiver。

平板重新開機後，可自動回到 Student Exam，降低學生重新進入 Android Launcher 或其他環境的機會。

---

### 3.4 沉浸式全螢幕

目前 App 使用 Android immersive sticky 模式隱藏：

- Status Bar
- Navigation Bar

目標是讓平板視覺上更接近「專用學習終端機」，而不是一般 Android 平板。

---

### 3.5 返回鍵行為

返回鍵目前設計為：

```text
若 WebView 有上一頁
→ WebView.goBack()

若已在題庫根頁
→ 不退出 App
```

避免學生一直按返回鍵離開 Student Exam。

---

### 3.6 下拉重新整理

網站外層使用 `SwipeRefreshLayout`。

學生在頁面最上方往下拉即可：

```text
WebView.reload()
```

用途：

- GitHub Pages 更新後快速重新載入
- 網頁暫時異常時自行重整
- 不需要開瀏覽器選單

---

## 4. App 內亮度控制

為避免開放 Android Quick Settings，亮度控制直接做在 Student Exam 內。

目前設計：

```text
右上角 ☀
    ↓
點擊後展開亮度滑桿
    ↓
即時調整目前 App 畫面亮度
    ↓
數秒未操作後自動收合
```

使用 Android Activity 的：

```java
WindowManager.LayoutParams.screenBrightness
```

範圍約：

```text
5% ～ 100%
```

最低亮度保留約 5%，避免學生調成接近全黑後誤以為裝置故障。

此方法只改目前 App 顯示亮度，不需要開放 Android 系統設定。

---

## 5. GitHub 同步設定

網站目前具備 GitHub 同步功能，可將學生作答紀錄同步至另一個 repository。

目前資料端：

```text
chenlijon-dot/Exam-Record
```

網站端 Token 暫存在：

```text
sessionStorage
```

主要目的：

- 平板重新開啟後不永久裸存 Token
- 降低 Token 長期留存在 Web Storage 的風險

---

## 6. QR Code 輸入 GitHub Token

手動輸入 GitHub Personal Access Token 太長，不適合大量部署學生平板，因此目前已加入 QR Code 掃描功能。

### 6.1 流程

```text
GitHub 同步設定
    ↓
按「掃描 Token QR Code」
    ↓
Android 原生開啟相機
    ↓
掃描 QR Code
    ↓
驗證 Token 格式
    ↓
回傳 WebView
    ↓
自動填入 GitHub Token 欄位
```

Android 端使用：

```text
ZXing Android Embedded
```

Gradle dependency：

```gradle
implementation 'com.journeyapps:zxing-android-embedded:4.3.0'
```

Manifest 需要：

```xml
<uses-permission android:name="android.permission.CAMERA" />
```

---

### 6.2 QR Token 格式

目前接受：

```text
github_pat_xxxxxxxxx
```

或：

```text
ghp_xxxxxxxxx
```

建議正式部署使用自訂格式：

```text
studentexam://github-token?token=github_pat_xxxxxxxxx
```

這樣可以讓 Student Exam 明確判斷 QR Code 是本系統專用設定資料，而不是一般 QR 文字。

---

### 6.3 Android / JavaScript Bridge

網站透過：

```javascript
window.StudentExamNative.scanGithubToken()
```

呼叫 Android 原生掃描器。

掃描完成後 Android 再將結果送回 WebView。

JavaScript Interface 僅允許在：

```text
https://chenlijon-dot.github.io/
```

執行敏感操作，避免 WebView 若意外開到其他網站時仍可呼叫 QR Token 掃描功能。

---

## 7. App 更新與 Build 環境

主要專案位置：

```text
E:\StudentExam
```

Android SDK：

```text
C:\Users\chenl\AppData\Local\Android\Sdk
```

`local.properties`：

```properties
sdk.dir=C\:\\Users\\chenl\\AppData\\Local\\Android\\Sdk
```

Build：

```powershell
Set-Location "E:\StudentExam"
.\gradlew.bat assembleDebug
```

APK：

```text
E:\StudentExam\app\build\outputs\apk\debug\app-debug.apk
```

更新安裝：

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"

& $adb install -r "E:\StudentExam\app\build\outputs\apk\debug\app-debug.apk"
```

重新啟動：

```powershell
& $adb shell am force-stop com.chenlijon.studentexam
& $adb shell am start -n com.chenlijon.studentexam/.MainActivity
```

---

## 8. PowerShell 5.1 注意事項

### 8.1 UTF-8 BOM

修改 Java / Gradle / XML 時，避免 PowerShell 5.1 的預設 UTF-8 BOM。

統一使用：

```powershell
function Write-Utf8NoBom {
    param(
        [string]$Path,
        [string]$Content
    )

    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}
```

---

### 8.2 不要在互動式 PowerShell 腳本中直接使用 exit

例如：

```powershell
exit $LASTEXITCODE
```

會把整個 PowerShell 視窗直接關閉。

後續維護腳本應改成顯示錯誤後返回，不直接 `exit`。

---

### 8.3 Gradle stderr 與 PowerShell 5.1

Java compiler 有時只是輸出：

```text
Note: ... uses or overrides a deprecated API.
```

但 PowerShell 5.1 可能將 stderr 包成 `NativeCommandError`。

因此不應長期設定：

```powershell
$ErrorActionPreference = "Stop"
```

再直接執行 Gradle。

Build 是否真正失敗，以：

```text
BUILD SUCCESSFUL
```

或：

```text
BUILD FAILED
```

及 `$LASTEXITCODE` 判斷。

---

## 9. 目前學生機完成度

目前這台 SM-T220 已具備：

- 專用 WebView 題庫 App
- 開機自動進入
- Device Owner
- Lock Task / Kiosk
- 沉浸式全螢幕
- 返回鍵不退出
- 下拉重新整理
- App 內亮度調整
- GitHub 作答紀錄同步
- GitHub Token QR Code 掃描
- 不需要讓學生進 Android 系統設定

因此目前可以視為一台基本完成的「Android 專用學生機」。

接下來主要開發重心應從 Android 硬體控制轉移到 **網站端學習歷程設計**。

---

# 10. 下一階段：學習歷程系統

## 10.1 設計方向

學習歷程不應只保存「這次考幾分」，而是要能回答：

```text
學生最近學了什麼？
哪一個單元進步了？
哪一個單元一直錯？
哪些錯題已經訂正？
哪些概念需要再次複習？
```

因此後續資料模型要同時保存：

- 作答紀錄
- 題目層級結果
- 錯題狀態
- 單元熟練度
- 重複作答結果
- 學習趨勢

---

## 10.2 每次作答至少記錄

建議每一份考卷保存：

```text
recordId
studentId
timestamp
subject
chapter
unit
examId
examTitle
questionCount
correctCount
wrongCount
score
durationSec
answers
```

其中 `answers` 至少要能保存：

```text
questionId
selectedAnswer
correctAnswer
isCorrect
```

未來若有需要，再加入：

```text
conceptTag
difficulty
reviewCount
```

---

## 10.3 錯題不只分「對 / 錯」

建議錯題狀態改成三階段：

```text
第一次答錯
→ 尚未複習

複習後答對
→ 已改善

再次答錯
→ 重複錯誤 / 高優先複習
```

因此錯題應具有類似：

```text
status: new | improving | repeated
```

這比單純建立一個錯題清單更能反映學習狀態。

---

## 10.4 單元熟練度

不要只顯示一次考試分數。

例如：

```text
生物 / 科學方法

第一次：60
第二次：70
第三次：90
```

學生與家長真正需要看到的是：

```text
目前熟練度：提升中
最近表現：90%
```

熟練度可由最近數次作答加權計算，而不是永久平均所有歷史分數。

例如未來可考慮：

```text
最近一次       50%
前一次         30%
再前一次       20%
```

讓近期進步可以真實反映在畫面上。

---

## 10.5 學生首頁摘要

首頁不需要一開始就做複雜統計圖。

建議先做一個學生看得懂的摘要：

```text
今天完成 3 份
平均 82 分

最穩定
生物－科學方法 92%

需要複習
數學－一元一次方程式 64%

尚未訂正錯題
7 題
```

核心原則：

- 一眼看懂
- 不需要閱讀複雜報表
- 直接知道下一步該複習什麼

---

## 10.6 今日 / 本週學習統計

建議至少提供：

### 今日

```text
完成考卷數
作答題數
平均正確率
學習時間
新增錯題數
完成訂正數
```

### 本週

```text
總作答次數
各科平均正確率
進步最多的單元
需要加強的單元
重複答錯題數
```

---

## 10.7 GitHub Record 建議方向

未來 `Exam-Record` 不應只是一個混在一起的大 JSON。

可逐步改為：

```text
Exam-Record/

students/
    student-001/
        profile.json
        summary.json
        records/
            2026-09.json
        wrong-questions.json

    student-002/
        ...
```

或依日期分割：

```text
records/
    2026/
        09/
            2026-09-15.json
```

實際格式需等學習歷程資料模型確定後再定案。

不要太早把 GitHub 檔案結構鎖死。

---

## 10.8 未來可延伸功能

當資料結構成熟後，可以自然延伸：

```text
錯題自動組卷
弱點單元自動出題
間隔複習
單元熟練度排行
家長摘要
每週學習報告
學生進步曲線
AI 弱點分析
AI 補強題目
```

其中最重要的仍然是：

> 先把每一次作答資料保存正確，再做分析。

不要反過來先追求漂亮圖表。

---

# 11. 建議開發順序

下一階段建議依序進行：

```text
1. 定義 examRecords.v2 資料格式

2. 為每個學生建立穩定 studentId

3. 保存每一次完整作答紀錄

4. 建立錯題狀態
   new / improving / repeated

5. 建立單元統計

6. 建立首頁「學習摘要」

7. 建立今日 / 本週歷程

8. 再加入趨勢圖表

9. 最後才做 AI 弱點分析與自動補強
```

---

# 12. 核心設計原則

整個學生機系統後續維護時，維持以下原則：

### Android 端保持單純

Android 只處理：

- Kiosk
- Device Owner
- WebView
- 相機
- 亮度
- 裝置層級功能

不要把題庫與學習邏輯大量寫進 APK。

### 網站端快速迭代

題庫、成績、學習歷程、錯題與分析全部盡量留在 GitHub Pages。

這樣修改後重新整理即可生效。

### 先資料，再分析

完整保存：

```text
誰
何時
做哪份考卷
每題選什麼
哪些答錯
後來有沒有改善
```

有可靠資料後，再做熟練度、趨勢與 AI 分析。

### 學生介面要簡單

這不是老師後台，也不是研究分析平台。

學生首頁應只回答三件事：

```text
我今天做了什麼？
我目前哪裡最好？
我下一個應該複習什麼？
```

---

## 目前狀態

截至 2026-09-15：

**Android 專用學生機基礎功能已完成，下一階段正式轉入網站端學習歷程設計。**
