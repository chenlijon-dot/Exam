# Math Diagram System｜數學繪圖系統

> 本文件說明 Exam 專案內建的數學圖形生成系統。
>
> 核心目的：讓自編題、類題、補強題與未來 AI／adaptive 題目可以由結構化資料直接生成數學圖形，不必依賴外部圖片。
>
> 本系統是 **自編題的圖形引擎**，不是正式教材／正式考卷 evidence 的替代品。

---

# 1. 系統定位

Exam 的數學題目未來不應只能依賴：

```text
外部圖片
截圖
手動畫圖
固定 PNG / JPG
```

而應同時具備自己的程式化繪圖能力：

```text
題目資料
→ diagram spec
→ Math Diagram Renderer
→ SVG
→ 題目畫面
```

這樣才能支援：

```text
自編題
參數變化題
類題生成
錯題補強
adaptive question selection
AI 生成練習題
同 concept 不同數值／情境
```

因此數學繪圖系統視為 Exam 題庫的基礎設施之一，而不是單一章節的特殊功能。

---

# 2. Authority 與正式原圖邊界

必須區分兩種完全不同的用途。

## 2.1 正式教材／正式試題

正式來源優先保留原始 evidence：

```text
正式課本圖
正式講義圖
各校段考原圖
基測／會考原圖
官方表格／統計圖／幾何圖
```

這些應走：

```text
Google Drive 原始 evidence
→ 必要人工裁圖
→ GitHub image asset
→ question.image / images / optionImage
```

不可為了方便而用自製 renderer 重畫後冒充原圖。

## 2.2 自編題／衍生練習題

自編題可以使用：

```text
question.diagram
→ exam-diagram-renderer.js
→ SVG
```

其來源仍應標示為：

```text
sourceType = practice-generated
```

不與 official-past-exam / school-exam 混淆。

---

# 3. 核心設計原則

## 3.1 Data-first

圖形的 authority 是結構化 spec，不是生成後的截圖。

例如：

```json
{
  "type": "number-line",
  "min": -5,
  "max": 5,
  "tickStep": 1,
  "points": [
    { "x": -3, "label": "A", "style": "solid" },
    { "x": 2, "label": "B", "style": "solid" }
  ]
}
```

同一種題型只要更換參數，就可以生成新的圖。

## 3.2 Deterministic / reproducible

同一份 spec 應盡量產生一致的圖形，避免同題每次顯示結果不同。

這對：

```text
題庫 QA
answer verification
AI 生成題
錯題重現
版本追蹤
```

都很重要。

## 3.3 教材可讀性優先

數學圖不是攝影作品。

尤其 3D 圖形的目標不是「像相機看見的透視圖」，而是：

> **讓學生快速理解空間關係的教材式立體示意圖。**

因此 3D renderer 的設計目標是：

```text
平行／斜投影式教材表達
平行邊關係清楚
前後關係清楚
可見邊／隱藏邊語意清楚
不以近大遠小的攝影透視為主要目標
頂點標籤不互相遮擋
座標軸不搶物體本身的視覺語意
```

目前 3D 部分仍在持續調整，最終標準是「人類／學生看得懂」，不是追求 photorealistic perspective。

## 3.4 Responsive

所有生成圖形應使用 SVG / viewBox 等方式，能在：

```text
桌面瀏覽器
手機
Android Student Exam
不同寬度題目卡片
```

維持可讀性。

## 3.5 Safe fallback

不合法的 spec 不應讓整份題庫 crash。

應：

```text
validate
→ warning
→ fallback UI
```

---

# 4. Runtime 架構

目前主要流程：

```text
question.diagram
        ↓
exam-runtime-flex.js
        ↓
建立 question-diagram-host
        ↓
renderDiagram(container, spec)
        ↓
validateDiagramSpec(spec)
        ↓
依 type 分派 renderer
        ↓
SVG
```

核心檔案：

```text
exam-diagram-renderer.js
exam-runtime-flex.js
number-line-renderer-tests.html
index.html
```

正式 runtime 的圖形顯示優先順序：

```text
有 image / images
→ 原始 evidence 優先
→ diagram 不取代原圖

沒有 image / images 且有 diagram
→ 呼叫 Math Diagram Renderer

兩者皆無
→ 純文字題
```

---

# 5. 目前支援的 diagram types

## 5.1 number-line

用途：

```text
正負數位置
數線讀值
兩點距離
相反數
絕對值
未來正負數位移／不等式
```

目前主要欄位：

```text
min
max
tickStep
showNumberLabels
showArrows
points[]
```

point 可包含：

```text
x
label
style
showValue
```

目前 point style：

```text
solid
hollow
marker
```

---

## 5.2 triangle

以 3 個 vertices 定義三角形，可標註 A / B / C 等頂點。

---

## 5.3 square

支援：

```text
4 個 vertices
或
x / y / size
```

可顯示 A / B / C / D 頂點。

---

## 5.4 circle

支援：

```text
center
radius
points[]
```

可標註圓心與圓周點。

---

## 5.5 coordinate-plane / xy-plane

用途：

```text
XY 座標平面
象限
標記點
線段
未來直線／函數圖
```

目前主要能力：

```text
xMin / xMax
yMin / yMax
tickStep
grid
points
segments
```

`xy-plane` 為 `coordinate-plane` alias。

---

## 5.6 solid-projection

目前支援：

```text
cube
cuboid
```

view 支援：

```text
yaw
pitch
roll
projection
```

projection 目前包含：

```text
orthographic
oblique
```

另有：

```text
showVertexLabels
showHiddenEdges
showAxes
axisLength
```

3D renderer 目前仍持續修正「教材式立體可讀性」。

設計目標不是攝影 perspective，而是讓正方體／長方體在 2D 螢幕上保留清楚的：

```text
頂點
邊
平行關係
前後關係
隱藏邊
XYZ 空間方向
```

---

# 6. 題目 JSON 使用範例

## 6.1 數線

```json
{
  "q": "數線上 A 點表示 -3，B 點表示 2，求 A、B 兩點距離。",
  "o": ["3", "4", "5", "6"],
  "a": 2,
  "diagram": {
    "type": "number-line",
    "min": -5,
    "max": 5,
    "tickStep": 1,
    "showNumberLabels": true,
    "showArrows": true,
    "points": [
      { "x": -3, "label": "A", "style": "solid" },
      { "x": 2, "label": "B", "style": "solid" }
    ]
  }
}
```

## 6.2 正方體／長方體

```json
{
  "diagram": {
    "type": "solid-projection",
    "solid": "cube",
    "size": 4,
    "view": {
      "yaw": 38,
      "pitch": 28,
      "roll": 0,
      "projection": "orthographic"
    },
    "showVertexLabels": true,
    "showHiddenEdges": true,
    "showAxes": true
  }
}
```

---

# 7. Smoke Test

目前展示／驗證頁：

```text
number-line-renderer-tests.html
```

雖然檔名仍保留早期的 number-line 名稱，但目前已經是整個 Math Diagram Renderer 的 smoke-test page。

目前涵蓋 12 個案例：

```text
1. 基本數線讀值
2. 兩點距離
3. 大範圍數線 / tickStep
4. 三角形
5. 正方形
6. 圓
7. XY 座標平面與標記點
8. XY 平面線段
9. 空心點與多點數線
10. 正方體 3D 投影
11. 長方體斜投影
12. 正方體 + XYZ 空間方向軸
```

公開測試頁：

```text
https://chenlijon-dot.github.io/Exam/number-line-renderer-tests.html
```

未來檔名可再考慮改為：

```text
diagram-renderer-tests.html
```

但目前不需要為了命名而做大搬動。

---

# 8. 與題庫生成的關係

這套系統真正的重要性不只是「把圖畫出來」。

長期目標是：

```text
concept
+ question template
+ parameters
        ↓
question text
+ options
+ answer
+ diagram spec
        ↓
Math Diagram Renderer
        ↓
新的練習題
```

例如：

```text
template = number-line-distance
A = -3
B = 2
```

可以生成：

```text
題幹
選項
答案
數線圖
```

換成：

```text
A = -7
B = 4
```

即可生成同 concept 的另一題，而不需要重新製作圖片。

這是未來：

```text
大量自編題
類比題
錯題補強
adaptive review
AI-generated practice
```

的重要基礎。

---

# 9. 與 AI／Adaptive Learning 的關係

未來 AI 不應直接輸出一張不可追蹤的圖片。

理想流程：

```text
AI / template engine
→ 產生合法 diagram spec
→ validator
→ deterministic renderer
→ SVG
```

因此 AI 生成的圖形仍然可以：

```text
重新驗證
重新渲染
修改參數
保存 spec
追蹤 concept
```

而不是變成不可維護的黑箱圖片。

---

# 10. Roadmap

## P1：number-line 完整化

優先考慮：

```text
selected number labels
正負數加減的 moves / 位移箭頭
絕對值距離
開／閉區間
不等式區間
多段標示
```

## P2：coordinate-plane 擴充

```text
直線
射線
函數圖
平移
對稱
斜率
區域著色
```

## P3：基本幾何 primitives

```text
segment
ray
angle
parallel-lines
polygon
arc
sector
perpendicular mark
equal-length mark
angle mark
```

## P4：3D solid system

```text
教材式 hidden-line 判斷
face visibility
三角柱
一般角柱
角錐
圓柱
圓錐
更多可讀的標籤配置
```

其中 3D 的核心原則仍是：

> **數學關係與人類可讀性優先，不追求攝影式透視。**

---

# 11. 維護規則

1. 新 diagram type 必須先定義 schema，再寫 renderer。
2. 新 renderer 必須加入 validation。
3. 新能力至少補一個 smoke-test case。
4. 不合法輸入不得讓整頁 crash。
5. 正式原卷／正式教材有原圖時，原圖 evidence 優先。
6. 自編圖不能冒充官方原圖。
7. 生成後圖形只是 presentation；真正可維護資料是 diagram spec。
8. 3D 圖形以教材可讀性為準，不以 photorealistic perspective 為準。
9. 新題庫若能用結構化 diagram 表達，優先保留 spec，而不是把自編圖先 rasterize 成 PNG。
10. README 只保存大方向；本文件作為 Math Diagram System 的專門說明。

---

# 12. 目前一句話狀態

截至 2026-09-20：

> Exam 已建立第一代自有 Math Diagram Renderer，可由結構化 spec 直接產生數線、基本平面幾何、XY 座標平面與正方體／長方體立體示意圖；正式原圖仍維持 evidence 優先。下一階段重點是把數線動作、不等式、座標圖與教材式 3D 可讀性逐步做完整，讓自編題與未來 adaptive／AI 題目能真正「自己生圖」。
