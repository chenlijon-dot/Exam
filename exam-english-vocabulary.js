(() => {
  'use strict';

  const originalFetch = window.fetch.bind(window);
  const VOCAB_MARKER = 'chapter-bank/english/gept/elementary/vocabulary/gept-beginner-vocabulary.b64.part';
  const EMBEDDED_SRC = 'chapter-bank/english/gept/elementary/vocabulary/gept-beginner-vocabulary-embedded.js';
  const RAW_BASE = 'https://raw.githubusercontent.com/chenlijon-dot/Exam/main/';
  const CDN_BASE = 'https://cdn.jsdelivr.net/gh/chenlijon-dot/Exam@main/';
  const LOADER_VERSION = 'EMBED-v5-20260916';

  window.__VOCAB_LOADER_VERSION = LOADER_VERSION;

  function asUrl(input) {
    if (typeof input === 'string') return input;
    if (input && typeof input.url === 'string') return input.url;
    return String(input || '');
  }

  function repoRelativePath(url) {
    const markerIndex = url.indexOf(VOCAB_MARKER);
    return markerIndex >= 0 ? url.slice(markerIndex) : '';
  }

  function partIndex(relative) {
    const match = relative.match(/\.part([123])\.txt(?:\?|$)/);
    return match ? Number(match[1]) - 1 : -1;
  }

  function xhrText(url, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.timeout = timeoutMs;
      xhr.responseType = 'text';
      xhr.onload = () => xhr.status >= 200 && xhr.status < 300
        ? resolve(xhr.responseText || '')
        : reject(new Error(`HTTP ${xhr.status}`));
      xhr.onerror = () => reject(new Error('network error'));
      xhr.ontimeout = () => reject(new Error('timeout'));
      xhr.onabort = () => reject(new Error('aborted'));
      try { xhr.send(); } catch (error) { reject(error); }
    });
  }

  function loadScript(src, id) {
    return new Promise((resolve, reject) => {
      const existing = document.getElementById(id);
      if (existing) {
        if (existing.dataset.loaded === '1') return resolve();
        existing.addEventListener('load', resolve, { once:true });
        existing.addEventListener('error', () => reject(new Error(`script load failed: ${src}`)), { once:true });
        return;
      }
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.defer = true;
      script.onload = () => { script.dataset.loaded = '1'; resolve(); };
      script.onerror = () => reject(new Error(`script load failed: ${src}`));
      document.head.appendChild(script);
    });
  }

  async function ensureEmbeddedPayload() {
    if (Array.isArray(window.__GEPT_VOCAB_PARTS) && window.__GEPT_VOCAB_PARTS.length === 3) return true;
    try {
      await loadScript(`${EMBEDDED_SRC}?v=${Date.now()}`, 'geptVocabularyEmbeddedData');
      return Array.isArray(window.__GEPT_VOCAB_PARTS) && window.__GEPT_VOCAB_PARTS.length === 3;
    } catch (error) {
      console.warn(`[vocab-memory] ${LOADER_VERSION} embedded payload unavailable`, error);
      return false;
    }
  }

  async function loadVocabularyPart(relative) {
    const index = partIndex(relative);
    if (index >= 0 && Array.isArray(window.__GEPT_VOCAB_PARTS)) {
      const embedded = String(window.__GEPT_VOCAB_PARTS[index] || '');
      if (embedded.length > 100) {
        console.info(`[vocab-memory] ${LOADER_VERSION} embedded part ${index + 1}: ${embedded.length}`);
        return embedded;
      }
    }

    const stamp = Date.now();
    const sameOrigin = new URL(relative, document.baseURI).href;
    const candidates = [
      `${sameOrigin}${sameOrigin.includes('?') ? '&' : '?'}v=${stamp}`,
      `${CDN_BASE}${relative}?v=${stamp}`,
      `${RAW_BASE}${relative}?v=${stamp}`
    ];
    const errors = [];
    for (let i = 0; i < candidates.length; i++) {
      try {
        const text = await xhrText(candidates[i]);
        if (text && text.trim().length > 100) return text;
        errors.push(`路徑${i + 1}: empty response`);
      } catch (error) {
        errors.push(`路徑${i + 1}: ${error.message}`);
      }
    }
    throw new Error(`${LOADER_VERSION}：${relative.split('/').pop()} 讀取失敗（${errors.join('；')}）`);
  }

  window.fetch = async function(input, init) {
    const url = asUrl(input);
    const relative = repoRelativePath(url);
    if (!relative) return originalFetch(input, init);
    const text = await loadVocabularyPart(relative);
    return new Response(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  };

  (async () => {
    const embeddedReady = await ensureEmbeddedPayload();
    console.info(`[vocab-memory] ${LOADER_VERSION} embeddedReady=${embeddedReady}`);

    const script = document.createElement('script');
    script.id = 'englishVocabularyCoreV2';
    script.src = `exam-english-vocabulary-v2.js?v=${Date.now()}`;
    script.defer = true;
    script.onload = () => console.info(`[vocab-memory] ${LOADER_VERSION} core loaded; embedded=${Array.isArray(window.__GEPT_VOCAB_PARTS)}`);
    script.onerror = () => alert(`字庫模組載入失敗（${LOADER_VERSION}），請重新整理頁面後再試。`);
    document.head.appendChild(script);
  })();
})();
