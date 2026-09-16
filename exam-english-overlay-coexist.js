(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  let rafPending = false;

  function injectStyles() {
    if ($('#englishOverlayCoexistStyles')) return;

    const style = document.createElement('style');
    style.id = 'englishOverlayCoexistStyles';
    style.textContent = `
      /*
       * These are draggable study windows, not two independent full-screen
       * modals. A single shared backdrop keeps the page dimmed exactly once.
       */
      #englishStudyBackdrop {
        position: fixed;
        inset: 0;
        z-index: 9900;
        background: rgba(15,23,42,.48);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity .14s ease, visibility .14s ease;
      }

      #englishStudyBackdrop.show {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
      }

      /* Neutralize the original per-window full-screen backdrops. */
      #geptPassageModal,
      #englishAiModal {
        background: transparent !important;
        pointer-events: none !important;
      }

      #geptPassageModal .gept-passage-dialog,
      #englishAiModal .english-ai-dialog {
        pointer-events: auto !important;
      }

      /* Lock the exam page while at least one study window is open. */
      html.english-study-window-open,
      body.english-study-window-open {
        overflow: hidden !important;
      }

      /* Passage and AI cards remain fully bright while separated. */
      #geptPassageModal .gept-passage-dialog {
        filter: none;
        opacity: 1;
        transition: filter .14s ease, box-shadow .14s ease;
      }

      /* AI is the foreground study tool. Only when its card physically covers
         the passage card do we darken the passage itself. Do not use opacity:
         translucency made the old window look washed-out rather than inactive. */
      #geptPassageModal .gept-passage-dialog.ai-window-overlap {
        filter: brightness(.68) saturate(.80);
        box-shadow: 0 18px 52px rgba(15,23,42,.24);
      }

      /* Make passage scrolling reliable inside its max-height flex dialog. */
      #geptPassageModal .gept-passage-body {
        flex: 1 1 auto;
        min-height: 0;
        overscroll-behavior: contain;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureBackdrop() {
    let backdrop = $('#englishStudyBackdrop');
    if (backdrop) return backdrop;

    backdrop = document.createElement('div');
    backdrop.id = 'englishStudyBackdrop';
    backdrop.setAttribute('aria-hidden', 'true');

    /*
     * Deliberately do not close either window when the backdrop is clicked.
     * With two movable windows this was a major source of accidental passage
     * closure: a click outside the AI card used to fall through to the passage
     * modal's backdrop handler. Explicit X / Escape is predictable instead.
     */
    backdrop.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
    });

    document.body.appendChild(backdrop);
    return backdrop;
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

    // A tiny border touch should not flash the passage between bright/dark.
    return (right - left) > 8 && (bottom - top) > 8;
  }

  function syncWindowState() {
    rafPending = false;

    const backdrop = ensureBackdrop();
    const passageModal = $('#geptPassageModal');
    const passageDialog = $('.gept-passage-dialog', passageModal);
    const aiModal = $('#englishAiModal');
    const aiDialog = $('.english-ai-dialog', aiModal);

    const passageOpen = visible(passageModal) && visible(passageDialog);
    const aiOpen = visible(aiModal) && visible(aiDialog);
    const anyOpen = passageOpen || aiOpen;
    const coexist = passageOpen && aiOpen;

    backdrop.classList.toggle('show', anyOpen);
    backdrop.setAttribute('aria-hidden', anyOpen ? 'false' : 'true');
    document.documentElement.classList.toggle('english-study-window-open', anyOpen);
    document.body.classList.toggle('english-study-window-open', anyOpen);

    // Two aria-modal="true" dialogs at the same time is contradictory. When
    // both study windows coexist, treat them as modeless floating tools inside
    // one shared modal layer. A single open window keeps normal modal semantics.
    passageDialog?.setAttribute('aria-modal', passageOpen && !coexist ? 'true' : 'false');
    aiDialog?.setAttribute('aria-modal', aiOpen && !coexist ? 'true' : 'false');

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
    requestAnimationFrame(syncWindowState);
  }

  function closeTopStudyWindowOnEscape(event) {
    if (event.key !== 'Escape') return;

    const passageModal = $('#geptPassageModal');
    const passageDialog = $('.gept-passage-dialog', passageModal);
    const aiModal = $('#englishAiModal');
    const aiDialog = $('.english-ai-dialog', aiModal);
    const passageOpen = visible(passageModal) && visible(passageDialog);
    const aiOpen = visible(aiModal) && visible(aiDialog);

    if (!passageOpen && !aiOpen) return;

    /* Stop the two original document-level Escape handlers from both firing.
       AI is always the foreground window, so close it first. */
    event.preventDefault();
    event.stopImmediatePropagation();

    if (aiOpen) {
      $('.english-ai-close', aiModal)?.click();
    } else if (passageOpen) {
      $('.gept-passage-close', passageModal)?.click();
    }

    scheduleSync();
  }

  function watchDom() {
    const observer = new MutationObserver(scheduleSync);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    // Keep overlap feedback live while either window is dragged or resized.
    document.addEventListener('pointerdown', scheduleSync, true);
    document.addEventListener('pointermove', scheduleSync, true);
    document.addEventListener('pointerup', scheduleSync, true);
    document.addEventListener('pointercancel', scheduleSync, true);
    document.addEventListener('keydown', closeTopStudyWindowOnEscape, true);
    window.addEventListener('resize', scheduleSync);

    scheduleSync();
  }

  function loadMathEraserSupport() {
    if (document.getElementById('mathHandwritingEraserScript')) return;

    const script = document.createElement('script');
    script.id = 'mathHandwritingEraserScript';
    script.src = `exam-math-eraser.js?v=${Date.now()}`;
    script.defer = true;
    document.head.appendChild(script);
  }

  function init() {
    injectStyles();
    ensureBackdrop();
    watchDom();
    loadMathEraserSupport();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();