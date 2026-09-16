(() => {
  'use strict';

  const originalFetch = window.fetch.bind(window);
  const VOCAB_MARKER = 'chapter-bank/english/gept/elementary/vocabulary/gept-beginner-vocabulary.b64.part';
  const RAW_BASE = 'https://raw.githubusercontent.com/chenlijon-dot/Exam/main/';

  function asUrl(input) {
    if (typeof input === 'string') return input;
    if (input && typeof input.url === 'string') return input.url;
    return String(input || '');
  }

  function repoRelativePath(url) {
    const markerIndex = url.indexOf(VOCAB_MARKER);
    return markerIndex >= 0 ? url.slice(markerIndex) : '';
  }

  window.fetch = async function(input, init) {
    const url = asUrl(input);
    const relative = repoRelativePath(url);

    if (!relative) {
      return originalFetch(input, init);
    }

    let firstError = null;
    try {
      const response = await originalFetch(input, init);
      if (response.ok) return response;
      firstError = new Error(`GitHub Pages HTTP ${response.status}`);
      console.warn('[vocab-memory] primary vocabulary fetch failed', url, response.status);
    } catch (error) {
      firstError = error;
      console.warn('[vocab-memory] primary vocabulary fetch threw', url, error);
    }

    const rawUrl = `${RAW_BASE}${relative}`;
    try {
      const response = await originalFetch(rawUrl, {
        ...init,
        cache:'no-store',
        mode:'cors',
        credentials:'omit'
      });
      if (!response.ok) {
        throw new Error(`raw.githubusercontent.com HTTP ${response.status}`);
      }
      console.info('[vocab-memory] vocabulary part loaded from raw fallback', relative);
      return response;
    } catch (fallbackError) {
      console.error('[vocab-memory] both vocabulary fetch routes failed', {
        primary:url,
        fallback:rawUrl,
        firstError,
        fallbackError
      });
      throw new TypeError(`字庫資料抓取失敗：${relative}；主站與 Raw GitHub 都無法讀取`);
    }
  };

  const script = document.createElement('script');
  script.id = 'englishVocabularyCoreV2';
  script.src = `exam-english-vocabulary-v2.js?v=${Date.now()}`;
  script.defer = true;
  script.onerror = () => {
    console.error('[vocab-memory] failed to load vocabulary core v2');
    alert('字庫模組載入失敗，請重新整理頁面後再試。');
  };
  document.head.appendChild(script);
})();
