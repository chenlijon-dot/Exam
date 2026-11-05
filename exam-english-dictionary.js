(() => {
  'use strict';
  const BASE = 'chapter-bank/english/gept/elementary/vocabulary/static/';
  const PARTS = Array.from({ length: 8 }, (_, i) => BASE + 'gept-vocab-0' + (i + 1) + '.js');
  const READY = BASE + 'gept-vocab-ready.js';
  let loading = null;
  let backAction = null;

  function loadScript(path) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = path;
      script.async = false;
      script.onload = resolve;
      script.onerror = () => reject(new Error('字典資料載入失敗：' + path));
      document.head.appendChild(script);
    });
  }
  function loadWords() {
    if (Array.isArray(window.__GEPT_VOCAB_ROWS) && window.__GEPT_VOCAB_ROWS.length >= 2000)
      return Promise.resolve(window.__GEPT_VOCAB_ROWS);
    if (!loading) {
      loading = (async () => {
        window.__GEPT_VOCAB_PACKED = [];
        for (const path of PARTS) await loadScript(path);
        await loadScript(READY);
        if (!Array.isArray(window.__GEPT_VOCAB_ROWS) || window.__GEPT_VOCAB_ROWS.length < 2000)
          throw new Error('字典資料不完整，請重新整理後再試。');
        return window.__GEPT_VOCAB_ROWS;
      })().catch(error => { loading = null; throw error; });
    }
    return loading;
  }

  function addStyles() {
    if (document.getElementById('englishDictionaryStyles')) return;
    const style = document.createElement('style');
    style.id = 'englishDictionaryStyles';
    style.textContent = [
      '.english-dict-search{box-sizing:border-box;width:100%;padding:13px 15px;border:2px solid #bfdbfe;border-radius:13px;font-size:1.15rem;background:#fff;color:#0f172a}',
      '.english-dict-search:focus{outline:2px solid #60a5fa;outline-offset:2px}',
      '.english-dict-help{font-size:.9rem;color:#64748b;margin:8px 0 12px}',
      '.english-dict-results{display:grid;gap:10px}',
      '.english-dict-entry{border:1px solid #dbeafe;border-radius:13px;padding:12px 15px;background:#fff}',
      '.english-dict-head{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}',
      '.english-dict-word{font-size:1.13rem;font-weight:800;color:#1e40af}',
      '.english-dict-pos{font-size:.83rem;color:#64748b}',
      '.english-dict-meaning{margin-top:6px;color:#1e293b;line-height:1.65;white-space:pre-wrap}',
      '.english-dict-status{padding:12px 0;color:#475569}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function showStatus(message) {
    const el = document.getElementById('englishDictStatus');
    if (el) el.textContent = message;
  }
  function render(query) {
    const container = document.getElementById('englishDictResults');
    if (!container) return;
    container.replaceChildren();
    const words = window.__GEPT_VOCAB_ROWS;
    if (!Array.isArray(words) || words.length < 2000) return showStatus('字典資料尚未就緒。');
    const key = String(query || '').trim().toLowerCase();
    if (!key) return showStatus('已載入 ' + words.length + ' 筆字彙，請輸入英文單字。');
    const exact = words.filter(row => String(row.n || row.w || '').toLowerCase() === key);
    const found = exact.length ? exact : words.filter(row => String(row.n || row.w || '').toLowerCase().startsWith(key));
    showStatus(exact.length ? '完全符合：' + exact.length + ' 筆'
      : found.length ? '字首搜尋：' + found.length + ' 筆（最多顯示 30 筆）'
      : '查無此字。第一版僅收錄 GEPT 初級字彙。');
    for (const item of found.slice(0, 30)) {
      const card = document.createElement('div');
      card.className = 'english-dict-entry';
      const heading = document.createElement('div');
      heading.className = 'english-dict-head';
      const word = document.createElement('span');
      word.className = 'english-dict-word';
      word.textContent = item.w || item.n || '';
      const pos = document.createElement('span');
      pos.className = 'english-dict-pos';
      pos.textContent = item.p || '';
      const meaning = document.createElement('div');
      meaning.className = 'english-dict-meaning';
      meaning.textContent = item.c || '（尚無中文釋義）';
      heading.append(word, pos);
      card.append(heading, meaning);
      container.appendChild(card);
    }
  }


  // Large ChrisTrans dictionary: local IndexedDB storage, no translation network calls.
  const LARGE_DB_NAME = 'ChrisExamEnglishDictionary';
  let largeDBPromise = null;
  let searchVersion = 0;
  function openLargeDB() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('此 WebView 不支援 IndexedDB'));
    if (!largeDBPromise) largeDBPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(LARGE_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('entries')) {
          const store = db.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
          store.createIndex('term', 'term', { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB 開啟失敗'));
    }).catch(error => { largeDBPromise = null; throw error; });
    return largeDBPromise;
  }
  async function searchLarge(term) {
    if (localStorage.getItem('chrisExamDictionary.largeReady') !== '1') return [];
    const db = await openLargeDB();
    return new Promise((resolve, reject) => {
      const results = [];
      const tx = db.transaction('entries', 'readonly');
      const index = tx.objectStore('entries').index('term');
      const range = IDBKeyRange.bound(term, term + '\uffff');
      const req = index.openCursor(range);
      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor || results.length >= 30) return resolve(results);
        const v = cursor.value;
        results.push({ w: v.w, p: v.p || '', c: v.c || '' });
        cursor.continue();
      };
      req.onerror = () => reject(req.error || new Error('字典搜尋失敗'));
      tx.onerror = () => reject(tx.error || new Error('字典搜尋失敗'));
    });
  }
  async function renderCombined(query) {
    const token = ++searchVersion;
    const key = String(query || '').trim().toLowerCase();
    if (!key) return render('');
    try {
      const local = await searchLarge(key);
      if (token !== searchVersion) return;
      if (!local.length) return render(query);
      const target = document.getElementById('englishDictResults');
      if (!target) return;
      target.replaceChildren();
      showStatus('ChrisTrans 大型字典：' + local.length + ' 筆結果（最多顯示 30 筆）');
      for (const item of local) {
        const card = document.createElement('div');
        card.className = 'english-dict-entry';
        const heading = document.createElement('div');
        heading.className = 'english-dict-head';
        const word = document.createElement('span');
        word.className = 'english-dict-word';
        word.textContent = item.w;
        const pos = document.createElement('span');
        pos.className = 'english-dict-pos';
        pos.textContent = item.p;
        const meaning = document.createElement('div');
        meaning.className = 'english-dict-meaning';
        meaning.textContent = item.c || '本詞條暫無繁體中文釋義';
        heading.append(word, pos);
        card.append(heading, meaning);
        target.appendChild(card);
      }
    } catch (error) {
      if (token === searchVersion) {
        console.warn('[EnglishDictionary] IndexedDB lookup failed', error);
        render(query);
      }
    }
  }
  function parseEntry(raw) {
    if (!raw || typeof raw.w !== 'string' || !raw.w.trim()) return null;
    const senses = Array.isArray(raw.s) ? raw.s : [];
    const zh = senses.map(v => String(v && v.zh || '').trim()).filter(Boolean);
    const pos = [...new Set(senses.map(v => String(v && v.pos || '').trim()).filter(Boolean))];
    const ipa = Array.isArray(raw.ipa) ? raw.ipa.map(v => String(v && v.ipa || '').trim()).filter(Boolean) : [];
    return {
      term: raw.w.trim().toLowerCase(),
      w: raw.w.trim(),
      p: pos.join('/'),
      c: zh.join('；') + (ipa.length ? (zh.length ? '\n' : '') + 'IPA: ' + ipa.slice(0, 2).join(' / ') : '')
    };
  }
  async function commitBatch(db, batch) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('entries', 'readwrite');
      const store = tx.objectStore('entries');
      for (const item of batch) store.add(item);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('字典寫入失敗'));
      tx.onabort = () => reject(tx.error || new Error('字典匯入中止'));
    });
  }
  async function importLargeDictionary(file, report) {
    const db = await openLargeDB();
    localStorage.removeItem('chrisExamDictionary.largeReady');
    await new Promise((resolve, reject) => {
      const tx = db.transaction('entries', 'readwrite');
      tx.objectStore('entries').clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('清除舊字典失敗'));
    });
    // Read small chunks so an Android tablet never needs to hold all 135k objects in memory.
    let offset = 0, remainder = '', count = 0, batch = [];
    const chunkSize = 1024 * 1024;
    const decoder = new TextDecoder('utf-8', { fatal: true });
    while (offset < file.size) {
      const last = offset + chunkSize >= file.size;
      const bytes = await file.slice(offset, offset + chunkSize).arrayBuffer();
      const chunk = decoder.decode(bytes, { stream: !last });
      offset += chunkSize;
      const combined = remainder + chunk;
      const lines = combined.split('\n');
      remainder = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        const row = parseEntry(JSON.parse(line));
        if (!row) continue;
        batch.push(row);
        count++;
        if (batch.length >= 300) {
          await commitBatch(db, batch);
          batch = [];
        }
      }
      report('匯入中：' + count + ' 筆，檔案已讀取 ' + Math.min(100, Math.round(offset / file.size * 100)) + '%');
    }
    if (remainder.trim()) {
      const last = parseEntry(JSON.parse(remainder));
      if (last) { batch.push(last); count++; }
    }
    if (batch.length) await commitBatch(db, batch);
    if (count < 1000) throw new Error('字典詞條數過少，請確認匯出檔案正確');
    localStorage.setItem('chrisExamDictionary.largeReady', '1');
    localStorage.setItem('chrisExamDictionary.largeCount', String(count));
    report('匯入完成：' + count + ' 筆。之後查字使用本機 IndexedDB。');
    return count;
  }

  async function open(options) {
    if (options && typeof options.onBack === 'function') backAction = options.onBack;
    const root = document.getElementById('catalogContent');
    if (!root) return;
    addStyles();
    document.title = '字典翻譯｜英文科';
    const back = document.createElement('button');
    back.className = 'catalog-back';
    back.textContent = '← 返回英文科';
    back.addEventListener('click', () => { if (backAction) backAction(); });
    const breadcrumb = document.createElement('div');
    breadcrumb.className = 'catalog-path';
    breadcrumb.textContent = '英文　›　字典翻譯';
    const heading = document.createElement('h2');
    heading.className = 'catalog-title';
    heading.textContent = '📖 字典翻譯';
    const intro = document.createElement('p');
    intro.className = 'catalog-sub';
    intro.textContent = '使用 Exam 現有的 GEPT 初級英漢字庫；查字不使用翻譯 API。';
    const input = document.createElement('input');
    input.id = 'englishDictInput';
    input.className = 'english-dict-search';
    input.type = 'search';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.placeholder = '輸入英文，例如 apple、ability、school';
    input.setAttribute('aria-label', '英文單字');
    const hint = document.createElement('p');
    hint.className = 'english-dict-help';
    hint.textContent = '支援完整單字與字首搜尋。第一版不提供整句翻譯或詞形還原。';
    const status = document.createElement('div');
    status.id = 'englishDictStatus';
    status.className = 'english-dict-status';
    status.setAttribute('role', 'status');
    status.textContent = '載入字典中…';
    const results = document.createElement('div');
    results.id = 'englishDictResults';
    results.className = 'english-dict-results';
    const fileLabel = document.createElement('label');
    fileLabel.className = 'english-dict-help';
    fileLabel.textContent = '匯入 ChrisTrans 大型字典（.jsonl）：';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.jsonl,application/x-ndjson';
    fileInput.setAttribute('aria-label', '選擇 ChrisTrans 字典匯出檔');
    const importStatus = document.createElement('div');
    importStatus.className = 'english-dict-help';
    importStatus.textContent = localStorage.getItem('chrisExamDictionary.largeReady') === '1'
      ? '大型字典已安裝：' + (localStorage.getItem('chrisExamDictionary.largeCount') || '?') + ' 筆'
      : '尚未匯入大型字典；目前可使用 GEPT 初級字庫。';
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      fileInput.disabled = true;
      try {
        await importLargeDictionary(file, message => { importStatus.textContent = message; });
        renderCombined(input.value);
      } catch (error) {
        importStatus.textContent = '匯入失敗：' + (error.message || String(error));
        console.error('[EnglishDictionary] import failed', error);
      } finally {
        fileInput.disabled = false;
        fileInput.value = '';
      }
    });
    root.replaceChildren(back, breadcrumb, heading, intro, input, hint, fileLabel, fileInput, importStatus, status, results);
    input.addEventListener('input', () => renderCombined(input.value));
    try {
      await loadWords();
      if (document.getElementById('englishDictInput') === input) {
        renderCombined(input.value);
        input.focus();
      }
    } catch (error) {
      if (document.getElementById('englishDictInput') === input) showStatus(error.message || String(error));
      console.error('[EnglishDictionary] load failed', error);
    }
  }
  window.ChrisExamDictionary = { open };
})();