(() => {
  'use strict';

  const originalFetch = window.fetch.bind(window);
  const VOCAB_MARKER = 'chapter-bank/english/gept/elementary/vocabulary/gept-beginner-vocabulary.b64.part';
  const RAW_BASE = 'https://raw.githubusercontent.com/chenlijon-dot/Exam/main/';
  const CDN_BASE = 'https://cdn.jsdelivr.net/gh/chenlijon-dot/Exam@main/';
  const LOADER_VERSION = 'XHR-v3-20260916';

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

  function xhrText(url, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.timeout = timeoutMs;
      xhr.responseType = 'text';
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.responseText || '');
          return;
        }
        reject(new Error(`HTTP ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error('network error'));
      xhr.ontimeout = () => reject(new Error('timeout'));
      xhr.onabort = () => reject(new Error('aborted'));
      try {
        xhr.send();
      } catch (error) {
        reject(error);
      }
    });
  }

  async function loadVocabularyPart(relative) {
    const stamp = Date.now();
    const sameOrigin = new URL(relative, document.baseURI).href;
    const candidates = [
      `${sameOrigin}${sameOrigin.includes('?') ? '&' : '?'}v=${stamp}`,
      `${CDN_BASE}${relative}?v=${stamp}`,
      `${RAW_BASE}${relative}?v=${stamp}`
    ];
    const errors = [];

    for (let i = 0; i < candidates.length; i++) {
      const url = candidates[i];
      try {
        const text = await xhrText(url);
        if (text && text.trim().length > 100) {
          console.info(`[vocab-memory] ${LOADER_VERSION} loaded route ${i + 1}`, relative, text.length);
          return text;
        }
        errors.push(`路徑${i + 1}: empty response`);
      } catch (error) {
        errors.push(`路徑${i + 1}: ${error.message}`);
        console.warn(`[vocab-memory] ${LOADER_VERSION} route ${i + 1} failed`, url, error);
      }
    }

    const filename = relative.split('/').pop() || relative;
    throw new Error(`${LOADER_VERSION}：${filename} 讀取失敗（${errors.join('；')}）`);
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

  const script = document.createElement('script');
  script.id = 'englishVocabularyCoreV2';
  script.src = `exam-english-vocabulary-v2.js?v=${Date.now()}`;
  script.defer = true;
  script.onload = () => console.info(`[vocab-memory] ${LOADER_VERSION} core loaded`);
  script.onerror = () => {
    console.error(`[vocab-memory] ${LOADER_VERSION} failed to load vocabulary core v2`);
    alert(`字庫模組載入失敗（${LOADER_VERSION}），請重新整理頁面後再試。`);
  };
  document.head.appendChild(script);
})();
