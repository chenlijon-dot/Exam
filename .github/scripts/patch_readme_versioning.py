from pathlib import Path

path = Path("README.md")
text = path.read_text(encoding="utf-8")

text = text.replace("> 最後更新：2026-09-14", "> 最後更新：2026-09-15", 1)

old = """# 2. 目前網站主入口

```text
國中題庫
│"""
new = """# 2. 目前網站主入口

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
│"""
if old not in text:
    raise SystemExit("section 2 anchor not found")
text = text.replace(old, new, 1)

anchor = """GitHub 同步屬於全站設定，不重複放在每一個章節。

---

# 3. 題目來源分類"""
replacement = """GitHub 同步屬於全站設定，不重複放在每一個章節。

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

# 3. 題目來源分類"""
if anchor not in text:
    raise SystemExit("section 2.1 anchor not found")
text = text.replace(anchor, replacement, 1)

old_tree = """├─ exam-record-layout.js
│
├─ chapter-bank/"""
new_tree = """├─ exam-record-layout.js
├─ exam-branding.js
│  └─ 首頁名稱、作者與 deployment 版本時間戳
├─ exam-browser-history.js
│  └─ 手機／瀏覽器返回鍵的站內逐層導航
│
├─ chapter-bank/"""
if old_tree in text:
    text = text.replace(old_tree, new_tree, 1)

progress_old = """- [x] 五科 + 歷屆考題主入口
- [x] GitHub 同步設定移到全站主選單"""
progress_new = """- [x] 五科 + 歷屆考題主入口
- [x] 首頁品牌更新為「國中全科學習題庫」
- [x] 首頁顯示作者 `Chris醫師`
- [x] 首頁顯示 GitHub Pages deployment 時間戳版本（Asia/Taipei）
- [x] 手機／瀏覽器系統返回鍵支援站內逐層返回
- [x] GitHub 同步設定移到全站主選單"""
if progress_old not in text:
    raise SystemExit("progress anchor not found")
text = text.replace(progress_old, progress_new, 1)

handoff_old = """12. 預設直接使用 GitHub connector 修改文字檔；binary／批次處理才回 `E:\\Exam`。
13. 每完成新教材 canonical、新章節、新段考批次、新歷屆試卷或重大架構調整，都更新 README。"""
handoff_new = """12. 預設直接使用 GitHub connector 修改文字檔；binary／批次處理才回 `E:\\Exam`。
13. 若使用者回報網站 UI／手機顯示問題，先確認首頁顯示的「版本時間戳」，判斷是否為舊快取或舊 deployment。
14. 首頁版本時間戳代表網站 deployment；README 最後更新日期代表文件維護日期，兩者分開管理。
15. 每完成新教材 canonical、新章節、新段考批次、新歷屆試卷、網站重大功能或首頁／版本規則調整，都更新 README。"""
if handoff_old not in text:
    raise SystemExit("handoff anchor not found")
text = text.replace(handoff_old, handoff_new, 1)

text = text.replace("截至 2026-09-14：", "截至 2026-09-15：", 1)

status_old = "> 本專案已正式採用「Google Drive 原始教材與 canonical 教材知識庫 → GitHub Exam 結構化可作答題庫 → Private Exam-Record 學習紀錄與 AI curriculum」三層架構。"
status_new = "> 本專案已正式採用「Google Drive 原始教材與 canonical 教材知識庫 → GitHub Exam 結構化可作答題庫 → Private Exam-Record 學習紀錄與 AI curriculum」三層架構。網站首頁現使用「國中全科學習題庫」品牌，顯示作者 Chris醫師，並以每次 GitHub Pages deployment 的台灣時間戳作為目前網站版本識別；手機／瀏覽器返回鍵也已納入站內逐層導航。"
if status_old not in text:
    raise SystemExit("status anchor not found")
text = text.replace(status_old, status_new, 1)

path.write_text(text, encoding="utf-8")
print("README versioning documentation patched")
