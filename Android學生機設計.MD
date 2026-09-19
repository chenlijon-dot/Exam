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


# 13. SM-T220 改機與系統層建置紀錄（2026-09-19）

本節整理 Samsung Galaxy Tab A7 Lite Wi-Fi（SM-T220）從一般 Android 平板改造成 Student Exam 專用學生機的完整系統層工作。內容包含 Bootloader、AVB、自訂 Kernel、Wacom、Magisk、Zygisk、LSPosed、Samsung Device Owner 額外完整性檢查、系統精簡，以及 CPU / GPU 效能調校。

這一節的目的，是留下此台裝置已驗證可重現的工作路徑，避免日後重新改機時再次踩相同的坑。

---

## 13.1 裝置與底層狀態

~~~text
Samsung Galaxy Tab A7 Lite Wi-Fi
Model: SM-T220
Android 14
One UI 6.1

ro.boot.verifiedbootstate = orange
ro.boot.vbmeta.device_state = unlocked
~~~

目前自訂 Kernel：

~~~text
Linux localhost 4.19.191-28847731-abT220XXSAEYE4
#1 SMP PREEMPT Fri Sep 18 07:24:42 CST 2026
aarch64
~~~

維護原則：

- Bootloader 已解鎖，不要重新鎖回去。
- AVB orange / unlocked 為目前預期狀態。
- Factory reset 會清除 /data，但不會把已刷入 boot partition 的自訂 Kernel 自動改回原廠。
- Factory reset 後，Magisk Manager、Zygisk 設定、LSPosed module 與 userspace 資料可能需要重新建立。
- 不要隨意 OTA。

---

## 13.2 自訂 Kernel 與 Wacom

目前 Kernel 已成功加入 Wacom Intuos 相容支援。

~~~text
Wacom Intuos BT S
VID:PID = 056a:03c6
~~~

目前已確認：

- Wacom 可正常連線。
- 游標可正常移動。
- 自訂 Kernel 可正常開機。
- Android 14 可正常運作。
- Magisk patched boot 可與自訂 Kernel 共存。

Wacom 藍牙仍有事件批次到達的感覺，目前較像 Samsung Bluetooth HCI / input stack 的行為，而不是單純 Wacom HID driver 問題。

---

## 13.3 Magisk Root

目前使用：

~~~text
Magisk 30.7
versionCode = 30700
~~~

驗證：

~~~powershell
$adb = "C:\Users\chenl\AppData\Local\Android\Sdk\platform-tools\adb.exe"
& $adb shell su -c id
~~~

正常結果：

~~~text
uid=0(root) gid=0(root) groups=0(root) context=u:r:magisk:s0
~~~

Factory reset 後曾遇到 su 不存在，但 magiskd 仍在執行。原因是 boot image 內 Magisk 尚在，/data 端 Manager 與授權資料已被清除。

恢復流程：

1. 重新安裝完整 Magisk Manager。
2. 讓 Magisk 完成初始化。
3. 正常 reboot。
4. 再次以 su -c id 驗證 root。

---

## 13.4 Zygisk / LSPosed

目前使用：

~~~text
Zygisk
LSPosed 1.9.2 (7024)
~~~

模組位置：

~~~text
/data/adb/modules/zygisk_lsposed
~~~

若 Factory reset 後 Manager App 消失，可由 LSPosed module 內重新安裝：

~~~powershell
& $adb shell su -c "cp /data/adb/modules/zygisk_lsposed/manager.apk /data/local/tmp/LSPosedManager.apk"
& $adb shell su -c "chmod 644 /data/local/tmp/LSPosedManager.apk"
& $adb shell pm install -r /data/local/tmp/LSPosedManager.apk
~~~

---

# 14. Samsung Device Owner 問題與解法

## 14.1 原始問題

即使是乾淨 Factory reset、完全離線、Accounts = 0，標準 Device Owner 指令仍會失敗。

~~~powershell
& $adb shell dpm set-device-owner --user 0 --device-owner-only com.chenlijon.studentexam/.StudentDeviceAdminReceiver
~~~

Logcat 會出現：

~~~text
KnoxTestKey
Samsung attestation
DevicePolicyManager: Failed in device integrity check
~~~

Samsung 隨後會移除剛設定的 Device Admin。

因此已確認：

> 問題不是「曾經連過網路」，而是 Samsung 在本機 DevicePolicyManager 加入額外完整性檢查。

---

## 14.2 反編譯確認 Samsung 額外 Gate

從 /system/framework/services.jar 反編譯 DevicePolicyManagerService 後，確認 Device Owner 路徑存在：

~~~java
if (!this.mInjector.verifyDeviceIntegrity()) {
    Log.e("DevicePolicyManager", "Failed in device integrity check");
    return false;
}

if (!this.mInjector.isDeviceRootKeyInstalled()) {
    Log.e("DevicePolicyManager", "Failed in (DRK)Device Root Key check");
    return false;
}
~~~

Injector 會呼叫 Samsung DAR：

~~~text
IDarManagerService.isKnoxKeyInstallable()
IDarManagerService.isDeviceRootKeyInstalled()
~~~

Bootloader 解鎖 / Knox 狀態異常時，這層會拒絕 Device Owner。

---

## 14.3 不直接修改 services.jar

曾完成 classes2.dex smali patch，將兩個 gate 改為固定 true，但系統同時存在：

~~~text
/system/framework/oat/arm64/services.art
/system/framework/oat/arm64/services.odex
/system/framework/oat/arm64/services.vdex
~~~

直接替換 services.jar 有 system_server / ART bootloop 風險，因此最後不採用 framework 檔案替換，而改為 LSPosed runtime hook。

---

## 14.4 DpmIntegrityHook

獨立 LSPosed module：

~~~text
Package: com.chenlijon.dpmhook
Project: E:\StudentExam\DpmIntegrityHook
~~~

Hook 目標：

~~~text
com.android.server.devicepolicy.DevicePolicyManagerService$Injector
~~~

替換：

~~~text
verifyDeviceIntegrity()      -> true
isDeviceRootKeyInstalled()   -> true
~~~

LSPosed Scope：

~~~text
System Framework
package = android
~~~

正常 reboot 後應先確認：

~~~text
LSPosed : Loading xposed for system/1000
DpmIntegrityHook: android/system_server loaded
DpmIntegrityHook: Samsung DPM gates hooked
~~~

重要：

> 確認 hook 後不要再用 stop/start 重建 framework。曾發生新 system_server 沒有吃到 hook，導致再次觸發 Knox integrity check。

---

## 14.5 Device Owner 最終成功流程

~~~powershell
& $adb shell dpm set-active-admin --user 0 com.chenlijon.studentexam/.StudentDeviceAdminReceiver
& $adb shell dpm set-device-owner --user 0 --device-owner-only com.chenlijon.studentexam/.StudentDeviceAdminReceiver
& $adb shell dpm list-owners
~~~

成功狀態：

~~~text
1 owner:
User 0: admin=com.chenlijon.studentexam/.StudentDeviceAdminReceiver,DeviceOwner,Affiliated
~~~

正常 reboot 後 Device Owner 仍可保留。

---

# 15. Android 系統精簡 / Debloat

原則：

- 優先 pm disable-user --user 0。
- 不直接刪除 system APK。
- Chrome 保留。
- WebView 保留。
- Wi-Fi / network stack 保留。
- Knox / MDM 核心暫不大量處理。

停用：

~~~powershell
& $adb shell pm disable-user --user 0 PACKAGE
~~~

恢復：

~~~powershell
& $adb shell pm enable PACKAGE
~~~

---

## 15.1 已停用的一般 App / UI 功能

~~~text
com.sec.android.app.samsungapps
com.google.android.youtube
com.google.android.apps.maps
com.google.android.gm
com.google.android.apps.tachyon
com.google.android.googlequicksearchbox
com.samsung.android.game.gamehome
com.samsung.android.kidsinstaller
com.samsung.android.app.spage
com.samsung.android.app.appsedge
com.samsung.android.app.taskedge
com.samsung.android.app.clipboardedge
com.samsung.android.app.dressroom
com.samsung.android.stickercenter
com.samsung.android.dynamiclock
com.samsung.android.galaxycontinuity
com.samsung.android.app.sharelive
com.google.android.printservice.recommendation
com.google.android.feedback
~~~

Chrome 曾停用，後來決定保留並重新啟用：

~~~powershell
& $adb shell pm enable com.android.chrome
~~~

---

## 15.2 已停用的同步 / 媒體 / Samsung 功能

~~~text
com.samsung.android.calendar
com.android.providers.calendar
com.google.android.syncadapters.calendar
com.samsung.android.messaging
com.google.android.apps.messaging
com.samsung.android.scloud
com.samsung.android.smartswitchassistant
com.samsung.android.app.watchmanagerstub
com.samsung.android.app.routines
com.samsung.android.forest
com.samsung.android.video
com.samsung.app.newtrim
com.samsung.android.app.smartcapture
com.samsung.android.service.peoplestripe
com.samsung.android.mobileservice
com.samsung.storyservice
com.samsung.android.beaconmanager
com.samsung.android.easysetup
~~~

---

## 15.3 已停用的 Google 背景分析服務

~~~text
com.google.android.gms.location.history
com.google.android.federatedcompute
com.google.android.ondevicepersonalization.services
com.google.mainline.telemetry
com.google.android.adservices.api
com.google.mainline.adservices
com.google.android.healthconnect.controller
~~~

---

## 15.4 已停用的 Samsung 背景服務

~~~text
com.samsung.android.rubin.app
com.samsung.android.scs
com.samsung.android.aware.service
com.samsung.android.dsms
com.samsung.android.dqagent
com.samsung.android.lool
com.samsung.android.sm.devicesecurity
com.samsung.android.fast
com.samsung.android.mdecservice
com.samsung.android.mdx.kit
com.samsung.android.audiomirroring
com.samsung.android.app.updatecenter
com.samsung.android.mapsagent
com.samsung.android.app.soundpicker
com.samsung.android.secsoundpicker
com.samsung.android.app.clockpack
com.samsung.android.mdx.quickboard
com.samsung.android.app.settings.bixby
~~~

---

## 15.5 暫不處理的核心元件

~~~text
com.android.systemui
com.google.android.webview
com.google.android.gms
com.google.android.gsf
com.google.android.permissioncontroller
com.google.android.packageinstaller
com.google.android.networkstack*
com.google.android.captiveportallogin
com.samsung.android.networkstack*
com.samsung.android.wifi.*
com.samsung.android.honeyboard
com.samsung.android.mdm
com.samsung.android.container
com.samsung.android.knox.*
com.samsung.android.kgclient
com.samsung.klmsagent
com.samsung.aasaservice
com.samsung.android.providers.media
~~~

com.samsung.android.themecenter 為 protected package，無法用一般 disable-user 停用。com.samsung.android.fmm 也未成功停用，目前保留。

---

# 16. 系統效能調校

## 16.1 關閉 Android 動畫

~~~powershell
& $adb shell settings put global window_animation_scale 0
& $adb shell settings put global transition_animation_scale 0
& $adb shell settings put global animator_duration_scale 0
~~~

體感流暢度有明顯改善。

---

## 16.2 背景程序

曾測試：

~~~powershell
& $adb shell settings put global background_process_limit 2
~~~

若 StudentExam / Chrome 出現頻繁重載，優先恢復：

~~~powershell
& $adb shell settings delete global background_process_limit
~~~

---

## 16.3 Wi-Fi / Bluetooth 背景掃描

~~~powershell
& $adb shell settings put global wifi_scan_always_enabled 0
& $adb shell settings put global ble_scan_always_enabled 0
& $adb shell settings put global wifi_wakeup_enabled 0
~~~

完全不需要定位時可再：

~~~powershell
& $adb shell settings put secure location_mode 0
~~~

---

# 17. CPU 調校

## 17.1 CPU Cluster

~~~text
policy0 / CPU0-3
min = 900 MHz
max = 2301 MHz

policy4 / CPU4-7
min = 400 MHz
max = 1800 MHz
~~~

可用 governor：

~~~text
conservative
powersave
performance
schedutil
~~~

原廠為 schedutil。實測切 performance 後，Chrome 圖片瀏覽與滑動明顯更順，顯示原廠 CPU DVFS / scheduler 策略偏保守。

---

## 17.2 cpuset

~~~text
background        = 4-7
system-background = 2-7
foreground        = 0-7
top-app           = 0-7
~~~

Chrome renderer 實測位於 ./top-app，因此不是被限制只能使用部分 CPU。

---

## 17.3 schedtune / uclamp

原廠 top-app：

~~~text
schedtune.boost        = 0
schedtune.prefer_idle  = 0
schedtune.uclamp.min   = 0.00
schedtune.uclamp.max   = max
~~~

目前效能版：

~~~text
schedtune.boost        = 30
schedtune.prefer_idle  = 1
schedtune.uclamp.min   = 20.00
schedtune.uclamp.max   = max
~~~

正確寫入方式：

~~~powershell
& $adb shell "su -c 'echo 30 > /dev/stune/top-app/schedtune.boost'"
& $adb shell "su -c 'echo 1 > /dev/stune/top-app/schedtune.prefer_idle'"
& $adb shell "su -c 'echo 20 > /dev/stune/top-app/schedtune.uclamp.min'"
~~~

注意 PowerShell quoting。若寫成 adb shell su -c "echo ... > ..."，重導向可能落在外層 shell，造成 Permission denied。

後續凡是有重導向、管線或 shell loop，統一使用：

~~~powershell
& $adb shell "su -c 'REMOTE COMMAND'"
~~~

---

# 18. GPU 調校

## 18.1 GPU 型號

SurfaceFlinger 確認：

~~~text
Imagination Technologies
PowerVR Rogue GE8320
OpenGL ES 3.2
~~~

此機 GPU DVFS 不走標準 /sys/class/devfreq，而使用：

~~~text
/proc/gpufreq
/sys/kernel/ged
~~~

---

## 18.2 GPU OPP

~~~text
OPP 0 = 680 MHz
OPP 1 = 500 MHz
OPP 2 = 400 MHz
~~~

原廠大部分時間停在 400 MHz。

GED opp_logs 曾觀察：

~~~text
680 MHz      417 ms
500 MHz      386 ms
400 MHz    46150 ms
~~~

SurfaceFlinger 亦曾觀察到大量 GPU missed frame，顯示 GPU DVFS 也是卡頓來源之一。

---

## 18.3 GPU Boost

原廠：

~~~text
/sys/kernel/ged/hal/custom_boost_gpu_freq = 2
~~~

效能版：

~~~powershell
& $adb shell "su -c 'echo 0 > /sys/kernel/ged/hal/custom_boost_gpu_freq'"
~~~

實測：

~~~text
current_freqency = 0 680000
~~~

即 GPU 穩定於最高 680 MHz。

恢復原廠：

~~~powershell
& $adb shell "su -c 'echo 2 > /sys/kernel/ged/hal/custom_boost_gpu_freq'"
~~~

折衷 500 MHz：

~~~powershell
& $adb shell "su -c 'echo 1 > /sys/kernel/ged/hal/custom_boost_gpu_freq'"
~~~

目前不修改 /proc/gpufreq/gpufreq_fixed_freq_volt，不直接碰 GPU 電壓。

---

# 19. 目前效能版基準

截至 2026-09-19：

~~~text
CPU top-app
  schedtune.boost       = 30
  schedtune.prefer_idle = 1
  schedtune.uclamp.min  = 20%
  schedtune.uclamp.max  = max

GPU
  custom_boost_gpu_freq = 0
  680 MHz

Android
  window_animation_scale     = 0
  transition_animation_scale = 0
  animator_duration_scale    = 0
~~~

加上 Samsung / Google 背景服務精簡後，整體體感已明顯比原始 One UI 流暢。

硬體本身仍有上限，因此目前不再追求更激進的 overclock / voltage 修改。

---

# 20. RAM 現況

精簡後量測：

~~~text
Total RAM: 3,957,976K
Free RAM:  1,311,952K
Used RAM:  2,580,961K
Lost RAM:    362,896K
status normal
~~~

目前 memory pressure 正常，可支撐 StudentExam、WebView、Chrome、Magisk 與 LSPosed。

---

# 21. 下一步：開機自動套用效能參數

CPU / GPU 調校目前屬 runtime 設定，reboot 後可能被系統重設。

下一步建議建立 Magisk service script，在開機完成後自動套用：

~~~text
top-app schedtune.boost = 30
top-app prefer_idle = 1
top-app uclamp.min = 20
GPU custom_boost_gpu_freq = 0
動畫 scale = 0
~~~

建立自動化前先確認：

1. 長時間使用沒有過熱。
2. 充電時沒有異常。
3. Chrome / StudentExam 不會 crash。
4. Wi-Fi 穩定。
5. Device Owner reboot 後仍存在。
6. LSPosed / DpmIntegrityHook reboot 後仍正常。

---

# 22. 改機後核心保護原則

1. 不要 relock bootloader。
2. 不要隨意 OTA。
3. 不要直接替換 services.jar / odex / vdex。
4. 不要停用 WebView。
5. 不要停用 Android network stack。
6. 不要大量停用 Knox / MDM 核心服務。
7. 更新 StudentExam 使用 adb install -r。
8. 修改 CPU / GPU 前先保留恢復指令。
9. Factory reset 前先假設 Magisk userspace / LSPosed 需要重建。
10. Device Owner 已完成後，不再重複測試 Samsung integrity gate。

---

# 23. 改機完成狀態

截至 2026-09-19，本機已完成：

- Bootloader unlock
- 自訂 4.19 Kernel
- Wacom Intuos 支援
- Magisk 30.7 Root
- Zygisk
- LSPosed
- Samsung DPM integrity gate runtime hook
- StudentExam Device Owner
- reboot 後 Device Owner 保留
- 系統 App / 背景服務精簡
- Chrome 保留
- WebView 保留
- Android 動畫關閉
- CPU schedtune 前景加速
- GPU 680 MHz boost
- RAM / CPU / GPU 基本驗證

目前這台 SM-T220 可視為：

> **StudentExam 專用 Android 學生機硬體基準機。**

後續主線：

~~~text
1. 將 CPU / GPU 效能參數做成開機自動套用
2. 完成 StudentExam Lock Task / 系統限制收尾
3. 進入網站端學習歷程與題庫功能開發
~~~

---

## 目前狀態

截至 2026-09-19：

**Android 專用學生機的系統層改機、Device Owner、精簡與效能調校已完成第一版。SM-T220 已建立可重現的學生機基準，下一階段為開機自動效能套用、Kiosk 收尾，以及網站端學習歷程。**
