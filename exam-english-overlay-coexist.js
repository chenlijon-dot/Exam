(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  let rafPending = false;

  function injectStyles() {
    if ($('#englishOverlayCoexistStyles')) return;

    const style = document.createElement('style');
    style.id = 'englishOverlayCoexistStyles';
    style.textContent = `
      /* When passage + AI analysis are both open, the passage modal already
         supplies the page dimming layer. Keep the AI overlay itself transparent
         so both floating windows stay visually bright. */
      #englishAiModal.coexist-with-passage {
        background: transparent !important;
        pointer-events: none;
      }

      #englishAiModal.coexist-with-passage .english-ai-dialog {
        pointer-events: auto;
      }

      /* Passage stays bright while the two windows are separate. Only dim the
         passage card itself when the AI card physically overlaps it. */
      #geptPassageModal .gept-passage-dialog {
        transition: filter .14s ease, opacity .14s ease, box-shadow .14s ease;
      }

      #geptPassageModal .gept-passage-dialog.ai-window-overlap {
        filter: brightness(.64) saturate(.72);
        opacity: .88;
        box-shadow: 0 18px 52px rgba(15,23,42,.24);
      }
    `;
    document.head.appendChild(style);
  }

  function visible(el) {
    if (!el || el.classList.contains('hidden')) return false;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function meaningfulOverlap(a, b) {
    const left = Math.max(a.left, b.left);
    const right = Math.min(a.right, b.right);
    const top = Math.max(a.top, b.top);
    const bottom = Math.min(a.bottom, b.bottom);

    // Require a few pixels of real intersection so merely touching borders
    // does not make the passage flicker dark/bright while dragging.
    return (right - left) > 8 && (bottom - top) > 8;
  }

  function syncWindowBrightness() {
    rafPending = false;

    const passageModal = $('#geptPassageModal');
    const passageDialog = $('.gept-passage-dialog', passageModal);
    const aiModal = $('#englishAiModal');
    const aiDialog = $('.english-ai-dialog', aiModal);

    const passageOpen = visible(passageModal) && visible(passageDialog);
    const aiOpen = visible(aiModal) && visible(aiDialog);
    const coexist = passageOpen && aiOpen;

    aiModal?.classList.toggle('coexist-with-passage', coexist);

    let overlapped = false;
    if (coexist) {
      overlapped = meaningfulOverlap(
        passageDialog.getBoundingClientRect(),
        aiDialog.getBoundingClientRect()
      );
    }

    passageDialog?.classList.toggle('ai-window-overlap', overlapped);
  }

  function scheduleSync() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(syncWindowBrightness);
  }

  function watchDom() {
    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    // Both dialogs use Pointer Events for drag/resize. Keep overlap state live
    // during movement rather than waiting until the pointer is released.
    document.addEventListener('pointerdown', scheduleSync, true);
    document.addEventListener('pointermove', scheduleSync, true);
    document.addEventListener('pointerup', scheduleSync, true);
    document.addEventListener('pointercancel', scheduleSync, true);
    window.addEventListener('resize', scheduleSync);

    scheduleSync();
  }

  function init() {
    injectStyles();
    watchDom();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();