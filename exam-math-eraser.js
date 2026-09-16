(() => {
  'use strict';

  const BUTTON_ID = 'paperCanvasEraserBtn';
  const PEN_COLOR = '#111827';
  const PEN_WIDTH = 2.5;
  const ERASER_WIDTH = 30;

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

  function installForOverlay(overlay) {
    if (!overlay || overlay.dataset.eraserInstalled === '1') return;

    const clearButton = overlay.querySelector('#paperCanvasClearBtn');
    const canvas = overlay.querySelector('#mathPaperCanvas');
    if (!clearButton || !canvas) return;

    overlay.dataset.eraserInstalled = '1';

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.textContent = '🧽 橡皮擦';
    button.style.cssText = 'border:0;border-radius:10px;padding:9px 13px;font-weight:800;background:#475569;color:white;white-space:nowrap';

    clearButton.parentNode.insertBefore(button, clearButton);

    let erasing = false;

    button.addEventListener('click', () => {
      const next = !erasing;

      if (isNativeInkSession()) {
        if (!setNativeEraser(next)) {
          alert('目前這個 Student Exam App 的原生手寫畫布尚未加入橡皮擦橋接。網站版橡皮擦已完成；App 更新原生橋接後就會直接啟用。');
          return;
        }
      } else {
        setWebCanvasTool(canvas, next);
      }

      erasing = next;
      updateButton(button, erasing);
    });

    clearButton.addEventListener('click', () => {
      if (!isNativeInkSession()) {
        requestAnimationFrame(() => setWebCanvasTool(canvas, erasing));
      }
    });

    const doneButton = overlay.querySelector('#paperCanvasDoneBtn');
    const cancelButton = overlay.querySelector('#paperCanvasCancelBtn');

    const resetNativeTool = () => {
      if (erasing) setNativeEraser(false);
    };

    doneButton?.addEventListener('click', resetNativeTool, { once: true });
    cancelButton?.addEventListener('click', resetNativeTool, { once: true });
  }

  function scan() {
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
