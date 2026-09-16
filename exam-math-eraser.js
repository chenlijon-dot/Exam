(() => {
  'use strict';

  const BUTTON_ID = 'paperCanvasEraserBtn';
  const CURSOR_ID = 'paperCanvasEraserCursor';
  const PEN_COLOR = '#111827';
  const PEN_WIDTH = 2.5;
  const ERASER_WIDTH = 34;

  function getNativeBridge() {
    try {
      return window.StudentExamNative || null;
    } catch {
      return null;
    }
  }

  function hasSavedAnswer() {
    const image = document.getElementById('paperAnswerImage');
    const src = image?.getAttribute('src') || '';
    return src.startsWith('data:image/');
  }

  function isNativeInkSession() {
    const bridge = getNativeBridge();
    return !!(
      bridge &&
      typeof bridge.showNativeInkSurface === 'function' &&
      !hasSavedAnswer()
    );
  }

  function hideDebugHud(root = document) {
    const hud = root.querySelector?.('#paperCanvasDebugHud');
    if (hud) {
      hud.style.display = 'none';
      hud.setAttribute('aria-hidden', 'true');
    }
  }

  function setWebCanvasTool(canvas, erasing) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = erasing ? '#ffffff' : PEN_COLOR;
    ctx.lineWidth = erasing ? ERASER_WIDTH : PEN_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function updateButton(button, erasing) {
    button.dataset.eraserActive = erasing ? '1' : '0';
    button.textContent = erasing ? '✏️ 返回筆' : '🧽 橡皮擦';
    button.setAttribute('aria-pressed', erasing ? 'true' : 'false');
    button.style.background = erasing ? '#f59e0b' : '#475569';
    button.style.color = erasing ? '#451a03' : '#ffffff';
  }

  function setNativeEraser(erasing) {
    const bridge = getNativeBridge();
    if (!bridge || typeof bridge.setNativeInkEraserMode !== 'function') {
      return false;
    }

    try {
      bridge.setNativeInkEraserMode(!!erasing);
      return true;
    } catch (error) {
      console.error('[MathEraser] native eraser bridge failed', error);
      return false;
    }
  }

  function createCursor(overlay) {
    let cursor = overlay.querySelector(`#${CURSOR_ID}`);
    if (cursor) return cursor;

    cursor = document.createElement('div');
    cursor.id = CURSOR_ID;
    cursor.style.cssText = [
      'position:fixed',
      'z-index:100005',
      `width:${ERASER_WIDTH}px`,
      `height:${ERASER_WIDTH}px`,
      'margin-left:-17px',
      'margin-top:-17px',
      'border:2px solid rgba(245,158,11,.95)',
      'border-radius:50%',
      'background:rgba(255,255,255,.34)',
      'box-shadow:0 0 0 1px rgba(255,255,255,.65)',
      'pointer-events:none',
      'display:none'
    ].join(';');

    overlay.appendChild(cursor);
    return cursor;
  }

  function installForOverlay(overlay) {
    if (!overlay || overlay.dataset.eraserInstalled === '1') return;

    hideDebugHud(overlay);

    const clearButton = overlay.querySelector('#paperCanvasClearBtn');
    const canvas = overlay.querySelector('#mathPaperCanvas');
    if (!clearButton || !canvas) return;

    overlay.dataset.eraserInstalled = '1';

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.textContent = '🧽 橡皮擦';
    button.setAttribute('aria-pressed', 'false');
    button.style.cssText = 'border:0;border-radius:10px;padding:9px 11px;font-weight:800;background:#475569;color:white;white-space:nowrap;touch-action:manipulation';

    clearButton.parentNode.insertBefore(button, clearButton);

    const cursor = createCursor(overlay);
    let erasing = false;

    function hideCursor() {
      cursor.style.display = 'none';
    }

    function moveCursor(event) {
      if (!erasing || isNativeInkSession()) {
        hideCursor();
        return;
      }

      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
      cursor.style.display = 'block';
    }

    button.addEventListener('click', () => {
      const next = !erasing;

      if (isNativeInkSession()) {
        if (!setNativeEraser(next)) {
          alert('目前這個 Student Exam App 的原生手寫畫布尚未加入橡皮擦橋接。一般手機／瀏覽器的網頁畫布橡皮擦已可直接使用。');
          return;
        }
      } else {
        setWebCanvasTool(canvas, next);
      }

      erasing = next;
      updateButton(button, erasing);
      if (!erasing) hideCursor();
    });

    canvas.addEventListener('pointerdown', moveCursor, { passive: true });
    canvas.addEventListener('pointermove', moveCursor, { passive: true });
    canvas.addEventListener('pointerup', hideCursor, { passive: true });
    canvas.addEventListener('pointercancel', hideCursor, { passive: true });
    canvas.addEventListener('pointerleave', hideCursor, { passive: true });

    clearButton.addEventListener('click', () => {
      if (!isNativeInkSession()) {
        requestAnimationFrame(() => setWebCanvasTool(canvas, erasing));
      }
    });

    const doneButton = overlay.querySelector('#paperCanvasDoneBtn');
    const cancelButton = overlay.querySelector('#paperCanvasCancelBtn');

    const resetTool = () => {
      hideCursor();
      if (erasing && isNativeInkSession()) setNativeEraser(false);
    };

    doneButton?.addEventListener('click', resetTool, { once: true });
    cancelButton?.addEventListener('click', resetTool, { once: true });
  }

  function scan() {
    hideDebugHud(document);
    installForOverlay(document.getElementById('mathPaperCanvasOverlay'));
  }

  const observer = new MutationObserver(scan);

  function start() {
    scan();
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
