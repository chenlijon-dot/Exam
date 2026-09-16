(() => {
  'use strict';
  const packed = window.__GEPT_VOCAB_PACKED;
  if (!Array.isArray(packed)) {
    console.error('[vocab-memory] static vocabulary parts were not loaded');
    return;
  }
  window.__GEPT_VOCAB_ROWS = packed.map(row => ({
    id: row[0],
    w: row[1],
    n: row[2],
    c: row[3],
    p: row[4] || ''
  }));
  window.__GEPT_VOCAB_DATA_VERSION = 'static-xlsx-2216-v1';
  console.info(`[vocab-memory] static vocabulary ready: ${window.__GEPT_VOCAB_ROWS.length} rows`);
  if (window.__GEPT_VOCAB_ROWS.length !== 2216) {
    console.error(`[vocab-memory] expected 2216 rows, got ${window.__GEPT_VOCAB_ROWS.length}`);
  }
  delete window.__GEPT_VOCAB_PACKED;
})();
