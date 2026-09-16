(() => {
  'use strict';

  function injectStyles() {
    if (document.getElementById('vocabularyOptionLayoutStyles')) return;

    const style = document.createElement('style');
    style.id = 'vocabularyOptionLayoutStyles';
    style.textContent = `
      body.vocab-memory-active #quiz label.option {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        padding: 10px 14px !important;
        margin: 6px 0 !important;
        min-height: 0 !important;
        line-height: 1.45 !important;
      }

      body.vocab-memory-active #quiz label.option input[type="radio"] {
        flex: 0 0 auto !important;
        margin: 0 !important;
        transform: scale(1.08);
      }

      body.vocab-memory-active #quiz .card {
        padding: 14px 16px !important;
        margin: 10px 0 !important;
      }

      body.vocab-memory-active #quiz .qtitle {
        margin-bottom: 10px !important;
      }

      body.vocab-memory-active #quiz .explain {
        margin-top: 8px !important;
        white-space: pre-line;
      }
    `;
    document.head.appendChild(style);
  }

  function syncVocabularyMode() {
    const title = document.getElementById('examTitle')?.textContent || '';
    const isVocabulary = title.includes('字庫記憶');
    document.body.classList.toggle('vocab-memory-active', isVocabulary);
  }

  function start() {
    injectStyles();
    syncVocabularyMode();

    const target = document.body;
    if (!target) return;

    const observer = new MutationObserver(syncVocabularyMode);
    observer.observe(target, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
