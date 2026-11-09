(() => {
  'use strict';
  const BASE = 'chapter-bank/english/gept/elementary/vocabulary/static/';
  const PARTS = Array.from({ length: 8 }, (_, i) => BASE + 'gept-vocab-0' + (i + 1) + '.js');
  const READY = BASE + 'gept-vocab-ready.js';
  let loading = null;
  let backAction = null;
  // Navigation within dictionary lookups, independent of the English catalog back button.
  const lookupHistory = [];
  let lookupBackButton = null;

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
      '.english-dict-status{padding:12px 0;color:#475569}',
      '.english-dict-section{margin-top:8px}',
      '.english-dict-source{font-size:.82rem;font-weight:700;color:#64748b}',
      '.english-dict-pronunciations{padding:10px 0;border-top:1px solid #e2e8f0;margin-top:10px}',
      '.english-dict-pron-line{font-size:.9rem;color:#475569;margin-top:4px;overflow-wrap:anywhere}',
      '.english-dict-source-panel{margin-top:14px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden}',
      '.english-dict-source-heading{display:list-item;list-style-position:inside;font-size:.96rem;font-weight:800;margin:0;padding:11px 12px;background:#f1f5f9;color:#334155;cursor:pointer;user-select:none;touch-action:manipulation}',
      '.english-dict-source-heading:hover{background:#e8eff8}',
      '.english-dict-source-heading:focus-visible{outline:2px solid #2563eb;outline-offset:-2px}',
      '.english-dict-source-panel[open]>.english-dict-source-heading{border-bottom:1px solid #e2e8f0}',
      '.english-dict-sense{padding:11px 12px;border-top:1px solid #edf2f7}',
      '.english-dict-sense-meta{display:flex;gap:7px;flex-wrap:wrap;align-items:center;font-size:.84rem}',
      '.english-dict-sense-number{font-weight:800;color:#2563eb}',
      '.english-dict-sense-id{font-size:.74rem;color:#94a3b8}',
      '.english-dict-zh{font-weight:600;color:#1e293b;margin-top:5px;white-space:pre-wrap;overflow-wrap:anywhere}',
      '.english-dict-en{font-size:.92rem;color:#475569;margin-top:5px;white-space:pre-wrap;overflow-wrap:anywhere}',
      '.english-dict-example{font-size:.88rem;color:#64748b;background:#f8fafc;border-left:3px solid #bfdbfe;padding:8px 10px;margin-top:8px;white-space:pre-wrap;overflow-wrap:anywhere}',
      '.english-dict-forms{margin-top:12px;border:1px solid #e2e8f0;border-radius:10px;padding:9px 12px;color:#475569}',
      '.english-dict-forms summary{cursor:pointer;font-weight:700}',
      '.english-dict-form-row{padding:5px 0;border-top:1px solid #f1f5f9}',
      '.english-dict-suggestions{margin:8px 0}',
      '.english-dict-suggestion-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:8px}',
      '.english-dict-suggestion{display:block;min-width:0;padding:11px 12px;border:1px solid #bfdbfe;border-radius:10px;background:#eff6ff;color:#1e40af;font-size:.98rem;text-align:left;overflow-wrap:anywhere}',
      '.english-dict-en,.english-dict-example{cursor:pointer}',
      '.english-dict-example-line{display:flex;align-items:flex-start;gap:7px}',
      '.english-dict-example-text{flex:1;min-width:0;white-space:pre-wrap;overflow-wrap:anywhere}',
      '.english-dict-speak-sentence{flex-shrink:0;font-size:.95rem;min-width:34px;min-height:30px;padding:3px 5px}',
      '.english-dict-speak{border:1px solid #bfdbfe;border-radius:9px;background:#eff6ff;cursor:pointer;font-size:1.2rem;min-height:36px;min-width:43px;padding:4px 9px}',
      '.english-dict-previous{display:block;margin:8px 0 10px;padding:9px 13px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border:1px solid #93c5fd;border-radius:10px;background:#eff6ff;color:#1d4ed8;font-size:1rem;font-weight:700;cursor:pointer}',
      '.english-dict-previous[hidden]{display:none!important}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function speakEnglish(word) {
    const text = String(word || '').trim();
    if (!text || text.length > 1000) return;
    try {
      // Android native TTS currently accepts up to 120 characters. Use
      // WebView speech synthesis for longer complete example sentences.
      if (text.length <= 120 && typeof window.StudentExamNative?.speakEnglish === 'function') {
        window.StudentExamNative.speakEnglish(text);
        return;
      }
      if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
        return;
      }
    } catch (error) {
      console.warn('[EnglishDictionary] pronunciation error', error);
    }
    showStatus('目前裝置無可用的英文發音引擎，請先安裝或啟用英語 TTS。');
  }
  function speakExampleSentence(sentence) {
    const text = String(sentence || '').trim();
    if (!text) return;
    // Current Android bridge allows letters, spaces, apostrophes and hyphens
    // with a 120-char maximum. Normalize punctuation only for native playback.
    const nativeText = text.replace(/[^A-Za-z' -]/g, ' ').replace(/\s+/g, ' ').trim();
    if (nativeText.length > 0 && nativeText.length <= 120 &&
        typeof window.StudentExamNative?.speakEnglish === 'function') {
      window.StudentExamNative.speakEnglish(nativeText);
      return;
    }
    // Browser fallback retains the original sentence and punctuation.
    speakEnglish(text);
  }
  function makeSpeakButton(word, compact = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'english-dict-speak' + (compact ? ' english-dict-speak-sentence' : '');
    button.textContent = '🔊';
    button.title = compact ? '朗讀完整英文例句' : '唸出 ' + String(word || '');
    button.setAttribute('aria-label', compact ? '朗讀完整英文例句' : '發音：' + String(word || ''));
    button.addEventListener('click', event => {
      event.stopPropagation();
      if (compact) speakExampleSentence(word);
      else speakEnglish(word);
    });
    return button;
  }

  function showStatus(message) {
    const el = document.getElementById('englishDictStatus');
    if (el) el.textContent = message;
  }
  function updateLookupBackButton() {
    if (!lookupBackButton) return;
    const previous = lookupHistory[lookupHistory.length - 1];
    lookupBackButton.hidden = !previous;
    lookupBackButton.textContent = previous ? '← 上一個：' + previous.term : '← 上一個';
    lookupBackButton.setAttribute('aria-label', previous ? '返回上一個查詢：' + previous.term : '返回上一個查詢');
  }
  function navigateDictionaryWord(word) {
    const input = document.getElementById('englishDictInput');
    if (!input) return;
    const next = String(word || '').trim();
    const current = input.value.trim();
    if (!next || next.toLowerCase() === current.toLowerCase()) return;
    if (current) lookupHistory.push({term:current, scrollY:window.scrollY});
    input.value = next;
    updateLookupBackButton();
    console.info('[EnglishDictionary] navigate lookup', next, 'depth=' + lookupHistory.length);
    renderCombined(next);
    input.scrollIntoView({block:'start',behavior:'smooth'});
  }
  async function returnToPreviousLookup() {
    const previous = lookupHistory.pop();
    if (!previous) return;
    const input = document.getElementById('englishDictInput');
    if (!input) { lookupHistory.push(previous); return; }
    input.value = previous.term;
    updateLookupBackButton();
    console.info('[EnglishDictionary] previous lookup', previous.term, 'depth=' + lookupHistory.length);
    await renderCombined(previous.term);
    // Restore the earlier reading position after the asynchronous SQLite lookup.
    if (document.getElementById('englishDictInput') === input && input.value === previous.term) {
      requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, previous.scrollY || 0)));
    }
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
      heading.append(word, pos, makeSpeakButton(item.w || item.n || ''));
      card.append(heading, meaning);
      container.appendChild(card);
    }
  }


  // StudentExam Android native SQLite bridge. Plain browsers keep the GEPT fallback.
  const nativeRequests = new Map();
  let nativeSerial = 0;
  window.ChrisExamDictionaryNativeResult = function(requestId, payload) {
    const id = String(requestId);
    const pending = nativeRequests.get(id);
    if (!pending) return;
    nativeRequests.delete(id);
    clearTimeout(pending.timer);
    pending.resolve(payload);
  };
  function searchAndroid(word) {
    if (typeof window.StudentExamNative?.lookupDictionary !== 'function') return Promise.resolve(null);
    const id = 'dict-' + (++nativeSerial);
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        nativeRequests.delete(id);
        console.warn('[EnglishDictionary] Android SQLite timeout; GEPT fallback');
        resolve(null);
      }, 6000);
      nativeRequests.set(id, { resolve, timer });
      try {
        window.StudentExamNative.lookupDictionary(id, word);
      } catch (error) {
        nativeRequests.delete(id);
        clearTimeout(timer);
        console.warn('[EnglishDictionary] Android SQLite failed; GEPT fallback', error);
        resolve(null);
      }
    });
  }
  function normalizeDictionaryText(value) {
    return String(value == null ? '' : value)
      .replace(/\\r\\n|\\n|\\r/g, '\n')
      .replace(/\r\n?/g, '\n')
      .trim();
  }
  function exactGeptEntries(term) {
    const rows = window.__GEPT_VOCAB_ROWS;
    if (!Array.isArray(rows)) return [];
    return rows.filter(row => String(row.n || row.w || '').trim().toLowerCase() === term);
  }
  function splitDictionaryMeanings(value) {
    return normalizeDictionaryText(value)
      .split(/[；;]/)
      .flatMap(part => part.split('\n'))
      .map(part => part.trim())
      .filter(part => part && !/^IPA\s*:/i.test(part));
  }
  function displayEntries(items, statusMessage, ipa, geptItems = [], sourceName = 'ChrisTrans Android SQLite', nativePayload = null) {
    const target = document.getElementById('englishDictResults');
    if (!target) return;
    target.replaceChildren();
    const entries = Array.isArray(items) ? items : [];
    const native = nativePayload && typeof nativePayload === 'object' ? nativePayload : {};
    const make = (tag, cls, value) => {
      const node = document.createElement(tag);
      if (cls) node.className = cls;
      if (value != null) node.textContent = String(value);
      return node;
    };
    const uniqueWords = [...new Set([...geptItems, ...entries]
      .map(x => normalizeDictionaryText(x.w || x.n)).filter(Boolean))];
    const searchWord = uniqueWords[0] ||
      normalizeDictionaryText(document.getElementById('englishDictInput')?.value);
    const card = make('article', 'english-dict-entry');
    const head = make('div', 'english-dict-head');
    head.append(make('strong', 'english-dict-word', searchWord), makeSpeakButton(searchWord));
    card.appendChild(head);

    const pron = Array.isArray(native.pronunciations) ? native.pronunciations : [];
    const seenPron = new Set();
    const ipaValues = [];
    for (const p of pron) {
      const value = normalizeDictionaryText(p?.ipa);
      if (!value) continue;
      const accent = normalizeDictionaryText(p?.accent);
      const source = normalizeDictionaryText(p?.source);
      const key = [value, accent, source].join('|');
      if (seenPron.has(key)) continue;
      seenPron.add(key);
      ipaValues.push((accent ? accent + ' ' : '') + value + (source ? ' · ' + source : ''));
    }
    if (!ipaValues.length && normalizeDictionaryText(ipa)) ipaValues.push(normalizeDictionaryText(ipa));
    if (ipaValues.length) {
      const pronunciation = make('section', 'english-dict-pronunciations');
      pronunciation.append(make('div', 'english-dict-source', '英文發音 · IPA'));
      for (const p of ipaValues) pronunciation.append(make('div', 'english-dict-pron-line', p));
      card.appendChild(pronunciation);
    }

    function section(name, records, preferredOrder) {
      if (!records.length) return;
      const panel = make('details', 'english-dict-source-panel');
      // Open the main Wiktionary/Qwen source initially; keep others compact.
      if (/Wiktionary\s*\/\s*Qwen/i.test(name)) panel.open = true;
      const heading = make('summary', 'english-dict-source-heading', name + ' · ' + records.length + ' 筆詞義');
      heading.setAttribute('aria-label', '展開或收合 ' + name + ' 的 ' + records.length + ' 筆詞義');
      panel.appendChild(heading);
      const ordered = preferredOrder ? [...records].sort((a,b) =>
        (a.p === 'noun' ? 0 : a.p === 'verb' ? 1 : 2) -
        (b.p === 'noun' ? 0 : b.p === 'verb' ? 1 : 2)) : records;
      let count = 0;
      for (const item of ordered) {
        const unit = make('div', 'english-dict-sense');
        const pos = normalizeDictionaryText(item.p || item.pos);
        const meta = make('div', 'english-dict-sense-meta');
        meta.append(make('span', 'english-dict-sense-number', String(++count) + '.'));
        if (pos) meta.append(make('span', 'english-dict-pos', pos));
        if (item.senseId != null) meta.append(make('span', 'english-dict-sense-id', 'Sense ' + item.senseId));
        unit.append(meta);
        // Prefer structured Android V07 fields; never display its preassembled 'c' blob.
        const structured = item.src != null || item.zh != null || item.en != null;
        const zh = normalizeDictionaryText(structured ? item.zh : item.c);
        const en = normalizeDictionaryText(item.en);
        const exampleEn = normalizeDictionaryText(item.exampleEn);
        const exampleZh = normalizeDictionaryText(item.exampleZh);
        if (zh) unit.append(make('div', 'english-dict-zh', zh));
        if (en) unit.append(make('div', 'english-dict-en', en));
        if (exampleEn || exampleZh) {
          const example = make('div', 'english-dict-example');
          if (exampleEn) {
            const line = make('div', 'english-dict-example-line');
            line.append(make('span', 'english-dict-example-text', '例句：' + exampleEn));
            line.append(makeSpeakButton(exampleEn, true));
            example.append(line);
          }
          if (exampleZh) example.append(make('div', '', '翻譯：' + exampleZh));
          unit.append(example);
        }
        if (!zh && !en) unit.append(make('div', 'english-dict-en', '（此筆沒有可顯示的詞義）'));
        panel.append(unit);
      }
      card.append(panel);
    }
    // Keep GEPT and each native source separate. Never concatenate unrelated meanings.
    const geptRecords = [];
    for (const item of geptItems) {
      for (const meaning of splitDictionaryMeanings(item.c)) {
        geptRecords.push({p:item.p || '',c:meaning});
      }
    }
    section('GEPT 常用詞義', geptRecords);
    const bySource = new Map();
    for (const entry of entries) {
      const key = normalizeDictionaryText(entry.src) || sourceName;
      if (!bySource.has(key)) bySource.set(key, []);
      bySource.get(key).push(entry);
    }
    for (const [source, records] of bySource) section(source, records, true);

    const forms = Array.isArray(native.forms) ? native.forms : [];
    if (forms.length) {
      const formBox = make('details', 'english-dict-forms');
      formBox.append(make('summary', '', '詞形變化 · ' + forms.length + ' 筆'));
      for (const form of forms) {
        const label = [normalizeDictionaryText(form?.form), normalizeDictionaryText(form?.tags)]
          .filter(Boolean).join(' — ');
        if (label) formBox.append(make('div', 'english-dict-form-row', label));
      }
      card.append(formBox);
    }
    const extras = Array.isArray(native.examples) ? native.examples : [];
    if (extras.length) {
      const exampleBox = make('details', 'english-dict-forms');
      exampleBox.append(make('summary', '', '其他例句 · ' + extras.length + ' 筆'));
      for (const ex of extras) {
        const block = make('div', 'english-dict-example');
        if (ex.en) {
          const sentence = normalizeDictionaryText(ex.en);
          const line = make('div', 'english-dict-example-line');
          line.append(make('span', 'english-dict-example-text', sentence));
          line.append(makeSpeakButton(sentence, true));
          block.append(line);
        }
        if (ex.zh) block.append(make('div','',normalizeDictionaryText(ex.zh)));
        if (ex.source) block.append(make('div','english-dict-sense-id',normalizeDictionaryText(ex.source)));
        exampleBox.append(block);
      }
      card.append(exampleBox);
    }
    const total = geptRecords.length + entries.length;
    showStatus(statusMessage || (total ? '找到 ' + total + ' 筆詞義 · ' +
      (bySource.size + (geptRecords.length ? 1 : 0)) + ' 個來源' : '查無此字'));
    if (total || ipaValues.length || forms.length) target.appendChild(card);
  }

  // Quick tap on English definitions/examples: word lookup.
  // Long press and text selection remain entirely owned by Android WebView.
  let dictionaryTapStart = null;
  let dictionaryTapInstalled = false;
  function englishWordAtPoint(x, y) {
    const node = document.elementFromPoint(x, y);
    const area = node?.closest?.('.english-dict-en, .english-dict-example');
    if (!area || !document.getElementById('englishDictResults')?.contains(area)) return '';
    // caretRangeFromPoint is supported by Android WebView and avoids changing selection.
    const range = document.caretRangeFromPoint?.(x, y) || null;
    if (!range || !area.contains(range.startContainer)) return '';
    const textNode = range.startContainer;
    if (textNode.nodeType !== Node.TEXT_NODE) return '';
    const value = textNode.textContent || '';
    const offset = range.startOffset;
    const wordChar = c => /[A-Za-z'-]/.test(c || '');
    let left = offset, right = offset;
    // At a word boundary, prefer the letter just before the caret.
    if (!wordChar(value[left]) && left > 0 && wordChar(value[left - 1])) left--;
    right = left;
    while (left > 0 && wordChar(value[left - 1])) left--;
    while (right < value.length && wordChar(value[right])) right++;
    const word = value.slice(left, right).replace(/^[-']+|[-']+$/g, '');
    return /^[A-Za-z][A-Za-z'-]{0,79}$/.test(word) ? word : '';
  }
  function installDictionaryTapLookup() {
    if (dictionaryTapInstalled) return;
    dictionaryTapInstalled = true;
    document.addEventListener('pointerdown', e => {
      dictionaryTapStart = null;
      if (!e.isPrimary || e.button !== 0) return;
      // Tapping a sentence's audio button must never trigger word lookup.
      if (e.target?.closest?.('button')) return;
      if (!e.target?.closest?.('.english-dict-en, .english-dict-example')) return;
      dictionaryTapStart = {id:e.pointerId,x:e.clientX,y:e.clientY,time:performance.now()};
    }, {passive:true});
    document.addEventListener('pointercancel', () => { dictionaryTapStart = null; });
    document.addEventListener('pointerup', e => {
      const start = dictionaryTapStart;
      dictionaryTapStart = null;
      if (!start || e.pointerId !== start.id) return;
      if (performance.now() - start.time > 300) return; // long press: system menu
      if (Math.hypot(e.clientX-start.x,e.clientY-start.y) > 10) return; // scroll/selection
      if (window.getSelection?.()?.toString().trim()) return; // respect native selection
      const word = englishWordAtPoint(e.clientX,e.clientY);
      if (!word) return;
      const input = document.getElementById('englishDictInput');
      if (!input || !document.getElementById('englishDictResults')) return;
      navigateDictionaryWord(word);
    }, {passive:true});
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
  // Prefix matches come from the full official V07 word index, not the small GEPT list.
  function displaySuggestions(matches, total, query, onPick) {
    const target = document.getElementById('englishDictResults');
    if (!target) return;
    target.replaceChildren();
    const rows = Array.isArray(matches) ? matches : [];
    const count = Number.isFinite(Number(total)) ? Number(total) : rows.length;
    showStatus('V07 字首搜尋：找到 ' + count + ' 個詞條' +
      (count > rows.length ? '（目前顯示前 ' + rows.length + ' 筆，請輸入更多字母縮小範圍）' : ''));
    const panel = document.createElement('section');
    panel.className = 'english-dict-suggestions';
    const tip = document.createElement('div');
    tip.className = 'english-dict-help';
    tip.textContent = '點選單字，即可查看 Wiktionary／Qwen V07、FreeDict 和發音資訊。';
    panel.append(tip);
    const list = document.createElement('div');
    list.className = 'english-dict-suggestion-list';
    for (const item of rows) {
      const word = normalizeDictionaryText(item?.w);
      if (!word) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'english-dict-suggestion';
      button.textContent = word;
      button.addEventListener('click', () => onPick(word));
      list.append(button);
    }
    panel.append(list);
    target.append(panel);
  }

  async function renderCombined(query) {
    const token = ++searchVersion;
    const key = String(query || '').trim().toLowerCase();
    if (!key) return render('');
    // Exact GEPT meanings must not disappear when ChrisTrans has a partial entry.
    const gept = exactGeptEntries(key);
    try {
      const native = await searchAndroid(key);
      if (token !== searchVersion) return;
      if (native && native.ok && Array.isArray(native.items) && native.items.length) {
        displayEntries(native.items, '', native.ipa || '', gept, 'ChrisTrans Android SQLite', native);
        return;
      }
      if (native && native.ok && Array.isArray(native.suggestions) && native.suggestions.length) {
        displaySuggestions(native.suggestions, native.totalSuggestions, key, nextWord => {
          navigateDictionaryWord(nextWord);
        });
        return;
      }
      const local = await searchLarge(key);
      if (token !== searchVersion) return;
      if (local.length) {
        displayEntries(local, '', '', gept, 'ChrisTrans 大型字典');
        return;
      }
    } catch (error) {
      if (token !== searchVersion) return;
      console.warn('[EnglishDictionary] combined lookup failed; showing GEPT', error);
    }
    if (token !== searchVersion) return;
    if (gept.length) {
      displayEntries([], '', '', gept, 'GEPT 字庫');
    } else {
      render(query);
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
    lookupHistory.length = 0;
    lookupBackButton = null;
    const root = document.getElementById('catalogContent');
    if (!root) return;
    addStyles();
    installDictionaryTapLookup();
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
    const previousButton = document.createElement('button');
    previousButton.type = 'button';
    previousButton.className = 'english-dict-previous';
    previousButton.hidden = true;
    previousButton.addEventListener('click', returnToPreviousLookup);
    lookupBackButton = previousButton;
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
    const hasNativeDictionary = typeof window.StudentExamNative?.lookupDictionary === 'function';
    if (hasNativeDictionary) {
      intro.textContent = '使用平板內建 ChrisTrans SQLite 大型英漢字典；查字不需要翻譯 API。';
      hint.textContent = '直接輸入英文單字查詢平板本機資料庫。';
      root.replaceChildren(back, breadcrumb, heading, intro, input, previousButton, hint, status, results);
    } else {
      root.replaceChildren(back, breadcrumb, heading, intro, input, previousButton, hint, fileLabel, fileInput, importStatus, status, results);
    }
    input.addEventListener('input', () => {
      // Manual searches begin a new navigation chain.
      lookupHistory.length = 0;
      updateLookupBackButton();
      renderCombined(input.value);
    });
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